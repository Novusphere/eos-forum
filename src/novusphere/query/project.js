import { storage } from "@/storage";
import match from "./match";

function score() {
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

export default {
    post(opts) {
        opts = Object.assign({

            normalize_up: false,
            normalize_parent: false,
            normalize_my_vote: false,
            recent_edit: false,
            total_replies: false,
            score: true

        }, opts);

        var query = {
            id: "$id",
            name: "$name",
            transaction: "$transaction",
            createdAt: "$createdAt",
            data: "$data",
            tags: "$tags",
            //state: "$state",
            expired: "$expired",
            replies: !opts.total_replies ? "$replies" : [],
            up: !opts.normalize_up ? "$up" : { $ifNull: [{ $arrayElemAt: ["$state.up", 0] }, 0] },
            up_atmos: !opts.normalize_up ? "$up_atmos" : { $ifNull: [{ $arrayElemAt: ["$state.up_atmos", 0] }, 0] },
            parent: !opts.normalize_parent ? "$parent" : { $arrayElemAt: ["$parent", 0] },
            score: "$score",
            my_vote: !opts.normalize_my_vote ? "$my_vote" : { $arrayElemAt: ["$my_vote", 0] },
            recent_edit: "$recent_edit"
        };

        if (opts.score) {
            query['score'] = score();
        }

        if (opts.recent_edit) {
            query['recent_edit'] = {
                $arrayElemAt: [{
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
                }, -1]
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
}