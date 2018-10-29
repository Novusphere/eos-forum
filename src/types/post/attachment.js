import Helpers from "@/helpers";

class PostAttachment {
    constructor(attachment) {
        this.value = "";
        this.type = "";
        this.display = "";
        this.width = 0;
        this.height = 0;

        if (attachment && attachment.value && attachment.type && attachment.display) {
            this.value = attachment.value;
            this.type = attachment.type;
            this.display = attachment.display;
            this.width = attachment.width ? attachment.width : 0;
            this.height = attachment.height ? attachment.height : 0;
        }
    }

    hasAttachment(type) {
        return (this.display == type);
    }

    isIframe() {
        return this.hasAttachment("iframe");
    }

    isImg() {
        return this.hasAttachment("img");
    }

    isMp4() {
        return this.hasAttachment("mp4");
    }

    isMp3() {
        return this.hasAttachment("mp3");
    }

    isLink() {
        return this.hasAttachment("link");
    }

    async normalize() {
        var attachment = this;
        if (attachment && attachment.value) {
            if (attachment.type == 'ipfs') {
                //
                //  transform ipfs --> url
                //
                attachment.type = 'url';
                attachment.value = 'https://gateway.ipfs.io/ipfs/' + attachment.value;
            }
            else if (attachment.type == 'url') {
                //
                //  transform youtube --> auto embed
                //
                var host = Helpers.GetHost(attachment.value);
                if (host == 'youtu.be') {
                    var split = attachment.value.split('/');
                    attachment.value = 'https://www.youtube.com/?v=' + split[split.length - 1];
                    host = 'youtube.com';
                }
                if (host == 'youtube.com' || host == 'www.youtube.com') {
                    var vid = attachment.value.match(/v\=[A-Za-z0-9_\-]+/);
                    if (vid && vid.length > 0) {
                        attachment.width = 560;
                        attachment.height = 315;
                        attachment.value = 'https://www.youtube.com/embed/' + vid[0].substring(2);
                        attachment.display = 'iframe';
                    }
                }
                if (host == 'i.imgur.com') {
                    attachment.display = 'img';
                }
                if (host == 'twitter.com') {
                    attachment.value = 'https://twitframe.com/show?url=' + attachment.value;
                    attachment.width = 560;
                    attachment.height = 400;
                    attachment.display = 'iframe';
                }
                if (host == 'd.tube') {
                    var vid = attachment.value.indexOf('v/') + 2;
                    attachment.value = 'https://emb.d.tube/#!/' + attachment.value.substring(vid);
                    attachment.width = 560;
                    attachment.height = 400;
                    attachment.display = 'iframe';
                }
                if (host == 'soundcloud.com') {
                    try {
                        var sc_json = await Helpers.AsyncGet('https://soundcloud.com/oembed?format=json&url=' + attachment.value);
                        var sc_src = sc_json.html.match(/src=\".+\"/);
                        if (sc_src.length > 0) {
                            var sc_iframe = sc_src[0].substring(5);
                            sc_iframe = sc_iframe.substring(0, sc_iframe.length - 1);

                            attachment.value = sc_iframe;
                            attachment.width = 560;
                            attachment.height = 300;
                            attachment.display = 'iframe';
                        }
                    }
                    catch (sc_ex) {
                        // pass
                    }
                }
                if (host == 'bitchute.com' || host == 'www.bitchute.com') {
                    var vid = attachment.value.match(/video\/[a-zA-Z0-9]+/);
                    if (vid && vid.length > 0) {
                        attachment.width = 560;
                        attachment.height = 315;
                        attachment.value = 'https://www.bitchute.com/embed/' + vid[0].substring(6);
                        attachment.display = 'iframe';
                    }
                }
            }

            if (attachment.display == 'iframe') {
                if (!(attachment.width) && !(attachment.height)) {
                    attachment.width = 560;
                    attachment.height = 315;
                }
            }
        }
    }
}

export { PostAttachment };