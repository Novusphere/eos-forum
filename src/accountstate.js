import { storage, SaveStorage } from "@/storage";
import ecc from "eosjs-ecc";
import { GetNovusphere } from "@/novusphere";
import { GetEOS, GetIdentity, SignData } from "@/eos";

async function SaveAccountState() {
    const novusphere = GetNovusphere();
    const eos = GetEOS();

    const account_state = {
        subscribed_subs: storage.subscribed_subs,
        last_notification: storage.last_notification
    };

    const nonce = parseInt((new Date()).getTime() / 1000);

    const identity = await GetIdentity();

    // save to EOS account
    if (identity.account) {
        try {
            const sig = await SignData(identity.publicKey, nonce.toString());
            if (!sig) {
                throw new Error('invalid signature');
            }

            const key = ecc.recover(sig, nonce.toString()); // identity.publicKey may be unset in Lynx

            const account = {
                name: identity.account,
                key: key,
                nonce: nonce,
                sig: sig,
                state: account_state
            }

            const r = await novusphere.saveAccountState(account);
        }
        catch (ex) {
            console.log(ex); // likely, signature was rejected
        }
    }

    // save to anonymous ID
    if (storage.anon_id.key && ecc.isValidPrivate(storage.anon_id.key)) {
        const sig = ecc.sign(nonce.toString(), storage.anon_id.key);

        const account = {
            name: '',
            key: ecc.privateToPublic(storage.anon_id.key),
            nonce: nonce,
            sig: sig,
            state: account_state
        }

        const r = await novusphere.saveAccountState(account);
    }
}

async function ApplyLoadedState(ns_account) {

    if (ns_account) {
        const state = ns_account.state;
        console.log(state);

        if (state.subscribed_subs && Array.isArray(state.subscribed_subs)) {
            storage.subscribed_subs.length = 0;
            for (var i = 0; i < state.subscribed_subs.length; i++) {
                storage.subscribed_subs.push(state.subscribed_subs[i]);
            }
        }

        if (state.last_notification && !isNaN(state.last_notification)) {
            storage.last_notification = state.last_notification;
        }

        SaveStorage();
    }
}

async function LoadAccountState() {
    const novusphere = GetNovusphere();

    const identity = await GetIdentity();
    var ns_account = null;

    if (identity.account) {
        ns_account = await novusphere.getAccountState(identity.account);
    }
    else if (storage.anon_id.key && ecc.isValidPrivate(storage.anon_id.key)) {
        ns_account = await novusphere.getAccountState(ecc.privateToPublic(storage.anon_id.key));
    }

    await ApplyLoadedState(ns_account);
}

export {
    SaveAccountState,
    LoadAccountState
}