import { GetEOS, GetIdentity, ExecuteEOSActions } from "@/eos";
import { GetNovusphere } from "@/novusphere";
import { storage, SaveStorage } from "@/storage";
import { moderation } from "@/moderation";

import { Post } from "@/types/post";

import {
    MAX_ITEMS_PER_PAGE,
} from "@/ui/constants";

export default async function Feed(current_page) {
    var benchmark = (new Date()).getTime();

    current_page = parseInt(current_page ? current_page : 1);

    // ---

    var novusphere = GetNovusphere();
    var apiResult;

    console.log(storage.following);

    var n_posts = (await novusphere.api({
        count: novusphere.config.collection_forum,
        maxTimeMS: 7500,
        query: novusphere.query.match.feed(storage.following)
    })).n;

    var num_pages = Math.ceil(n_posts / MAX_ITEMS_PER_PAGE);
    const identity = await GetIdentity();

    var posts = (await novusphere.api({
        aggregate: novusphere.config.collection_forum,
        maxTimeMS: 10000,
        cursor: {},
        pipeline: [
            { $match: novusphere.query.match.feed(storage.following) },
            { $lookup: novusphere.query.lookup.postState() },
            {
                $project: novusphere.query.project.post({
                    normalize_up: true,
                    score: true 
                })
            },
            { $sort: novusphere.query.sort.time() },
            { $skip: novusphere.query.skip.page(current_page, MAX_ITEMS_PER_PAGE) },
            { $limit: MAX_ITEMS_PER_PAGE },
            { $lookup: novusphere.query.lookup.postReplies() },
            { $lookup: novusphere.query.lookup.postMyVote(identity.account) },
            { $lookup: novusphere.query.lookup.postParent() },
            {
                $project: novusphere.query.project.post({
                    normalize_my_vote: true,
                    normalize_parent: true,
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
        current_page: current_page
    };
}