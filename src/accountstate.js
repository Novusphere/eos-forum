import { storage, SaveStorage, SyncDefaultSubs } from "@/storage";
import ecc from "eosjs-ecc";
import { GetNovusphere } from "@/novusphere";
import { GetEOS, GetIdentity, SignData } from "@/eos";

async function SaveAccountState() {
    //console.log('SaveAccountState()');

    const novusphere = GetNovusphere();
    const eos = GetEOS();

    const account_state = {
        subscribed_subs: storage.subscribed_subs,
        unsubscribed_subs: storage.unsubscribed_subs,
        last_notification: storage.last_notification,
        following: storage.following
    };

    const nonce = parseInt((new Date()).getTime() / 1000);

    const identity = await GetIdentity();

    // save to EOS account
    if (identity.account) {
        //console.log('SaveAccountState() 2');

        try {
            var is_authorized = false;
            if (storage.accountstate[identity.account] &&
                (await novusphere.isAccountStateAuthorized(storage.accountstate[identity.account], identity.account, ''))) {

                is_authorized = true;
            }

            //console.log('SaveAccountState() -- is_authorized ' + is_authorized);

            if (!is_authorized) {

                //console.log('SaveAccountState() 3');

                //window._alert('unauthorized');
                storage.accountstate[identity.account] = 0;

                const sig = await SignData(identity.publicKey, nonce.toString(), 'Start session');
                if (!sig) {
                    throw new Error('invalid signature');
                }

                if (!identity.publicKey) { // lynx
                    identity.publicKey = ecc.recover(sig, nonce.toString());
                }

                const payload = await novusphere.authorizeAccountState(identity.account, identity.publicKey, nonce, sig);
                //console.log(payload);

                if (payload.session_key) {
                    //window._alert('authorized with key: ' + payload.session_key);
                    storage.accountstate[identity.account] = payload.session_key;
                }
                else {
                    //window._alert('no session key');
                    //window._alert(JSON.stringify(payload));
                }

            }
        }
        catch (ex) {
            //window._alert(ex);
            console.log(ex); // likely, signature was rejected
        }

        if (storage.accountstate[identity.account]) {
            const account = {
                name: identity.account,
                key: identity.publicKey,
                session_key: storage.accountstate[identity.account],
                state: account_state
            }

            //console.log('saving with key ' + account.session_key);
            const r = await novusphere.saveAccountState(account);
            //console.log(r);
            //console.log(JSON.stringify(account));
        }
    }

    // save to anonymous ID
    if (storage.anon_id.key && ecc.isValidPrivate(storage.anon_id.key)) {
        const pubkey = ecc.privateToPublic(storage.anon_id.key);

        if (!storage.accountstate[pubkey] ||
            !(await novusphere.isAccountStateAuthorized(storage.accountstate[pubkey], '', pubkey))) {

            //console.log('unauthorized');
            storage.accountstate[pubkey] = 0;

            const sig = ecc.sign(nonce.toString(), storage.anon_id.key);

            const payload = await novusphere.authorizeAccountState('', pubkey, nonce, sig);
            //console.log(payload);

            if (payload.session_key) {
                //console.log('authorized with key: ' + payload.session_key);
                storage.accountstate[pubkey] = payload.session_key;
            }
        }

        if (storage.accountstate[pubkey]) {
            const account = {
                name: '',
                key: pubkey,
                session_key: storage.accountstate[pubkey],
                state: account_state
            }

            //console.log('saving with key ' + account.session_key);
            const r = await novusphere.saveAccountState(account);
            //console.log(r);
        }
    }
}

async function ApplyLoadedState(ns_account) {

    function importArray(src, dst) {
        if (src && Array.isArray(src)) {
            dst.length = 0;
            for (var i = 0; i < src.length; i++) {
                dst.push(src[i]);
            }
        }
    }

    if (ns_account) {
        const state = ns_account.state;

        importArray(state.subscribed_subs, storage.subscribed_subs);
        importArray(state.unsubscribed_subs, storage.unsubscribed_subs);
        SyncDefaultSubs();

        if (state.following) {
            importArray(state.following.filter(f => f), storage.following);
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