import { GetEOS, GetIdentity, ExecuteEOSActions } from "@/eos";

import {
    UPVOTE_ATMOS_RATE,
} from "@/ui/constants";

export default async function UpvotePaid(post, atmos) {

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