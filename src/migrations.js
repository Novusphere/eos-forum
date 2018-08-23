function MigratePost(p) {
    p.depth = 0;
    p.children = [];
    p.o_transaction = p.transaction;

    var attachment = p.data.json_metadata.attachment;

    // transform ipfs --> url
    if (attachment && attachment.value && attachment.type == 'ipfs') {
        attachment.type = 'url';
        attachment.value = 'https://gateway.ipfs.io/ipfs/' + attachment.value;
    }

    // migration no longer required, this is mandatory as of 7/15
    /*if (p.createdAt < 1531434299) { // EOS Canada redeployed contract 7/12
        p.data.json_metadata.title = p.data.title; 
        p.data.poster = p.data.account;
        p.data.reply_to_poster = p.data.reply_to_account;
    }*/
}

function TransformPropose(p) {
    var data = p.data;

    // transform to be like a post() data
    p.data = {
        poster: data.proposer,
        post_uuid: data.proposal_name,
        content: data.proposal_json.content,
        reply_to_poster: '',
        reply_to_post_uuid: '',
        certify: 0,
        json_metadata: {
            title: data.title,
            protocol: 'novusphere-forum',
            sub: '',
            parent_uuid: '',
            edit: false,
            attachment: {
                value: '',
                type: '',
                display: ''
            }
        }
    };
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

export { MigratePost, PlaceholderPost, ApplyPostEdit, TransformPropose };