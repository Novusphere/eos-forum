import jQuery from "jquery";
import { GetNovusphere } from "@/novusphere";
import { storage } from "@/storage";

class NovusphereForum {
    //
    //  MONGODB SKIP QUERY HELPERS
    //
    skip_page(current, maxItems) {
        return (current - 1) * maxItems;
    }
    //
    //  MONGODB SORT QUERY HELPERS
    //
    sort_by_score(asc) {
        return {
            score: asc ? 1 : -1
        };
    }
    sort_by_time(asc) {
        return {
            createdAt: asc ? 1 : -1
        };
    }
    //
    //  MONGODB MATCH QUERY HELPERS
    //
    match_notifications(account, last_notification) {
        if (!last_notification) {
            last_notification = 1539100000; // when notifications got introduced
        }

        return {
            "createdAt": { $gt: last_notification },
            "data.json_metadata.sub": { $exists: true, $ne: "" },
            "data.poster": { $ne: account },
            $or: [
                { "data.reply_to_poster": account },
                { "data.json_metadata.parent_poster": account }
            ]
        };
    }
    match_thread(id) {
        if (id.length == 64) {
            return {
                transaction: id
            };
        }
        else {
            return {
                id: parseInt(id)
            }
        }
    }
    match_thread_txids(ids) {
        return {
            transaction: { $in: ids }
        };
    }
    match_thread_replies(uuid) {
        return { "data.reply_to_post_uuid": uuid };
    }
    match_threads(sub, ignoreAccounts) {
        var query = {
            "data.json_metadata.sub": sub,
            "data.reply_to_post_uuid": "",
            createdAt: {
                $gte: 1531434299
            } /* Last eosforumtest contract redeploy */
        };

        //
        // NOTE: temporary patch to disable anon-r-* from shownig up and isolate it
        //
        if (sub == "all") {
            query["data.json_metadata.sub"] = { $exists: true, $ne: "" }; 
            //{ $regex: "^(?!anon-r).*", $options: 'i' };
        }
        else if (sub == "anon") {
            query["data.json_metadata.sub"] = { $regex: "(^anon$|^anon-)", $options: 'i' };
            //{ $regex: "(^anon$|^anon-)(?!r-)", $options: 'i' };
        }
        else if (Array.isArray(sub)) {
            query["data.json_metadata.sub"] = { $in: sub };
        }

        if (ignoreAccounts && ignoreAccounts.length > 0) {
            query["data.poster"] = { $nin: ignoreAccounts };
        }

        return query;
    }
    match_threads_by_account(account) {
        return {
            "data.json_metadata.edit": false,
            "data.json_metadata.sub": { $exists: true, $ne: "" },
            "data.reply_to_post_uuid": "",
            "data.poster": account,
            createdAt: {
                $gte: 1531434299
            } /* Last eosforumtest contract redeploy */
        };
    }
    match_posts_by_tag(tag) {
        if ((typeof tag) == "string") {
            tag = [tag]; // turn into array
        }

        for (var i = 0; i < tag.length; i++) {
            tag[i] = tag[i].toLowerCase();
        }

        return {
            "data.json_metadata.edit": false,
            "data.tags": { $in: tag },
            //"data.content": { $regex: ".*#" + tag + ".*", $options: 'i' },
            createdAt: {
                $gte: 1531434299
            } /* Last eosforumtest contract redeploy */
        }
    }
    match_post_edits(poster, post_uuid) {
        return {
            "data.poster": poster,
            "data.json_metadata.parent_uuid": post_uuid,
            "data.json_metadata.edit": true
        };
    }
    match_posts_by_account(account, commentsOnly) {
        var query = this.match_threads_by_account(account);
        if (commentsOnly) {
            query["data.reply_to_post_uuid"] = { $ne: "" };
        }
        else {
            delete query["data.reply_to_post_uuid"];
        }
        return query;
    }
    match_valid_parent() {
        return {
            $or: [
                { parent: null },
                { "parent.data.json_metadata": { $ne: null } }
            ]
        };
    }
    //
    //  MONGODB LOOKUP QUERY HELPERS
    //
    lookup_post_parent() {
        const novusphere = GetNovusphere();
        return {
            from: novusphere.config.collection,
            localField: "data.reply_to_post_uuid",
            foreignField: "data.post_uuid",
            as: "parent"
        };
    }
    lookup_post_state() {
        const novusphere = GetNovusphere();
        return {
            from: novusphere.config.collection_post_state,
            localField: "transaction",
            foreignField: "txid",
            as: "state"
        };
    }
    lookup_thread_replies() {
        const novusphere = GetNovusphere();
        return {
            from: novusphere.config.collection,
            localField: "data.post_uuid",
            foreignField: "data.reply_to_post_uuid",
            as: "replies"
        };
    }
    lookup_post_replies() {
        const novusphere = GetNovusphere();
        return {
            from: novusphere.config.collection,
            localField: "data.post_uuid",
            foreignField: "data.json_metadata.parent_uuid",
            as: "replies"
        };
    }
    lookup_post_my_vote(account) {
        const novusphere = GetNovusphere();
        return {
            from: novusphere.config.collection_post_vote,
            let: {
                transaction: "$transaction",
            },
            pipeline: [
                {
                    $match: { account: account }
                },
                {
                    $project: {
                        account: "$account",
                        txid: "$txid",
                        test: { $eq: ["$$transaction", "$txid"] },
                    },
                },
                {
                    $match: { test: true }
                },
            ],
            as: "my_vote"
        };
    }
    //
    //  MONGODB PROJECTION QUERY HELPERS
    //
    project_post(opts) {
        opts = jQuery.extend({

            normalize_up: false,
            normalize_parent: false,
            normalize_my_vote: false,
            recent_edit: false,
            total_replies: false,
            score: true

        }, opts);

        var query = {
            id: "$id",
            transaction: "$transaction",
            createdAt: "$createdAt",
            data: "$data",
            //state: "$state",
            replies: "$replies",
            up: !opts.normalize_up ? "$up" : { $ifNull: [{ $arrayElemAt: ["$state.up", 0] }, 0] },
            up_atmos: !opts.normalize_up ? "$up_atmos" : { $ifNull: [{ $arrayElemAt: ["$state.up_atmos", 0] }, 0] },
            parent: !opts.normalize_parent ? "$parent" : { $arrayElemAt: ["$parent", 0] },
            score: "$score",
            my_vote: !opts.normalize_my_vote ? "$my_vote" : { $arrayElemAt: ["$my_vote", 0] },
            recent_edit: "$recent_edit"
        };

        if (opts.score) {
            query['score'] = this.score();
        }

        if (opts.recent_edit) {
            query['recent_edit'] = {
                $arrayElemAt: [{ $filter: this.recent_edit() }, -1]
            };
        }

        if (opts.total_replies) {
            query['total_replies'] = {
                $size: {
                    $filter: {
                        input: "$replies",
                        as: "reply",
                        cond: {
                            $ne: ["$$reply.data.json_metadata.edit", true]
                        }
                    }
                }
            }
        }

        return query;
    }
    //
    //  MONGODB PIPELINE QUERY HELPERS
    //
    recent_edit() {
        return {
            input: "$replies",
            as: "reply",
            cond: {
                $and: [
                    { $eq: ["$$reply.data.json_metadata.edit", true] },
                    {
                        $eq: [
                            "$$reply.data.json_metadata.parent_uuid",
                            "$data.post_uuid"
                        ]
                    },
                    { $eq: ["$$reply.data.poster", "$data.poster"] }
                ]
            }
        }
    }
    score() {
        const unix_now = new Date().getTime() / 1000;

        var adder = [1, { $ifNull: [{ $arrayElemAt: ["$state.up", 0] }, 0] }];
        if (storage.settings.atmos_upvotes) {
            // factor in up_atmos
            adder = [{ $add: adder }, { $ifNull: [{ $arrayElemAt: ["$state.up_atmos", 0] }, 0] }];
        }

        return {
            // (p+1)/(T+2)^G -- p=upvotes, T=time since post in hrs, G=1.8
            $divide: [
                {
                    $add: adder
                },
                {
                    $pow: [
                        {
                            $add: [
                                {
                                    $divide: [
                                        { $subtract: [unix_now, "$createdAt"] },
                                        3600
                                    ]
                                },
                                2
                            ]
                        },
                        0.70
                    ]
                }
            ]
        };
    }
}

const forum = new NovusphereForum();
export { forum };