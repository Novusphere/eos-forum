import { GetEOS, GetIdentity, ExecuteEOSActions } from "@/eos";
import { GetNovusphere } from "@/novusphere";
import { Post } from "@/types/post";

import {
    MAX_ITEMS_PER_PAGE,
} from "@/ui/constants";

export default async function Tag(current_page, tag, sorter) {
    current_page = parseInt(current_page ? current_page : 1);
    tag = (tag).toLowerCase();

    var novusphere = GetNovusphere();

    var n_posts = (await novusphere.api({
        count: novusphere.config.collection_forum,
        maxTimeMS: 1000,
        query: novusphere.query.match.postsByTag(tag)
    })).n;

    var num_pages = Math.ceil(n_posts / MAX_ITEMS_PER_PAGE);
    const identity = await GetIdentity();

    var posts = (await novusphere.api({
        aggregate: novusphere.config.collection_forum,
        maxTimeMS: 1000,
        cursor: {},
        pipeline: [
            { $match: novusphere.query.match.postsByTag(tag) },
            { $lookup: novusphere.query.lookup.postState() },
            { $lookup: novusphere.query.lookup.postParent() },
            {
                $project: novusphere.query.project.post({
                    normalize_up: true,
                    normalize_parent: true,
                    score: true
                })
            },
            { $sort: sorter },
            { $skip: novusphere.query.skip.page(current_page, MAX_ITEMS_PER_PAGE) },
            { $limit: MAX_ITEMS_PER_PAGE },
            { $lookup: novusphere.query.lookup.postReplies() },
            { $lookup: novusphere.query.lookup.postMyVote(identity.account) },
            {
                $project: novusphere.query.project.post({
                    normalize_my_vote: true,
                    recent_edit: true
                })
            },
            { $match: novusphere.query.match.validParent() }
        ]
    })).cursor.firstBatch;

    posts = await Post.fromArray(posts);

    return {
        posts: posts,
        pages: num_pages,
        current_page: current_page,
        tag: tag
    }
}