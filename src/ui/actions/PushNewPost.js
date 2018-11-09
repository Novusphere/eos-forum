import requests from "@/requests";
import { GetEOS, GetIdentity, ExecuteEOSActions, GetEOSService } from "@/eos";
import { GetNovusphere } from "@/novusphere";

import {
    FORUM_CONTRACT,
} from "@/ui/constants";

export default async function PushNewPost(post, parent_tx, anon, warn_anon, set_status) {
    if (!post) {
        return false;
    }

    if (!set_status) {
        set_status = function () { }; // dummy
    }

    const eos_service = GetEOSService();
    const identity = await GetIdentity();

    // if anon, service will set poster
    post.poster = (anon) ? "" : identity.account;

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

            txid = eostx.transaction_id;

        } else {
            const eos = GetEOS();

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
                    await requests.get(
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

                const tip_to = JSON.parse(post.json_metadata).parent_poster;

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
                    var tip_action = {
                        contract: token.account,
                        name: "transfer",
                        data: {
                            from: identity.account,
                            to: tip_to,
                            quantity: adjusted_amount + " " + token.symbol,
                            memo: "tip for " + parent_tx
                        }
                    };
                    actions.push(tip_action);
                }
            }
            // ---

            // extension message hack
            // https://github.com/eoscanada/eosio.forum/blob/master/src/forum.cpp#L157
            const MAX_CONTENT = 1024 * 10;
            if (post.content.length >= MAX_CONTENT) {
                var overflow = post.content.substring(MAX_CONTENT-1);
                var underflow = post.content.substring(0, MAX_CONTENT-1);

                post.content = underflow; // update underflow
                actions.push({ // push overflow to nsdb contract
                    contract: "novuspheredb",
                    name: "push",
                    data: {
                        account: identity.account,
                        json: JSON.stringify({
                            protocol: "novusphere",
                            method: "content_ext",
                            data: {
                                post_uuid: post.post_uuid,
                                content: overflow
                            }
                        })
                    }
                });
            }

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