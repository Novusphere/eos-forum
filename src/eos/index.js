import { Api, JsonRpc, RpcError } from 'eosjs';
import { TextEncoder, TextDecoder } from 'text-encoding';

import { storage } from '@/storage';

import EOSBinaryReader from "./binaryreader";
window._EOSBR = EOSBinaryReader;

import { GetTokensInfo, GetTokenPrecision } from "./tokens";
import Identity from "./identity";

import { initAccessContext } from 'eos-transit';
import scatter from 'eos-transit-scatter-provider';
import lynx from 'eos-transit-lynx-provider';

const network = {
    host: 'eos.greymass.com',
    port: 443,
    protocol: 'https',
    chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906'
};

const accessContext = initAccessContext({
    appName: 'eosforum',
    network: network,
    walletProviders: [
        lynx(),
        scatter()
    ]
});

var g_wallet = null;
var g_identity = new Identity();

DetectWallet();

async function DetectWallet() {
    const providers = accessContext.getWalletProviders();
    for (var i = 0; i < 6; i++) {
        console.log('Wallet detection round ' + i);

        const selectedProvider = providers[i];
        try {
            const wallet = accessContext.initWallet(selectedProvider);
            await wallet.connect();
            if (wallet.connected) {
                console.log('Detected, and connected to wallet index ' + i);
                g_wallet = wallet;
                break;
            }
        }
        catch (ex) {
            // failed to connect...
        }
    }

    if (g_wallet) {
        await Login();
    }
}

async function Login() {
    // TO-DO: discovery for ledger
    try {
        await g_wallet.login();
        if (g_wallet.auth.accountName) {
            g_identity.account = g_wallet.auth.accountName;
            g_identity.publicKey = g_wallet.auth.publicKey;
            g_identity.auth = g_wallet.auth.permission;
            g_identity.atmos = '0.000';
            g_identity.token = '0.000';
            g_identity.notifications = 0;
        }
    }
    catch (ex) {
        return false;
    }
    return true;
}

async function GetIdentity(pull, walletIndex) {

    if (!g_identity.account && pull) {
        if (g_wallet) {
            await Login();
        }
    }

    return g_identity;
}

async function ForgetIdentity() {
    await g_wallet.logout();
    g_identity.setDefault();
    return g_identity;
}

function GetEOS() {
    const eos_api = storage.settings.eos_api;
    const httpEndpoint = eos_api.protocol + '://' + eos_api.host;
    const rpc = new JsonRpc(httpEndpoint);
    const api = new Api({ rpc, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });
    return api;
}

async function GetTransaction(txid) {
    const eos = GetEOS();
    const tx = (await eos.rpc.history_get_transaction(txid));
    return tx;
}

async function ExecuteEOSActions(actions) {
    if (!Array.isArray(actions)) {
        actions = [actions]; // single action
    }

    const wallet = g_wallet;

    var transit_actions = actions.map(function (a) {
        return {
            account: a.contract,
            name: a.name,
            authorization: [
                {
                    actor: wallet.auth.accountName,
                    permission: wallet.auth.permission
                }
            ],
            data: a.data
        };
    });

    const tx = await wallet.eosApi
        .transact({ actions: transit_actions },
            {
                broadcast: true,
                blocksBehind: 3,
                expireSeconds: 180
            }
        );

    return tx;
}

async function SignData(pub, data, reason) {
    // TO-DO: reimplement for transit
    return '';
}

export {
    EOS_OPTIONS,
    DEFAULT_IDENTITY,
    GetEOS,
    GetTransaction,
    GetIdentity,
    ForgetIdentity,
    ExecuteEOSActions,
    SignData,
    EOSBinaryReader,
    GetTokensInfo,
    GetTokenPrecision,
};