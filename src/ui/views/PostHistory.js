import { GetEOS, GetIdentity, ExecuteEOSActions } from "@/eos";
import { GetNovusphere } from "@/novusphere";
import { Post } from "@/types/post";

export default async function PostHistory(txid) {
    const novusphere = GetNovusphere();
    const identity = await GetIdentity();

    var main_post = (await novusphere.api({
        aggregate: novusphere.config.collection_forum,
        maxTimeMS: 1000,
        cursor: {},
        pipeline: [
            { $match: { transaction: txid } },
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
    await main_post.normalize();

    var edits = (await novusphere.api({
        find: novusphere.config.collection_forum,
        maxTimeMS: 1000,
        filter: novusphere.query.match.postEdits(main_post.data.poster, main_post.data.post_uuid),
        sort: novusphere.query.sort.time(true)
    })).cursor.firstBatch;

    edits = await Post.fromArray(edits);

    for (var i = 0; i < edits.length; i++) {
        var p = edits[i];
        p.up = main_post.up;
        p.my_vote = main_post.my_vote;

        main_post.addChild(p);
    }

    return {
        main_post: main_post
    }
}