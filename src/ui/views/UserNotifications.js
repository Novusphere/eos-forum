import { GetEOS, GetIdentity, ExecuteEOSActions } from "@/eos";
import { GetNovusphere } from "@/novusphere";

import { Post } from "@/types/post";

import {
    MAX_ITEMS_PER_PAGE,
} from "@/ui/constants";

export default async function UserNotifications(current_page) {
    current_page = parseInt(current_page ? current_page : 1);

    const novusphere = GetNovusphere();
    const identity = await GetIdentity();

    if (!identity.account) {
        return {
            pages: 0,
            posts: []
        }
    }

    var n_notifications = (await novusphere.api({
        count: novusphere.config.collection_forum,
        maxTimeMS: 1000,
        query: novusphere.query.match.notifications(identity.account)
    })).n;

    var pages = Math.ceil(n_notifications / MAX_ITEMS_PER_PAGE);

    var posts = (await novusphere.api({
        aggregate: novusphere.config.collection_forum,
        maxTimeMS: 1000,
        cursor: {},
        pipeline: [
            { $match: novusphere.query.match.notifications(identity.account) },
            { $lookup: novusphere.query.lookup.postState() },
            { $lookup: novusphere.query.lookup.postParent() },
            {
                $project: novusphere.query.project.post({
                    normalize_up: true,
                    normalize_parent: true
                })
            },
            { $sort: novusphere.query.sort.time() },
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
        current_page: current_page,
        pages: pages,
        posts: posts
    }
}