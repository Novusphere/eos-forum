import requests from "@/requests";
import { storage, SaveStorage } from "@/storage";
import { GetEOS, GetIdentity, ExecuteEOSActions, GetEOSService, GetTokensInfo, GetTokenPrecision } from "@/eos";
import { GetNovusphere } from "@/novusphere";

import {
    FORUM_CONTRACT,
} from "@/ui/constants";

async function HandleTip(post, json_metadata, parent_tx, actions, set_status, identity) {
    if (!parent_tx) return;
    if (json_metadata.edit) return;

    var tips_rx = post.content.match(/\#tip [0-9\.]+ [A-Z]+( @[a-z0-9\.]+)?/gi);

    if (!tips_rx || tips_rx.length == 0) return;

    const eos = GetEOS();
    const tokens = await GetTokensInfo();

    for (var i = 0; i < tips_rx.length; i++) {
        var tip_to = json_metadata.parent_poster;
        var tip_args = tips_rx[i].split(" ");

        if (tip_args.length >= 4) {
            tip_to = tip_args[3].substring(1);
        }

        tip_args[2] = tip_args[2].toUpperCase(); // upper case sym, ignore case user typed
        const token = tokens.find(t => t.symbol == tip_args[2]);
        if (!token) {
            set_status(
                "Error: could not find contract for tip symbol " + tip_args[2]
            );
            return false;
        }

        const precision = await GetTokenPrecision(eos, token.account, token.symbol);

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

async function HandleTipAccount(post, json_metadata, parent_tx, actions, set_status, identity) {
    if (!parent_tx) return;
    if (json_metadata.edit) return;

    var tips_rx = post.content.match(/\#giftaccount [A-Za-z0-9\.]{12}/gi);

    if (!tips_rx || tips_rx.length == 0) return;

    const account_name = tips_rx[0].split(" ")[1];

    const novusphere = GetNovusphere();
    const main_post = (await novusphere.api({
        aggregate: novusphere.config.collection_forum,
        maxTimeMS: 7500,
        cursor: {},
        pipeline: [
            { $match: novusphere.query.match.threadById(parent_tx) },
        ]
    })).cursor.firstBatch[0];

    if (!main_post || !main_post.data.json_metadata.anon_id)
        return;

    const anon_id_key = main_post.data.json_metadata.anon_id.pub;

    actions.push({
        contract: "eosio",
        name: "newaccount",
        data: {
            creator: identity.account,
            name: account_name,
            owner: anon_id_key,
            active: anon_id_key
        }
    });

    actions.push({
        contract: "eosio",
        name: "buyrambytes",
        data: {
            payer: identity.account,
            receiver: account_name,
            bytes: 4092 // 4kb
        }
    });

    actions.push({
        contract: "eosio",
        name: "delegatebw",
        data: {
            from: identity.account,
            receiver: account_name,
            stake_net_quantity: '0.0500 EOS',
            stake_cpu_quantity: '0.1500 EOS',
            transfer: 0
        }
    });
}

async function HandleExtension(post, actions, identity) {
    // extension message hack
    // https://github.com/eoscanada/eosio.forum/blob/master/src/forum.cpp#L157
    const MAX_CONTENT = 1024 * 10;
    if (post.content.length < MAX_CONTENT)
        return;

    var overflow = post.content.substring(MAX_CONTENT - 1);
    var underflow = post.content.substring(0, MAX_CONTENT - 1);

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

export default async function PushNewPost(post, parent_tx, anon, warn_anon, set_status, skip_index) {
    if (!post) {
        return false;
    }

    if (!set_status) {
        set_status = function () { }; // dummy
    }

    const novusphere = GetNovusphere();
    const identity = await GetIdentity();

    // if anon, service will set poster
    post.poster = (anon) ? post.poster : identity.account;

    var txid;

    try {

        if (anon) {

            // use eos-service to make anonymous post
            if (warn_anon) {

                if (!(await confirm('Are you sure you want to post this with your forum ID?'))) {
                    set_status("Error: post canceled");
                    return false;
                }

            }

            var eostx = await novusphere.anonymousPost(post);
            if (eostx.error) {
                set_status(eostx.error);
                console.log(eostx.error);
                return false;
            }

            txid = eostx.transaction_id;

        } else {
            
            const json_metadata = JSON.parse(post.json_metadata);

            var actions = [
                {
                    contract: FORUM_CONTRACT,
                    name: "post",
                    data: post
                }
            ];

            //set_status('Handling tips... ');
            await HandleTip(post, json_metadata, parent_tx, actions, set_status, identity);
            //set_status('Handling tips (2)...');
            await HandleTipAccount(post, json_metadata, parent_tx, actions, set_status, identity);
            //set_status('Handling extensions...');
            await HandleExtension(post, actions, identity);
            //set_status('Waiting to execute EOS action...');
            txid = await ExecuteEOSActions(actions);
            //set_status('Created transaction ' + txid);
        }

    } catch (ex) {
        set_status("Creating tx and broadcasting to EOS... Failed!");
        console.log(ex);
        return false;
    }

    if (!skip_index) {

        set_status("Waiting for Novusphere to index...");
        await novusphere.waitTx(txid, 500, 1000);

    }

    // reset default
    set_status("");
    return txid;
}