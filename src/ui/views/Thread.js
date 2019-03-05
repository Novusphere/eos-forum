import { GetEOS, GetIdentity, ExecuteEOSActions } from "@/eos";
import { GetNovusphere } from "@/novusphere";
import { storage, SaveStorage } from "@/storage";

import { Post } from "@/types/post";

export default async function Thread(id, child_id) {
    const novusphere = GetNovusphere();
    const identity = await GetIdentity();
    
    var main_post = (await novusphere.api({
        aggregate: novusphere.config.collection_forum,
        maxTimeMS: 7500,
        cursor: {},
        pipeline: [
            { $match: novusphere.query.match.threadById(id) },
            { $limit: 1 },
            { $lookup: novusphere.query.lookup.postState() },
            { $lookup: novusphere.query.lookup.postMyVote(identity.account) },
            {
                $project: novusphere.query.project.post({
                    normalize_up: true,
                    normalize_my_vote: true
                })
            }
        ]
    })).cursor.firstBatch[0];

    // thread not found
    if (!main_post || !main_post.transaction) {
        return {
            opening_post: null,
            main_post: null,
            count: 0
        }
    }

    main_post = new Post(main_post);
    await main_post.normalize();

    if (main_post.data.content.length == ((1024 * 10) - 1)) {
        // look for extension
        var content_ext = (await novusphere.api({
            aggregate: novusphere.config.collection_nsdb,
            maxTimeMS: 7500,
            cursor: {},
            pipeline: [
                {
                    $match: {
                        'data.account': main_post.data.poster,
                        'data.json.method': 'content_ext',
                        'data.json.data.post_uuid': main_post.data.post_uuid
                    }
                }
            ]
        })).cursor.firstBatch[0];

        if (content_ext) {
            // apply extension
            main_post.data.content += content_ext.data.json.data.content;
        }
    }

    var mp_np = storage.new_posts[main_post.data.post_uuid];
    main_post.__seen = (mp_np) ? mp_np.seen : ((new Date().getTime()) / 1000);

    var responses = [];
    var r_skip = 0;

    for (; ;) {
        var _responses = (await novusphere.api({
            aggregate: novusphere.config.collection_forum,
            maxTimeMS: 7500,
            cursor: {},
            pipeline: [
                { $match: novusphere.query.match.threadReplies(main_post.data.post_uuid) },
                { $lookup: novusphere.query.lookup.postState() },
                { $lookup: novusphere.query.lookup.postMyVote(identity.account) },
                {
                    $project: novusphere.query.project.post({
                        normalize_up: true,
                        normalize_my_vote: true
                    })
                },
                { $skip: r_skip }
            ]
        })).cursor.firstBatch;

        r_skip += _responses.length;

        for (var i = 0; i < _responses.length; i++)
            responses.push(_responses[i]);

        if (!_responses || _responses.length == 0 || _responses.length < 100)
            break;
    }

    var threadify = await Post.threadify(main_post, responses);
    var new_posts = threadify.new_posts;
    responses = threadify.responses;

    // only count non-edits for new_posts length
    storage.new_posts[main_post.data.post_uuid] = {
        title: main_post.data.json_metadata.title,
        sub: main_post.data.json_metadata.sub,
        id: main_post.o_id,
        replies: new_posts,
        seen: parseInt(new Date().getTime() / 1000)
    };
    SaveStorage();

    var op = main_post;

    // permalink child
    if (child_id) {

        var child_post;
        if (child_id.length == 64) {
            child_post = responses.find(p => p.o_transaction == child_id);
        } else {
            child_id = parseInt(child_id);
            child_post = responses.find(p => p.o_id == child_id);
        }

        // go one up
        if (child_post.depth >= 1) {
            // remove all other children
            var one_up = threadify.map[child_post.data.json_metadata.parent_uuid];
            one_up.children.length = 0;
            one_up.children.push(child_post);
            
            child_post = one_up;
        }

        child_post.parent = main_post;
        child_post.depth = 0;
        child_post.data.json_metadata.title = main_post.data.json_metadata.title;

        function updateChildDepth(p) {
            for (var j = 0; j < p.children.length; j++) {
                var child = p.children[j];
                child.depth = p.depth + 1;
                updateChildDepth(child);
            }
            return p;
        }

        main_post = updateChildDepth(child_post);
    }

    return {
        opening_post: op,
        main_post: main_post,
        count: responses.length
    }
}