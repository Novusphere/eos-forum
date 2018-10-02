import jQuery from "jquery";
import Helpers from "@/helpers";

function MigratePost(p) {
    p.depth = 0;
    p.children = [];
    
    p.o_transaction = p.transaction;

    var attachment = p.data.json_metadata.attachment;
    p.o_attachment = jQuery.extend(true, {}, attachment);

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
                attachment.value = 'https://www.youtube.com/?v=' + split[split.length-1];
                host = 'youtube.com';
            }
            if (host == 'youtube.com' || host == 'www.youtube.com') {
                var rx = /v\=[A-Za-z0-9_\-]+/;
                var vid = attachment.value.match(rx);
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
        }

        if (attachment.display == 'iframe') {
            if (!(attachment.width) && !(attachment.height)) {
                attachment.width = 560;
                attachment.height = 315;
            }
        }
    }

    if (p.recent_edit) {
        ApplyPostEdit(p, p.recent_edit);
    }
}

function ApplyPostEdit(parent, p) {
    // if the edit does not set a title, take title from parent
    if (!(p.data.json_metadata.title)) {
        p.data.json_metadata.title = parent.data.json_metadata.title;
    }

    parent.data.content = p.data.content;
    parent.data.json_metadata = p.data.json_metadata;
    parent.createdAt = p.createdAt;
    parent.transaction = p.transaction;
}

function PlaceholderPost() {
    return {
        children: [],
        data: {
            title: '',
            json_metadata: {
                'sub': ''
            },
        }
    };
}

export { MigratePost, PlaceholderPost, ApplyPostEdit };