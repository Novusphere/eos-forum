import { GetEOS, GetIdentity, ExecuteEOSActions } from "@/eos";
import { GetNovusphere } from "@/novusphere";
import { moderation } from "@/moderation";
import { GetUserIcons } from "@/usericon";

import { Post } from "@/types/post";

import {
    MAX_ITEMS_PER_PAGE,
} from "@/ui/constants";

import { storage } from "@/storage";

export default async function UserProfile(current_page, account, sorter) {    
    var benchmark = (new Date()).getTime();
    
    current_page = parseInt(current_page ? current_page : 1);
    var is_blocked = await moderation.isBlocked(0, null, account);
    var is_followed = storage.following.includes(account);

    const eos = GetEOS();
    const novusphere = GetNovusphere();

    var balance_atmos = parseFloat(
        (await eos.rpc.get_currency_balance("novusphereio", account, "ATMOS"))[0]
    );
    balance_atmos = (isNaN(balance_atmos) ? 0 : balance_atmos).toFixed(3);

    console.log(`loaded (1) in ${(new Date()).getTime() - benchmark} ms`);

    var n_comments = (await novusphere.api({
        count: novusphere.config.collection_forum,
        maxTimeMS: 10000,
        query: novusphere.query.match.postsByAccount(account, true)
    })).n;

    console.log(`loaded (2) in ${(new Date()).getTime() - benchmark} ms`);

    var n_threads = (await novusphere.api({
        count: novusphere.config.collection_forum,
        maxTimeMS: 10000,
        query: novusphere.query.match.threadsByAccount(account)
    })).n;

    console.log(`loaded (3) in ${(new Date()).getTime() - benchmark} ms`);

    var pages = Math.ceil((n_comments + n_threads) / MAX_ITEMS_PER_PAGE);

    const identity = await GetIdentity();

    var posts = (await novusphere.api({
        aggregate: novusphere.config.collection_forum,
        maxTimeMS: 10000,
        cursor: {},
        pipeline: [
            { $match: novusphere.query.match.postsByAccount(account, false) },
            { $sort: sorter }, // [1] -- note: assume sort by time
            { $skip: novusphere.query.skip.page(current_page, MAX_ITEMS_PER_PAGE) },
            { $limit: MAX_ITEMS_PER_PAGE },
            { $lookup: novusphere.query.lookup.postState() }, // [2]
            {
                $project: novusphere.query.project.post({
                    normalize_up: true,
                    score: true 
                })
            },
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

    console.log(`loaded (4) in ${(new Date()).getTime() - benchmark} ms`);

    posts = await Post.fromArray(posts);

    var last_activity = posts.length > 0
        ? new Date(posts[0].createdAt * 1000).toLocaleString()
        : "N/A";

    var user_icons = await GetUserIcons(account);

    console.log(`loaded (5) in ${(new Date()).getTime() - benchmark} ms`);

    return {
        current_page: current_page,
        account: account,
        user_icons: user_icons,
        is_blocked: is_blocked,
        is_followed: is_followed,
        balance_atmos: balance_atmos,
        n_comments: n_comments,
        n_threads: n_threads,
        last_activity: last_activity,
        posts: posts,
        pages: pages
    }
}