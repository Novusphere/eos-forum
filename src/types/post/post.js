import { storage } from "@/storage";
import ui from "@/ui";
import requests from "@/requests";

import { GetEOS, EOSBinaryReader, GetTokensInfo, GetTokenPrecision } from "@/eos";

import { PostReddit } from "./reddit";
import { PostAttachment } from "./attachment";
import { PostJsonMetadata } from "./jsonmetadata";
import { PostData } from "./data";

// https://github.com/eoscanada/EEPs/blob/master/EEPS/eep-4.md
const REFERENDUM_TYPES = [
    'referendum-v1',
    'poll-yn-v1',
    'poll-yna-v1',
    'options-v1',
    'multi-select-v1',
];

const REFERENDUM_OPTIONS_YN = ['no', 'yes'];
const REFERENDUM_OPTIONS_YNA = ['no', 'yes', 'abstain'];

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

            this.setReferendum(post, post);

            post.data = {
                poster: data.proposer,
                post_uuid: 'ref-' + post.transaction,
                content: '',
                reply_to_poster: '',
                reply_to_post_uuid: '',
                certify: 0,
                json_metadata: {
                    title: data.title,
                    type: "novusphere-forum",
                    sub: 'referendum',
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
            score: 0,
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
            tags: [],
            replies: []

        }, post);

        this._post = post;

        this.score = post.score;
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
        this.tips = [];
        this.replies = post.replies;

        if (storage.settings.atmos_upvotes) {
            this.up = Math.floor(this.up + (post.up_atmos ? post.up_atmos : 0));
        }

        // will be set when normalized
        this.data = new PostData(null, this.createdAt);

        this.o_transaction = this.transaction;
        this.o_id = this.id;
        this.o_attachment = new PostAttachment(this.data.json_metadata.attachment);
    }

    setReferendum(post, src) {
        post.referendum = {
            transaction: src.transaction,
            type: src.data.proposal_json.type || REFERENDUM_TYPES[0],
            name: src.data.proposal_name,
            content: src.data.proposal_json.content,
            expired: Array.isArray(src.expired) ? (src.expired.length > 0) : src.expired,
            expires_at: src.data.expires_at,
            options: [],
            details: null
        };

        // set to default so we know how to display
        if (!REFERENDUM_TYPES.some(o => o == post.referendum.type)) {
            post.referendum.type = REFERENDUM_TYPES[0];
        }

        if (post.referendum.type == REFERENDUM_TYPES[0] || post.referendum.type == REFERENDUM_TYPES[1]) // yn
            post.referendum.options = REFERENDUM_OPTIONS_YN;
        else if (post.referendum.type == REFERENDUM_TYPES[2]) // yna
            post.referendum.options = REFERENDUM_OPTIONS_YNA;
        else if (post.referendum.type == REFERENDUM_TYPES[3]) // options
            post.referendum.options = (src.data.proposal_json.options || REFERENDUM_OPTIONS_YN).slice(0, 255);
        else if (post.referendum.type == REFERENDUM_TYPES[4]) // multi
            post.referendum.options = (src.data.proposal_json.options || REFERENDUM_OPTIONS_YN).slice(0, 8);
    }

    async setReferendumDetails() {
        if (this.referendum) {
            if (isNaN(this.referendum.expires_at)) {
                this.referendum.expires_at = (new Date(this.referendum.expires_at)).getTime() / 1000;
            }

            if (this.referendum.expires_at <= (new Date()).getTime() / 1000) {
                this.referendum.expired = true;
            }

            const rcache = await GetReferendumCache();
            const eosvotes = rcache.active;
            const status = eosvotes[this.referendum.name];

            var votes = {};

            for (var i = 0; i < this.referendum.options.length; i++) {
                votes[i] = { value: 0, percent: 0 };
            }

            if (status) {
                var staked_total = status.stats.staked.total;

                if (this.referendum.type == REFERENDUM_TYPES[4]) { // multi
                    staked_total = 0;
                }

                for (var vote_value in status.stats.staked) {
                    if (vote_value == 'total') {
                        continue;
                    }

                    var vote_result = status.stats.staked[vote_value];
                    vote_result = (isNaN(vote_result) ? 0 : parseInt(vote_result)) / 10000;

                    if (this.referendum.type == REFERENDUM_TYPES[4]) { // multi

                        for (var i = 0; i < this.referendum.options.length; i++) {
                            if ((vote_value & (1 << i)) != 0) {
                                if (i in votes)
                                    votes[i].value += vote_result;
                                else
                                    votes[i] = { value: vote_result, percent: 0 };

                                staked_total += vote_result * 10000;
                            }
                        }

                    }
                    else {
                        if (vote_value in votes) {
                            votes[vote_value].value = vote_result;
                        }
                        else {
                            //console.log(status);
                            //console.log(vote_value);
                        }
                    }
                }

                for (var vote_value in votes) {
                    const vote_result = votes[vote_value].value;
                    const percent = staked_total > 0 ? (100 * vote_result / (staked_total / 10000)) : 0;
                    votes[vote_value].percent = percent.toFixed(1);
                }
            }

            this.referendum.details = {
                votes: votes,
                total_participants: status ? status.stats.votes.total : 0,
                total_eos: (status ? status.stats.staked.total : 0) / 10000,
            }
        }
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

        await this.detectAttachment();
        await this.setReferendumDetails();
        await this.data.json_metadata.attachment.normalize();
        this.detectTip(); // load without waiting in context (await)
    }

    async detectTip() {
        if (this.data.json_metadata.edit) {
            return;
        }

        if (this.tags.includes('tip')) {
            const eos = GetEOS();
            const tx = await eos.getTransaction(this.transaction);
            const actions = tx.trx.trx.actions;

            for (var i = 0; i < actions.length; i++) {
                if (actions[i].name == 'transfer') {

                    var rdr = new EOSBinaryReader(actions[i].hex_data);

                    const from = rdr.readName();
                    const to = rdr.readName();

                    // this should really be an i64
                    var amount = rdr.readInt32();
                    rdr.readInt32();

                    rdr.readByte(); // ?
                    const asset_name = rdr.readString(7).replace(/\0/g, '');

                    const memo = rdr.readString();

                    const precision = await GetTokenPrecision(eos, actions[i].account, asset_name);

                    amount = (amount / Math.pow(10, precision)).toFixed(precision);

                    this.tips.push({
                        from: from,
                        to: to,
                        amount: amount,
                        memo: memo,
                        symbol: asset_name,
                        contract: actions[i].account
                    });
                }
            }

            //console.log(JSON.stringify(this.tips));
        }
    }

    getContent() {
        var str = this.data.content || '';
        if (this.referendum) {
            if (str) {
                str += '\n\n---\n\n';
            }
            str += this.referendum.content;;
        }
        return str;
    }

    async detectAttachment() {
        var attachment = this.data.json_metadata.attachment;

        if (attachment.value &&
            attachment.display == 'referendum') {

            const rp = await ui.actions.Referendum.GetProposal(attachment.value);
            if (rp) {
                this.setReferendum(this, rp);
            }

            return;
        }

        // detect automatic

        if (attachment.value) {
            return;
        }

        var attach = (v, t, d) => {
            attachment.value = v;
            attachment.type = t;
            attachment.display = d;
        }

        const filters = [
            { // youtube
                match: /https:\/\/youtu.be\/[a-zA-Z0-9-_]+/i,
                handle: (m) => attach(m[0], 'url', 'link')
            },
            { // youtube 2
                match: /https:\/\/www.youtube.com\/watch\?v=[a-zA-Z0-9-_]+/i,
                handle: (m) => attach(m[0], 'url', 'link')
            },
            {
                match: /https:\/\/twitter.com\/[a-zA-Z0-9-_]+\/status\/[0-9]+/i,
                handle: (m) => attach(m[0], 'url', 'link')
            }
        ];

        for (var i = 0; i < filters.length; i++) {
            const f = filters[i];
            const match = this.data.content.match(f.match);
            if (match && match.length > 0) {
                f.handle(match);
                break;
            }
        }
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
            await this.detectAttachment();
            await this.setReferendumDetails();
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
        var friendly = title;
        friendly = friendly.replace(/ /g, "_");
        return friendly;
    }

    addChild(p) {
        p.depth = this.depth + 1;
        this.children.push(p);
    }
}

export { Post };