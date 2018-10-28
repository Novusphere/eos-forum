class PostReddit {
    constructor(reddit) {
        this.author = "";
        this.permalink = "";

        if (reddit && reddit.author && reddit.permalink) {
            this.author = reddit.author;
            this.permalink = reddit.permalink;
        }
    }
}

export { PostReddit };