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
            if (!storage.accountstate[identity.account] ||
                !(await novusphere.isAccountStateAuthorized(storage.accountstate[identity.account], identity.account, ''))) {
                
                //console.log('unauthorized');
                storage.accountstate[identity.account] = 0;
                
                const sig = await SignData(identity.publicKey, nonce.toString(), 'Start session');
                if (!sig) {
                    throw new Error('invalid signature');
                }

                const payload = await novusphere.authorizeAccountState(identity.account, identity.publicKey, nonce, sig);
                //console.log(payload);

                if (payload.session_key) {
                    //console.log('authorized with key: ' + payload.session_key);
                    storage.accountstate[identity.account] = payload.session_key;
                }
            }
        }
        catch (ex) {
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
        }
    }

    // save to anonymous ID
    if (storage.anon_id.key && ecc.isValidPrivate(storage.anon_id.key)) {
        const pubkey =  ecc.privateToPublic(storage.anon_id.key);

        if (!storage.accountstate[pubkey] ||
            !(await novusphere.isAccountStateAuthorized(storage.accountstate[pubkey], '', pubkey))) {
              
            //console.log('unauthorized');
            storage.accountstate[pubkey] = 0;
            
            const sig = ecc.sign(nonce.toString(), storage.anon_id.key);

            const payload = await novusphere.authorizeAccountState('', pubkey, nonce, sig);
            console.log(payload);
            
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

    if (ns_account) {
        const state = ns_account.state;

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