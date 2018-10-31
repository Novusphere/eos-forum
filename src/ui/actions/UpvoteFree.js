import { GetEOS, GetIdentity, ExecuteEOSActions } from "@/eos";

export default async function UpvoteFree(post) {
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
