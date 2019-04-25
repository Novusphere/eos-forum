import { PostJsonMetadata } from "./jsonmetadata";

class PostData {
    constructor(data, createdAt) {

        data = Object.assign({
            poster: "",
            post_uuid: "",
            content: "",
            reply_to_poster: "",
            reply_to_post_uuid: "",
            certify: 0,
            json_metadata: null,
            tags: []
            
        }, data);

        this.poster = data.poster;
        this.post_uuid = data.post_uuid;
        this.content = data.content;
        this.reply_to_poster = data.reply_to_poster; // thread creator
        this.reply_to_post_uuid = data.reply_to_post_uuid; // thread uuid
        this.certify = data.certify;
        this.json_metadata = new PostJsonMetadata(data.json_metadata);
        this.json_metadata.anon_id.verify(this.content);
    }
}

export { PostData };