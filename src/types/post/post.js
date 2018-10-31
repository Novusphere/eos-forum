import { storage } from "@/storage";

import { GetEOS, EOSBinaryReader } from "@/eos";

import { PostReddit } from "./reddit";
import { PostAttachment } from "./attachment";
import { PostJsonMetadata } from "./jsonmetadata";
import { PostData } from "./data";

async function DecensorData(txid, data) {
    if (!txid) {
        return null;
    }
    
    if (data && data.content) { // doesn't need to be decensored
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

    static sortChildren(posts) {
        for (var i = 0; i < posts.length; i++) {
            posts[i].children.sort((a, b) => b.score - a.score);
        }    
    }

    constructor(post) { // post is from mongodb

        post = Object.assign({

            createdAt: 0,
            transaction: "",
            id: 0,
            data: null,
            up: 0,
            up_atmos: 0,
            total_replies: 0,
            recent_edit: null,
            parent: null,
            my_vote: null

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