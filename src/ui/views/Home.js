import { GetEOS, GetIdentity, ExecuteEOSActions } from "@/eos";
import { GetNovusphere } from "@/novusphere";
import { storage, SaveStorage } from "@/storage";
import { moderation } from "@/moderation";

import { Post } from "@/types/post";

import {
    MAX_ITEMS_PER_PAGE,
} from "@/ui/constants";

import Referendum from "./Referendum";

export default async function Home(current_page, sub, sorter) {
    var benchmark = (new Date()).getTime();
    
    if (sub && sub.toLowerCase() == 'referendum') {
        return Referendum(current_page, sorter);
    }

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
        maxTimeMS: 7500,
        query: novusphere.query.match.threadsBySub(sub, blocked_accounts)
    })).n;

    //console.log(`loaded (1) in ${(new Date()).getTime() - benchmark} ms`);

    var num_pages = Math.ceil(n_posts / MAX_ITEMS_PER_PAGE);
    const identity = await GetIdentity();

    var threads = (await novusphere.api({
        aggregate: novusphere.config.collection_forum,
        maxTimeMS: 7500,
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
                    total_replies: true,
                    tip_replies_only: true,
                    score: false
                })
            },
        ]
    })).cursor.firstBatch;

    
    //console.log(`loaded (2) in ${(new Date()).getTime() - benchmark} ms`);

    var _pinned_threads = await moderation.getPinned(sub); // txids
    var pinned_threads = (await novusphere.api({
        aggregate: novusphere.config.collection_forum,
        maxTimeMS: 7500,
        cursor: {},
        pipeline: [
            { $match: novusphere.query.match.threadById(_pinned_threads) },
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
                    total_replies: true,
                    tip_replies_only: true
                })
            }
        ]
    })).cursor.firstBatch;

    //console.log(_pinned_threads);

    _pinned_threads = _pinned_threads
        .map(txid => pinned_threads.find(pt => pt.transaction == txid))
        .filter(pt => pt);

    //console.log(_pinned_threads.map(t => t.transaction + ' ' + t.data.json_metadata.title)); // == _pinned_threads[0].transaction));
    //console.log(threads.map(t => t.transaction + ' ' + t.data.json_metadata.title)); // == _pinned_threads[0].transaction));

    //console.log(`loaded (3) in ${(new Date()).getTime() - benchmark} ms`);

    threads = await Post.fromArray(Array.concat(
        _pinned_threads,
        threads.filter(t => !_pinned_threads.find(t2 => t2.transaction == t.transaction))
    )); 

    for (var i = 0; i < threads.length; i++) {
        var post = threads[i];
        if (i < pinned_threads.length) {
            post.is_pinned = true;
        }

        // so that tips show up
        if (post.replies && post.replies.length > 0) {
            for (var j = 0; j < post.replies.length; j++) {
                if (post.replies[j].data.json_metadata.parent_uuid == post.data.post_uuid) {
                    var r = new Post(post.replies[j]);
                    await r.normalize();
                    post.children.push(r);
                }
            } 
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

    
    //console.log(`loaded (4) in ${(new Date()).getTime() - benchmark} ms`);

    return {
        is_subscribed: storage.subscribed_subs.includes(sub),
        posts: threads,
        pages: num_pages,
        current_page: current_page,
        sub: Array.isArray(sub) ? "" : sub
    };
}