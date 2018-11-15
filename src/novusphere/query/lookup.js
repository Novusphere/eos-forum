import { GetNovusphere } from "@/novusphere";

export default {
    postParent() {
        const novusphere = GetNovusphere();
        return {
            from: novusphere.config.collection_forum,
            localField: "data.reply_to_post_uuid",
            foreignField: "data.post_uuid",
            as: "parent"
        };
    },
    postState() {
        const novusphere = GetNovusphere();
        return {
            from: novusphere.config.collection_post_state,
            localField: "transaction",
            foreignField: "txid",
            as: "state"
        };
    },
    threadReplies(referendum) {
        const novusphere = GetNovusphere();

        if (!referendum) {
            return {
                from: novusphere.config.collection_forum,
                localField: "data.post_uuid",
                foreignField: "data.reply_to_post_uuid",
                as: "replies"
            };
        }
        else {
            return {
                from: novusphere.config.collection_forum,
                let: {
                    "post_uuid": {
                        $concat: [
                            { $literal: "ref-" },
                            "$transaction"
                        ]
                    }
                },
                pipeline: [
                    {
                        $project: {
                            test: {
                                $eq: [
                                    "$$post_uuid",
                                    "$data.reply_to_post_uuid"
                                ]
                            },
                        },
                    },
                    {
                        $match: { test: true }
                    },
                ],
                as: "replies"
            }
        }
    },
    postReplies() {
        const novusphere = GetNovusphere();
        return {
            from: novusphere.config.collection_forum,
            localField: "data.post_uuid",
            foreignField: "data.json_metadata.parent_uuid",
            as: "replies"
        };
    },
    postMyVote(account) {
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
}