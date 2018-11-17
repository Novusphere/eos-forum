import { storage } from "@/storage";
import requests from "@/requests";

import { GetEOS, EOSBinaryReader } from "@/eos";

import { PostReddit } from "./reddit";
import { PostAttachment } from "./attachment";
import { PostJsonMetadata } from "./jsonmetadata";
import { PostData } from "./data";

var referendum_cache = null;

async function GetReferendumCache() {
    const now = (new Date()).getTime();
    if (referendum_cache == null || (now - referendum_cache.last >= 60000)) {

        var eosvotes = JSON.parse(await requests.get('https://s3.amazonaws.com/api.eosvotes.io/eosvotes/tallies/latest.json'));

        referendum_cache = {
            last: now,
            active: eosvotes
        };
    }

    return referendum_cache;
}

async function DecensorData(txid, data) {
    if (!txid) {
        return null;
    }

    if ((data && data.content) || data.name != 'post') { // doesn't need to be decensored
        return data;
    }

    const eos = GetEOS();
    const tx = await eos.getTransaction(txid);

    var hex = tx.trx.trx.actions[0].data;
    var rdr = new EOSBinaryReader(hex);

    var tx_data = {
        poster: rdr.readName(),
        post_uuid: rdr.readString(),
        content: rdr.readString(),
        reply_to_poster: rdr.readName(),
        reply_to_post_uuid: rdr.readString(),
        certify: rdr.readVarInt(),
        json_metadata: rdr.readString()
    };

    try {
        tx_data.json_metadata = JSON.parse(tx_data.json_metadata);
    }
    catch (ex) {
        // ...
    }

    return tx_data;
}

class Post {
    static async fromArray(data) {
        var result = data.map(p => (p instanceof Post) ? p : new Post(p));
        await Promise.all(result.map(p => p.normalize()));
        return result;
    }

    static async threadify(main_post, responses) {
        responses.splice(0, 0, main_post);
        responses = await Post.fromArray(responses);

        var commentMap = {};
        var new_posts = 0;
        for (var i = 0; i < responses.length; i++) {
            var p = responses[i];
            commentMap[p.data.post_uuid] = p;

            if (i > 0) {
                p.parent = main_post;

                var tree;
                var parent_uuid = p.data.json_metadata.parent_uuid;
                parent_uuid = parent_uuid ? parent_uuid : main_post.data.post_uuid;

                var parent = commentMap[parent_uuid];

                // if this is is an edit, update parent content
                // check parent content isn't already newest
                // check that this post is actually by the person who made original post
                if (p.data.json_metadata.edit) {
                    if (
                        p.data.poster == parent.data.poster &&
                        p.createdAt > parent.createdAt
                    ) {
                        await parent.applyEdit(p);
                    }
                } else {
                    new_posts++;
                    parent.addChild(p);
                }
            }
        }

        for (var i = 0; i < responses.length; i++) {
            responses[i].children.sort((a, b) => b.score - a.score);
        }

        return new_posts;
    }

    constructor(post) { // post is from mongodb

        // transform referendum proposal into post() data
        if (post && post.name == 'propose') {
            var data = post.data;

            post.referendum = {
                name: post.data.proposal_name,
                expired: Array.isArray(post.expired) ? (post.expired.length>0) : post.expired,
                expires_at: data.expires_at,
                details: null
            };

            post.data = {
                poster: data.proposer,
                post_uuid: 'ref-' + post.transaction,
                content: data.proposal_json.content ? data.proposal_json.content : '',
                reply_to_poster: '',
                reply_to_post_uuid: '',
                certify: 0,
                json_metadata: {
                    title: data.title,
                    type: "novusphere-forum",
                    sub: 'eos-referendum',
                    parent_uuid: '',
                    parent_poster: '',
                    edit: false,
                    attachment: {
                        value: '',
                        type: '',
                        display: ''
                    }
                }
            };
        }

        post = Object.assign({

            createdAt: 0,
            transaction: "",
            name: "post",
            id: 0,
            data: null,
            up: 0,
            up_atmos: 0,
            total_replies: 0,
            recent_edit: null,
            parent: null,
            my_vote: null,
            referendum: null,
            tags: []

        }, post);

        this._post = post;

        this.parent = null;
        this.depth = 0;
        this.is_pinned = false;
        this.new_replies = 0;
        this.children = [];
        this.createdAt = post.createdAt;
        this.transaction = post.transaction;
        this.id = post.id;
        this.up = post.up;
        this.total_replies = post.total_replies;
        this.my_vote = post.my_vote;
        this.referendum = post.referendum;
        this.tags = post.tags;

        if (storage.settings.atmos_upvotes) {
            this.up = Math.floor(this.up + (post.up_atmos ? post.up_atmos : 0));
        }

        // will be set when normalized
        this.data = new PostData(null, this.createdAt);

        this.o_transaction = this.transaction;
        this.o_id = this.id;
        this.o_attachment = new PostAttachment(this.data.json_metadata.attachment);
    }

    async normalize() {
        if (!this._post) {
            return;
        }

        var post = this._post;
        this._post = null;
        post.data = await DecensorData(post.transaction, post.data);

        this.data = new PostData(post.data, this.createdAt);
        this.o_attachment = new PostAttachment(this.data.json_metadata.attachment);

        if (post.recent_edit) {
            await this.applyEdit(post.recent_edit);
        }

        if (post.parent) {
            this.parent = new Post(post.parent);
            await this.parent.normalize();

            this.data.json_metadata.title = this.parent.data.json_metadata.title;
        }

        if (post.referendum) {
            if (isNaN(post.referendum.expires_at)) {
                post.referendum.expires_at = (new Date(post.referendum.expires_at)).getTime() / 1000;
            }

            if (post.referendum.expires_at <= (new Date()).getTime() / 1000) {
                post.referendum.expired = true;
            }

            const rcache = await GetReferendumCache();
            const eosvotes = rcache.active;
            const status = eosvotes[this.referendum.name];

            var rfor = 0, ragainst = 0;
            if (status) {
                rfor = status.stats.staked['1'];
                ragainst = status.stats.staked['0'];

                rfor = (isNaN(rfor) ? 0 : parseInt(rfor)) / 10000;
                ragainst = (isNaN(ragainst) ? 0 : parseInt(ragainst)) / 10000;
            }

            this.referendum.details = {
                for: rfor,
                against: ragainst,
                for_percent: 100 * (rfor / Math.max(rfor + ragainst, 1)),
                against_percent: 100 * (ragainst / Math.max(rfor + ragainst, 1)),
                total_participants: status ? status.stats.votes.total : 0,
                total_eos: (status ? status.stats.staked.total : 0) / 10000,
            }
        }

        await this.data.json_metadata.attachment.normalize();
    }

    async applyEdit(edit) {
        edit.data = await DecensorData(edit.transaction, edit.data);

        this.createdAt = edit.createdAt;
        this.transaction = edit.transaction;
        this.id = edit.id;

        this.data.content = edit.data.content;
        this.data.json_metadata.edit = true;

        if (edit.data.json_metadata.title) {
            this.data.json_metadata.title = edit.data.json_metadata.title;
        }

        if (edit.data.json_metadata.attachment) {
            this.data.json_metadata.attachment = new PostAttachment(edit.data.json_metadata.attachment);
        }
    }

    getTitle() {
        var title = this.data.json_metadata.title;

        if (
            !title &&
            this.parent &&
            this.parent.data.json_metadata.title
        ) {
            title = this.parent.data.json_metadata.title;
        }

        if (!title) {
            title = "untitled";
        }

        return title;
    }

    getUrlTitle() {
        var title = this.getTitle();
        var friendly = title.replace(/[^a-zA-Z0-9 ]/g, "");
        friendly = friendly.replace(/ /g, "_");
        return friendly;
    }

    addChild(p) {
        p.depth = this.depth + 1;
        this.children.push(p);
    }
}

export { Post };