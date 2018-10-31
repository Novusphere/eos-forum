import { GetEOS, GetIdentity, ExecuteEOSActions } from "@/eos";
import { GetNovusphere } from "@/novusphere";
import { moderation } from "@/moderation";

import { Post } from "@/types/post";

import {
    MAX_ITEMS_PER_PAGE,
} from "@/ui/constants";

export default async function UserProfile(current_page, account, sorter) {
    current_page = parseInt(current_page ? current_page : 1);
    var is_blocked = await moderation.isBlocked(0, null, account);

    const eos = GetEOS();
    const novusphere = GetNovusphere();

    var balance_atmos = parseFloat(
        (await eos.getCurrencyBalance("novusphereio", account, "ATMOS"))[0]
    );
    balance_atmos = (isNaN(balance_atmos) ? 0 : balance_atmos).toFixed(3);

    var n_comments = (await novusphere.api({
        count: novusphere.config.collection_forum,
        maxTimeMS: 1000,
        query: novusphere.query.match.postsByAccount(account, true)
    })).n;

    var n_threads = (await novusphere.api({
        count: novusphere.config.collection_forum,
        maxTimeMS: 1000,
        query: novusphere.query.match.threadsByAccount(account)
    })).n;

    var pages = Math.ceil((n_comments + n_threads) / MAX_ITEMS_PER_PAGE);

    const identity = await GetIdentity();

    var posts = (await novusphere.api({
        aggregate: novusphere.config.collection_forum,
        maxTimeMS: 5000,
        cursor: {},
        pipeline: [
            { $match: novusphere.query.match.postsByAccount(account, false) },
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

    var last_activity = posts.length > 0
        ? new Date(posts[0].createdAt * 1000).toLocaleString()
        : "N/A";

    return {
        current_page: current_page,
        account: account,
        is_blocked: is_blocked,
        balance_atmos: balance_atmos,
        n_comments: n_comments,
        n_threads: n_threads,
        last_activity: last_activity,
        posts: posts,
        pages: pages
    }
}