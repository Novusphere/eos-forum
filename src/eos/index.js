import Eos from "eosjs";

import { LoadStorage, storage } from '@/storage';
LoadStorage();

import EOSBinaryReader from "./binaryreader";
import { GetEOSService } from "./service";

import ScatterWallet from "./wallets/scatter";
import LynxWallet from "./wallets/lynx";

import Identity from "./identity";

const WALLETS = [ScatterWallet, LynxWallet];
var g_wallet = null;
var g_identity = new Identity();

DetectWallet();

// ---

async function DetectWallet() {
    for (var i = 0; i < WALLETS.length; i++) {
        var wallet = await WALLETS[i].detect(g_identity);
        if (wallet) {
            g_wallet = wallet;
            break;
        }
    }

    if (!g_wallet) {
        setTimeout(DetectWallet, 2500);
    }
}

async function GetIdentity(pull) {

    if (!g_identity.account && pull) {
        if (g_wallet) {
            await g_wallet.setIdentity(g_identity);
        }
    }

    return g_identity;
}

async function ForgetIdentity() {

    g_wallet.forgetIdentity();

    return g_identity;
}

function GetEOS() {
    if (g_wallet && g_wallet.eos) {
        return g_wallet.eos();
    }

    const eos_api = storage.settings.eos_api;

    return Eos({
        httpEndpoint: eos_api.protocol + '://' + eos_api.host,
        chainId: "aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906",
        keyProvider: []
    });
}

async function ExecuteEOSActions(actions) {

    if (!Array.isArray(actions)) {
        actions = [actions]; // single action
    }

    const identity = await GetIdentity();
    const auth = {
        authorization: [
            {
                actor: identity.account,
                permission: identity.auth
            }
        ]
    };

    return (await g_wallet.executeActions(auth, actions));
}

export {
    EOS_OPTIONS,
    DEFAULT_IDENTITY,
    GetEOS,
    GetIdentity,
    ForgetIdentity,
    ExecuteEOSActions,
    EOSBinaryReader,
    GetEOSService
};