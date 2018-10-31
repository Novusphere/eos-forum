import { GetEOS, GetIdentity, ExecuteEOSActions } from "@/eos";
import { GetNovusphere } from "@/novusphere";
import { storage, SaveStorage } from "@/storage";
import { moderation } from "@/moderation";

import { Post } from "@/types/post";

import {
    MAX_ITEMS_PER_PAGE,
} from "@/ui/constants";

export default async function Home(current_page, sub, sorter) {

    current_page = parseInt(current_page ? current_page : 1);

    if (!sub) {
        sub = storage.subscribed_subs;
    }

    // ---

    var novusphere = GetNovusphere();
    var apiResult;
    var blocked_accounts = storage.moderation.hide_spam_threads
        ? await moderation.getBlockedAccounts()
        : [];

    var n_posts = (await novusphere.api({
        count: novusphere.config.collection_forum,
        maxTimeMS: 1000,
        query: novusphere.query.match.threadsBySub(sub, blocked_accounts)
    })).n;

    var num_pages = Math.ceil(n_posts / MAX_ITEMS_PER_PAGE);
    const identity = await GetIdentity();

    var threads = (await novusphere.api({
        aggregate: novusphere.config.collection_forum,
        maxTimeMS: 1000,
        cursor: {},
        pipeline: [
            { $match: novusphere.query.match.threadsBySub(sub, blocked_accounts) },
            { $lookup: novusphere.query.lookup.postState() },
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
            { $lookup: novusphere.query.lookup.threadReplies() },
            { $lookup: novusphere.query.lookup.postMyVote(identity.account) },
            {
                $project: novusphere.query.project.post({
                    normalize_my_vote: true,
                    recent_edit: true,
                    total_replies: true
                })
            }
        ]
    })).cursor.firstBatch;

    var pinned_threads = (await novusphere.api({
        aggregate: novusphere.config.collection_forum,
        maxTimeMS: 1000,
        cursor: {},
        pipeline: [
            { $match: novusphere.query.match.threadById(await moderation.getPinned(sub)) },
            { $lookup: novusphere.query.lookup.postState() },
            {
                $project: novusphere.query.project.post({
                    normalize_up: true,
                    normalize_parent: true
                })
            },
            { $lookup: novusphere.query.lookup.threadReplies() },
            { $lookup: novusphere.query.lookup.postMyVote(identity.account) },
            {
                $project: novusphere.query.project.post({
                    normalize_my_vote: true,
                    recent_edit: true,
                    total_replies: true
                })
            }
        ]
    })).cursor.firstBatch;

    threads = await Post.fromArray(Array.concat(
        pinned_threads,
        threads.filter(t => !pinned_threads.find(t2 => t2.id == t.id))
    ));

    for (var i = 0; i < threads.length; i++) {
        var post = threads[i];
        if (i < pinned_threads.length) {
            post.is_pinned = true;
        }

        var old_replies = storage.new_posts[post.data.post_uuid];
        if (old_replies && isNaN(old_replies)) {
            old_replies = old_replies.replies; // migration to new format
        }
        post.new_replies =
            old_replies == undefined
                ? post.total_replies + 1
                : post.total_replies - old_replies;
        post.new_replies = Math.max(post.new_replies, 0); // bug fix
    }

    return {
        is_subscribed: storage.subscribed_subs.includes(sub),
        posts: threads,
        pages: num_pages,
        current_page: current_page,
        sub: Array.isArray(sub) ? "" : sub
    };
}