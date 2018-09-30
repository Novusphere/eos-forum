import { GetNovusphere } from "@/novusphere";

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
            __score: asc ? 1 : -1
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
    match_thread(txid) {
        return {
            transaction: txid
        }
    }
    match_thread_replies(uuid) {
        return { "data.reply_to_post_uuid": uuid };
    }
    match_threads(sub) {
        var query = {
            "data.json_metadata.sub": sub,
            "data.reply_to_post_uuid": "",
            createdAt: {
                $gte: 1531434299
            } /* Last eosforumtest contract redeploy */
        };

        if (sub == "all") {
            query["data.json_metadata.sub"] = { $exists: true, $ne: "" };
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
        //
        //  NOTE & TO-DO:
        //  this is very inefficient using regex, build an index with novusphere-db
        //  and use $in on the pre-processed hashtag array
        //
        return {
            "data.json_metadata.edit": false,
            "data.content": { $regex: ".*#" + tag + ".*" },
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
    lookup_post_replies() {
        const novusphere = GetNovusphere();
        return {
            from: novusphere.config.collection,
            localField: "data.post_uuid",
            foreignField: "data.reply_to_post_uuid",
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
    project_post() {
        return {
            transaction: "$transaction",
            createdAt: "$createdAt",
            data: "$data",
            up: { $ifNull: [{ $arrayElemAt: ["$state.up", 0] }, 0] },
            parent: { $arrayElemAt: ["$parent", 0] },
            __score: this.score()
        };
    }
    project_post_final(recentEdit, totalReplies) {
        var query = {
            transaction: "$transaction",
            createdAt: "$createdAt",
            data: "$data",
            up: "$up",
            my_vote: { $arrayElemAt: ["$my_vote", 0] },
            parent: "$parent",
            __score: "$__score"
        };

        if (recentEdit) {
            query['recent_edit'] = {
                $arrayElemAt: [
                    {
                        $filter: {
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
                    },
                    -1
                ]
            };
        }

        if (totalReplies) {
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
    score() {
        const unix_now = new Date().getTime() / 1000;
        return {
            // (p+1)/(T+2)^G -- p=upvotes, T=time since post in hrs, G=1.8
            $divide: [
                {
                    $add: [
                        { $ifNull: [{ $arrayElemAt: ["$state.up", 0] }, 0] },
                        1
                    ]
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
                        1.8
                    ]
                }
            ]
        };
    }
}

const forum = new NovusphereForum();
export { forum };