import { GetNovusphere } from './novusphere'

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
    sort_by_score() {
        return {
            __score: -1
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
    //
    //  MONGODB LOOKUP QUERY HELPERS
    //
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
            up: this.pipeline_up(),
            __score: this.pipeline_score()
        };
    }
    project_post_final(recentEdit, totalReplies) {
        var query = {
            transaction: "$transaction",
            createdAt: "$createdAt",
            data: "$data",
            up: "$up",
            my_vote: { $arrayElemAt: ["$my_vote", 0] },
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
    pipeline_up() {
        return { $ifNull: [{ $arrayElemAt: ["$state.up", 0] }, 0] };
    }
    pipeline_score() {
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