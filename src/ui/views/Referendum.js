import { GetNovusphere } from "@/novusphere";

import { Post } from "@/types/post";

import {
    MAX_ITEMS_PER_PAGE,
} from "@/ui/constants";

const REFERENDUM_COLLECTION = "eosforum";

export default async function Referendum(current_page, by) {

    current_page = parseInt(current_page ? current_page : 1);

    const novusphere = GetNovusphere();

    var MATCH_QUERY = {
        name: "propose",
        createdAt: { $gte: 1537221139 }
    };

    var LOOKUP_EXPIRED = {
        from: REFERENDUM_COLLECTION,
        let: {
            proposal_name: "$data.proposal_name",
            createdAt: "$createdAt"
        },
        pipeline: [
            { $match: { name: "clnproposal" } },
            {
                $project: {
                    txid: "$transaction",
                    test: {
                        $and: [
                            { $eq: ["$data.proposal_name", "$$proposal_name"] },
                            { $gte: ["$createdAt", "$$createdAt"] }
                        ]
                    }
                }
            },
            { $match: { test: true } }
        ],
        as: "expired"
    };

    var now = (new Date().getTime()) / 1000;
    var MATCH_CONDITION;
    if (by == 'active') {
        MATCH_CONDITION = {
            "expired.0": { "$exists": false }
        };
    }   
    else {
        MATCH_CONDITION = {
            "expired.0": { "$exists": true }
        }
    }

    var n_proposals = (await novusphere.api({
        aggregate: REFERENDUM_COLLECTION,
        maxTimeMS: 5000,
        cursor: {},
        pipeline: [
            { $match: MATCH_QUERY },
            { $lookup: LOOKUP_EXPIRED },
            { $match: MATCH_CONDITION },
            { $count: "n" }
        ]
    })).cursor.firstBatch[0].n;

    var num_pages = Math.ceil(n_proposals / MAX_ITEMS_PER_PAGE);

    var payload = (await novusphere.api({
        aggregate: REFERENDUM_COLLECTION,
        maxTimeMS: 5000,
        cursor: {},
        pipeline: [
            { $match: MATCH_QUERY },
            { $lookup: LOOKUP_EXPIRED },
            { $match: MATCH_CONDITION },
            { $sort: novusphere.query.sort.time() },
            { $skip: novusphere.query.skip.page(current_page, MAX_ITEMS_PER_PAGE) },
            { $limit: MAX_ITEMS_PER_PAGE },
            { $lookup: novusphere.query.lookup.threadReplies(true) },
            {
                $project: novusphere.query.project.post({
                    total_replies: true
                })
            }
        ]
    })).cursor.firstBatch;

    // mark expired proposals
    const unix_now = new Date();
    for (var i = 0; i < payload.length; i++) {
        var p = new Post(payload[i]);

        await p.normalize();
        payload[i] = p; 
    }

    return {
        posts: payload,
        pages: num_pages,
        current_page: current_page
    }
}