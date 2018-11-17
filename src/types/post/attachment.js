import requests from "@/requests";

function GetHost(href) {
    if (href.indexOf("magnet:") == 0) {
        return "magnet link";
    }
    var parser = document.createElement("a");
    parser.href = href;
    return parser.host.toLowerCase();
}

async function OEmbed(url) {
    url = 'https://cors.io/?' + url;
    var oembed = null; 
    
    try { oembed = JSON.parse(await requests.get(url)); }
    catch (ex) { return null; }

    var src = oembed.html.match(/src=\".+\"/);

    if (src) {
        src = src[0].substring(5);
        src = src.substring(0, src.indexOf("\""));

        return {
            src: src,
            thumbnail: oembed.thumbnail_url,
            width: oembed.width,
            height: oembed.height
        }
    }
    return null;
}

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
        var oembed = null;

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
                var host = GetHost(attachment.value);
                if (host == 'youtu.be') {
                    var split = attachment.value.split('/');
                    attachment.value = 'https://www.youtube.com/?v=' + split[split.length - 1];
                    host = 'youtube.com';
                }
                if (host == 'youtube.com' || host == 'www.youtube.com') {
                    oembed = await OEmbed('https://www.youtube.com/oembed?format=json&url='+attachment.value);
                }
                if (host == 'i.imgur.com') {
                    attachment.display = 'img';
                }
                if (host == 'i.redd.it') {
                    attachment.display = 'img';
                }
                if (host == 'twitter.com') {
                    attachment.value = 'https://twitframe.com/show?url=' + attachment.value;
                    attachment.width = 560;
                    attachment.height = 400;
                    attachment.display = 'iframe';
                }
                if (host == 'd.tube') {
                    var url = attachment.value.replace('/#!/', '/');
                    oembed = await OEmbed('https://api.d.tube/oembed?url=' + url);
                }
                if (host == 'soundcloud.com') {
                    oembed = await OEmbed('https://soundcloud.com/oembed?format=json&url=' + attachment.value);
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
                if (attachment.value.indexOf('http:') == 0) {
                    attachment.value = 'https:' + attachment.value.substring(5);
                }

                if (!(attachment.width) && !(attachment.height)) {
                    attachment.width = 560;
                    attachment.height = 315;
                }
            }
        }

        if (oembed)
        {
            attachment.thumbnail = oembed.thumbnail;
            attachment.width = oembed.width;
            attachment.height = oembed.height;
            attachment.value = oembed.src;
            attachment.display = 'iframe';
        }

        if (attachment.display == 'img' && !attachment.thumbnail) {
            attachment.thumbnail = attachment.value;
        }
    }
}

export { PostAttachment };