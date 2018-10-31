import { GetEOS, GetIdentity, ExecuteEOSActions } from "@/eos";
import { GetNovusphere } from "@/novusphere";
import { storage, SaveStorage } from "@/storage";

import { Post } from "@/types/post";

export default async function Thread(id, child_id) {
    const novusphere = GetNovusphere();
    const identity = await GetIdentity();

    var main_post = (await novusphere.api({
        aggregate: novusphere.config.collection_forum,
        maxTimeMS: 1000,
        cursor: {},
        pipeline: [
            { $match: novusphere.query.match.threadById(id) },
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

    main_post = new Post(main_post);

    var mp_np = storage.new_posts[main_post.data.post_uuid];
    main_post.__seen = (mp_np) ? mp_np.seen : ((new Date().getTime()) / 1000);

    var responses = (await novusphere.api({
        aggregate: novusphere.config.collection_forum,
        maxTimeMS: 1000,
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
            }
        ]
    })).cursor.firstBatch;

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
                    parent.applyEdit(p);
                }
            } else {
                new_posts++;
                parent.addChild(p);
            }
        }
    }

    Post.sortChildren(responses);

    // only count non-edits for new_posts length
    storage.new_posts[main_post.data.post_uuid] = {
        replies: new_posts,
        seen: new Date().getTime() / 1000
    };
    SaveStorage();

    var op = main_post;

    // permalink child
    if (child_id) {
        var child_post;
        if (child_id.length == 64) {
            child_post = responses.find(p => p.transaction == child_id);
        } else {
            child_id = parseInt(child_id);
            child_post = responses.find(p => p.o_id == child_id);
        }

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
        main_post: main_post
    }
}