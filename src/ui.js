import { v4 as uuidv4 } from "uuid";

import Helpers from "@/helpers";
import { MarkdownParser } from "@/markdown";
import { GetEOS, GetIdentity, ExecuteEOSActions } from "@/eos";
import { GetEOSService } from "@/eos-service";
import { GetNovusphere } from "@/novusphere";
import { forum } from "@/novusphere-forum";
import { storage, SaveStorage } from "@/storage";
import { moderation } from "@/moderation";

import { Post } from "@/types/post";

const FORUM_CONTRACT = "eosforumdapp";
const MAX_ITEMS_PER_PAGE = 25;
const UPVOTE_ATMOS_RATE = 10; // 1 upvote in ATMOS

var DEFAULT_SUB = "all";
if (window.__PRESETS__ && window.__PRESETS__.default_sub) {
    DEFAULT_SUB = window.__PRESETS__.default_sub;
}

var HEADER_TEXTS = [
    "Did you know you in your **settings** you can toggle between a day and night theme?",
    "Did you know you in your **settings** you can set delegated moderators to help filter spam?",
    "Did you know you can block users who post spam by clicking their name to visit their profile and then clicking block?",
    "Did you know you can post without an account in any of the **anon-** subs?"
];
if (window.__PRESETS__ && window.__PRESETS__.header_texts) {
    HEADER_TEXTS = window.__PRESETS__.header_texts;
}

function GetRandomHeaderText() {
    var header_text = HEADER_TEXTS[Math.floor(Math.random() * HEADER_TEXTS.length)];
    return header_text;
}

async function Home(current_page, sub, sorter) {

    current_page = parseInt(current_page ? current_page : 1);

    if (!sub) {
        sub = DEFAULT_SUB;
    }

    // ---

    var novusphere = GetNovusphere();
    var apiResult;
    var blocked_accounts = storage.moderation.hide_spam_threads
        ? await moderation.getBlockedAccounts()
        : [];

    var n_posts = (await novusphere.api({
        count: novusphere.config.collection,
        maxTimeMS: 1000,
        query: forum.match_threads(sub, blocked_accounts)
    })).n;

    var num_pages = Math.ceil(n_posts / MAX_ITEMS_PER_PAGE);
    const identity = await GetIdentity();

    var threads = (await novusphere.api({
        aggregate: novusphere.config.collection,
        maxTimeMS: 1000,
        cursor: {},
        pipeline: [
            { $match: forum.match_threads(sub, blocked_accounts) },
            { $lookup: forum.lookup_post_state() },
            {
                $project: forum.project_post({
                    normalize_up: true,
                    normalize_parent: true,
                    score: true
                })
            },
            { $sort: sorter },
            { $skip: forum.skip_page(current_page, MAX_ITEMS_PER_PAGE) },
            { $limit: MAX_ITEMS_PER_PAGE },
            { $lookup: forum.lookup_thread_replies() },
            { $lookup: forum.lookup_post_my_vote(identity.account) },
            {
                $project: forum.project_post({
                    normalize_my_vote: true,
                    recent_edit: true,
                    total_replies: true
                })
            }
        ]
    })).cursor.firstBatch;

    var pinned_threads = (await novusphere.api({
        aggregate: novusphere.config.collection,
        maxTimeMS: 1000,
        cursor: {},
        pipeline: [
            { $match: forum.match_thread_txids(await moderation.getPinned(sub)) },
            { $lookup: forum.lookup_post_state() },
            {
                $project: forum.project_post({
                    normalize_up: true,
                    normalize_parent: true
                })
            },
            { $lookup: forum.lookup_thread_replies() },
            { $lookup: forum.lookup_post_my_vote(identity.account) },
            {
                $project: forum.project_post({
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
        sub: sub
    };
}

async function NewThread(sub) {
    const identity = await GetIdentity();
    if (
        identity.account ||
        sub == "anon" ||
        sub.indexOf("anon-") == 0
    ) {
        if (sub == "anon-r-eos") {
            throw ("You cannot make new threads in this sub from eos-forum");
            return;
        }

        return true; // good

    } else {
        throw ("You must be logged in to post a new thread here!");
    }
}

async function Subscribe(subscribe, sub) {
    if (subscribe) {
        if (storage.subscribed_subs.includes(sub)) return;
        storage.subscribed_subs.push(sub);
        SaveStorage();

        return true;
    } else {
        // remove all
        for (; ;) {
            var i = storage.subscribed_subs.indexOf(sub);
            if (i < 0) break;
            storage.subscribed_subs.splice(i, 1);
            //console.log(storage.subscribed_subs);
        }

        SaveStorage();

        return false;
    }
}

async function Tag(current_page, tag, sorter) {
    current_page = parseInt(current_page ? current_page : 1);
    tag = (tag).toLowerCase();

    var novusphere = GetNovusphere();

    var n_posts = (await novusphere.api({
        count: novusphere.config.collection,
        maxTimeMS: 1000,
        query: forum.match_posts_by_tag(tag)
    })).n;

    var num_pages = Math.ceil(n_posts / MAX_ITEMS_PER_PAGE);
    const identity = await GetIdentity();

    var posts = (await novusphere.api({
        aggregate: novusphere.config.collection,
        maxTimeMS: 1000,
        cursor: {},
        pipeline: [
            { $match: forum.match_posts_by_tag(tag) },
            { $lookup: forum.lookup_post_state() },
            { $lookup: forum.lookup_post_parent() },
            {
                $project: forum.project_post({
                    normalize_up: true,
                    normalize_parent: true,
                    score: true
                })
            },
            { $sort: sorter },
            { $skip: forum.skip_page(current_page, MAX_ITEMS_PER_PAGE) },
            { $limit: MAX_ITEMS_PER_PAGE },
            { $lookup: forum.lookup_post_replies() },
            { $lookup: forum.lookup_post_my_vote(identity.account) },
            {
                $project: forum.project_post({
                    normalize_my_vote: true,
                    recent_edit: true
                })
            },
            { $match: forum.match_valid_parent() }
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

async function Thread(id, child_id) {
    const novusphere = GetNovusphere();
    const identity = await GetIdentity();

    var main_post = (await novusphere.api({
        aggregate: novusphere.config.collection,
        maxTimeMS: 1000,
        cursor: {},
        pipeline: [
            { $match: forum.match_thread(id) },
            { $lookup: forum.lookup_post_state() },
            { $lookup: forum.lookup_post_my_vote(identity.account) },
            {
                $project: forum.project_post({
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
        aggregate: novusphere.config.collection,
        maxTimeMS: 1000,
        cursor: {},
        pipeline: [
            { $match: forum.match_thread_replies(main_post.data.post_uuid) },
            { $lookup: forum.lookup_post_state() },
            { $lookup: forum.lookup_post_my_vote(identity.account) },
            {
                $project: forum.project_post({
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
        var childPost;
        if (childId.length == 64) {
            child_post = responses.find(p => p.transaction == child_id);
        } else {
            childId = parseInt(childId);
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
        main_post: main_post
    }
}

function PlaceholderPost() {
    return new Post();
}

async function Notifications(current_page) {
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
        count: novusphere.config.collection,
        maxTimeMS: 1000,
        query: forum.match_notifications(identity.account)
    })).n;

    var pages = Math.ceil(n_notifications / MAX_ITEMS_PER_PAGE);

    var posts = (await novusphere.api({
        aggregate: novusphere.config.collection,
        maxTimeMS: 1000,
        cursor: {},
        pipeline: [
            { $match: forum.match_notifications(identity.account) },
            { $lookup: forum.lookup_post_state() },
            { $lookup: forum.lookup_post_parent() },
            {
                $project: forum.project_post({
                    normalize_up: true,
                    normalize_parent: true
                })
            },
            { $sort: forum.sort_by_time() },
            { $skip: forum.skip_page(current_page, MAX_ITEMS_PER_PAGE) },
            { $limit: MAX_ITEMS_PER_PAGE },
            { $lookup: forum.lookup_post_replies() },
            { $lookup: forum.lookup_post_my_vote(identity.account) },
            {
                $project: forum.project_post({
                    normalize_my_vote: true,
                    recent_edit: true
                })
            },
            { $match: forum.match_valid_parent() }
        ]
    })).cursor.firstBatch;

    posts = await Post.fromArray(posts);

    return {
        current_page: current_page,
        pages: pages,
        posts: posts
    }
}

async function MarkNotificationsAsRead() {
    var identity = await GetIdentity();
    identity.notifications = 0;

    storage.last_notification = (new Date()).getTime() / 1000;
    SaveStorage();
}

async function UserProfile(current_page, account, sorter) {
    current_page = parseInt(current_page ? current_page : 1);
    var is_blocked = await moderation.isBlocked(0, null, account);

    const eos = GetEOS();
    const novusphere = GetNovusphere();

    var balance_atmos = parseFloat(
        (await eos.getCurrencyBalance("novusphereio", account, "ATMOS"))[0]
    );
    balance_atmos = (isNaN(balance_atmos) ? 0 : balance_atmos).toFixed(3);

    var n_comments = (await novusphere.api({
        count: novusphere.config.collection,
        maxTimeMS: 1000,
        query: forum.match_posts_by_account(account, true)
    })).n;

    var n_threads = (await novusphere.api({
        count: novusphere.config.collection,
        maxTimeMS: 1000,
        query: forum.match_threads_by_account(account)
    })).n;

    var pages = Math.ceil((n_comments + n_threads) / MAX_ITEMS_PER_PAGE);

    const identity = await GetIdentity();

    var posts = (await novusphere.api({
        aggregate: novusphere.config.collection,
        maxTimeMS: 1000,
        cursor: {},
        pipeline: [
            { $match: forum.match_posts_by_account(account, false) },
            { $lookup: forum.lookup_post_state() },
            { $lookup: forum.lookup_post_parent() },
            {
                $project: forum.project_post({
                    normalize_up: true,
                    normalize_parent: true,
                    score: true
                })
            },
            { $sort: sorter },
            { $skip: forum.skip_page(current_page, MAX_ITEMS_PER_PAGE) },
            { $limit: MAX_ITEMS_PER_PAGE },
            { $lookup: forum.lookup_post_replies() },
            { $lookup: forum.lookup_post_my_vote(identity.account) },
            {
                $project: forum.project_post({
                    normalize_my_vote: true,
                    recent_edit: true
                })
            },
            { $match: forum.match_valid_parent() }
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

async function ToggleBlockUser(account, is_blocked) {
    if (is_blocked) {
        var i = storage.moderation.accounts.indexOf(account);
        if (i > -1) {
            storage.moderation.accounts.splice(i, 1);
        }

    } else {
        storage.moderation.accounts.push(account);
    }

    SaveStorage();
}

async function UpvoteFree(post) {
    const identity = await GetIdentity();
    if (!identity.account) {
        throw ("You must be logged in to upvote comments!");
    }

    const action = {
        contract: "novuspheredb",
        name: "push",
        data: {
            account: identity.account,
            json: JSON.stringify({
                protocol: "novusphere",
                method: "forum_vote",
                data: {
                    txid: post.o_transaction
                }
            })
        }
    };

    var eostx = await ExecuteEOSActions(action);

    if (!post.my_vote) {
        post.my_vote = {
            account: identity.account,
            txid: post.o_transaction
        };
    }

    return (post.up ? post.up : 0) + 1;
}

async function Upvote(post, atmos) {
    atmos = parseFloat(atmos);
    if (isNaN(atmos) || atmos <= 0) {
        throw ("Invalid quantity of atmos");
    }

    const identity = await GetIdentity();
    const eos = GetEOS();
    const auth = [
        {
            actor: identity.account,
            permission: identity.auth
        }
    ];

    const memo = "upvote for " + post.o_transaction;
    const quantity =
        (
            atmos /
            (identity.account == post.data.poster ? 1 : 2)
        ).toFixed(3) + " ATMOS";

    try {
        var actions = [];

        if (identity.account != post.data.poster) {
            actions.push({
                contract: "novusphereio",
                name: "transfer",
                data: {
                    from: identity.account,
                    to: post.data.poster,
                    quantity: quantity,
                    memo: memo
                }
            });
        }

        actions.push({
            contract: "novusphereio",
            name: "transfer",
            data: {
                from: identity.account,
                to: "novuspheredb",
                quantity: quantity,
                memo: memo
            }
        });

        var eostx = await ExecuteEOSActions(actions);

    } catch (ex) {
        console.log(ex);
        throw ("Error: upvote transaction failed!");
    }

    var new_upvotes = Math.floor(atmos / UPVOTE_ATMOS_RATE);
    return parseInt(post.up) + new_upvotes;
}

function UpvotesToAtmos(n_votes) {
    return n_votes * UPVOTE_ATMOS_RATE;
}

function AtmosToUpvotes(n_atmos) {
    return n_atmos / UPVOTE_ATMOS_RATE;
}

async function PushNewPost(post, parent_tx, anon, warn_anon, set_status) {
    if (!post) {
        return false;
    }

    if (!set_status) {
        set_status = function () { }; // dummy
    }

    const eos_service = GetEOSService();
    const identity = await GetIdentity();

    // set correct poster
    post.poster = (anon) ? eos_service.config.anon_account : identity.account;

    var txid;

    try {

        if (anon) {

            // use eos-service to make anonymous post
            if (warn_anon) {

                if (!(await confirm('Are you sure you want to post this anonymously?'))) {
                    set_status("Error: post canceled");
                    return false;
                }

            }

            var eostx = await eos_service.anonymousPost(post);
            if (eostx.error) {
                set_status("Error: " + eostx.error);
                console.log(eostx.error);
                return false;
            }
        } else {
            var tips_rx = post.content.match(/\#tip [0-9\.]+ [A-Z]+/gi);
            var actions = [
                {
                    contract: FORUM_CONTRACT,
                    name: "post",
                    data: post
                }
            ];

            //
            // tips
            //
            if (
                tips_rx &&
                tips_rx.length > 0 &&
                !post.json_metadata.edit &&
                parent_tx
            ) {
                var tokens = JSON.parse(
                    await Helpers.AsyncGet(
                        "https://raw.githubusercontent.com/eoscafe/eos-airdrops/master/tokens.json"
                    )
                );

                tokens.splice(0, 0, {
                    name: "EOS",
                    logo: "",
                    logo_lg: "",
                    symbol: "EOS",
                    account: "eosio.token"
                });

                for (var i = 0; i < tips_rx.length; i++) {
                    var tip_args = tips_rx[i].split(" ");

                    const token = tokens.find(t => t.symbol == tip_args[2]);
                    if (!token) {
                        set_status(
                            "Error: could not find contract for tip symbol " + tip_args[2]
                        );
                        return false;
                    }

                    const stats = await eos.getCurrencyStats(
                        token.account,
                        token.symbol
                    );
                    const precision = stats[token.symbol].max_supply
                        .split(" ")[0]
                        .split(".")[1].length;

                    var adjusted_amount = parseFloat(tip_args[1]).toFixed(precision);

                    actions.push({
                        contract: token.account,
                        method: "transfer",
                        data: {
                            from: identity.account,
                            to: post.json_metadata.parent_poster,
                            quantity: adjusted_amount + " " + token.symbol,
                            memo: "tip for " + parent_tx
                        }
                    });
                }
            }
            // ---

            txid = await ExecuteEOSActions(actions);
        }

    } catch (ex) {
        set_status("Creating tx and broadcasting to EOS... Failed!");
        console.log(ex);
        return false;
    }

    set_status("Waiting for Novusphere to index...");

    const novusphere = GetNovusphere();
    await novusphere.waitTx(txid, 500, 1000);

    // reset default
    set_status("");
    return txid;
}

function IsAnonSub(sub) {
    return sub == "anon" || sub.indexOf("anon-") == 0;
}

function GeneratePostUuid() {
    return uuidv4();
}

function ParseMarkdown(content, createdAt) {
    return new MarkdownParser(content, createdAt);
}

async function PostHistory(txid) {
    const novusphere = GetNovusphere();
    const identity = await GetIdentity();

    var main_post = (await novusphere.api({
        aggregate: novusphere.config.collection,
        maxTimeMS: 1000,
        cursor: {},
        pipeline: [
            { $match: { transaction: txid } },
            { $lookup: forum.lookup_post_state() },
            { $lookup: forum.lookup_post_my_vote(identity.account) },
            {
                $project: forum.project_post({
                    normalize_up: true,
                    normalize_my_vote: true
                })
            }
        ]
    })).cursor.firstBatch[0];

    main_post = new Post(main_post);

    var edits = (await novusphere.api({
        find: novusphere.config.collection,
        maxTimeMS: 1000,
        filter: forum.match_post_edits(main_post.data.poster, main_post.data.post_uuid),
        sort: forum.sort_by_time(true)
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

async function GetReccomendedModList() {
    var git = JSON.parse(await Helpers.AsyncGet(
        "https://raw.githubusercontent.com/Novusphere/eos-forum-mod-list/master/list.json"
    ));

    return git.list;
}

async function Search() {
    const novusphere = GetNovusphere();
    var subs = (await novusphere.api({
        aggregate: novusphere.config.collection,
        maxTimeMS: 1000,
        cursor: {},
        pipeline: [
            {
                $match: {
                    "data.json_metadata.sub": { $exists: true, $ne: "" },
                    "data.json_metadata.edit": false
                }
            },
            {
                $group: {
                    _id: "$data.json_metadata.sub",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: {
                    count: -1
                }
            }
        ]
    })).cursor.firstBatch;

    return {
        subs: subs
    }
}

export default {
    // views
    Home,
    Tag,
    Thread,
    Notifications,
    UserProfile,
    PostHistory,
    Search,
    // helpers
    NewThread,
    Subscribe,
    MarkNotificationsAsRead,
    ToggleBlockUser,
    Upvote,
    UpvoteFree,
    GetReccomendedModList,
    GeneratePostUuid,
    PushNewPost,
    // helpers [not async]
    GetRandomHeaderText,
    PlaceholderPost,
    UpvotesToAtmos,
    AtmosToUpvotes,
    IsAnonSub,
    ParseMarkdown
};