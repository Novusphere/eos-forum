import Eos from "eosjs";

import { storage } from '@/storage';

import EOSBinaryReader from "./binaryreader";
import { GetTokensInfo, GetTokenPrecision } from "./tokens";
import Identity from "./identity";

import { initAccessContext } from 'eos-transit';
import scatter from 'eos-transit-scatter-provider';
import lynx from 'eos-transit-lynx-provider';

const accessContext = initAccessContext({
    appName: 'eosforum',
    network: {
        host: 'public.eosinfra.io', // https://github.com/eostitan/transit-vue-basic/blob/master/src/components/Login.vue#L128
        port: 443,
        protocol: 'https',
        chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906'
    },
    walletProviders: [
        lynx(),
        scatter()
    ]
});

var g_wallet = null;
var g_identity = new Identity();

//DetectWallet();

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
}

async function GetIdentity(pull, walletIndex) {

    if (!g_identity.account && pull) {
        if (g_wallet) {
            // TO-DO: discovery for ledger

            await g_wallet.login();

            g_identity.account = g_wallet.auth.accountName;
            g_identity.publicKey = g_wallet.auth.publicKey;
            g_identity.auth = g_wallet.auth.permission;
            g_identity.atmos = '0.000';
            g_identity.token = '0.000';
            g_identity.notifications = 0;
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

    //
    // test using practically literal code from EOS Transit
    //
    const providers = accessContext.getWalletProviders();
    const wallet = accessContext.initWallet(providers[1]); // scatter
    await wallet.connect();
    console.log(wallet.connected);
    await wallet.login();
    console.log(wallet.auth);

    //
    // test using g_wallet
    //
    //const wallet = g_wallet;

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
        .transact({
            actions: [
                {
                    account: 'eosio.token',
                    name: 'transfer',
                    authorization: [
                        {
                            actor: wallet.auth.accountName,
                            permission: wallet.auth.permission
                        }
                    ],
                    data: {
                        from: wallet.auth.accountName,
                        to: 'receiver_name',
                        quantity: '10 EOS',
                        memo: ''
                    }
                }
            ]
        },
            {
                broadcast: true,
                blocksBehind: 3,
                expireSeconds: 60
            }
        );

    /*transit_actions = [{
        account: 'eosio.token',
        name: 'transfer',
        authorization: [
            {
                actor: wallet.auth.accountName,
                permission: wallet.auth.permission
            }
        ],
        data: {
            from: wallet.auth.accountName,
            to: 'novusphereio',
            quantity: '0.1000 EOS',
            memo: 'hello'
        }
    }];

    const tx = await wallet.eosApi
        .transact({ actions: transit_actions },
            {
                broadcast: false,
                blocksBehind: 3,
                expireSeconds: 60
            }
        );

    console.log(tx);*/

    return tx;
}

async function SignData(pub, data, reason) {
    if (!g_wallet.sign) {
        return '';
    }
    return await g_wallet.sign(pub, data, reason);
}

export {
    EOS_OPTIONS,
    DEFAULT_IDENTITY,
    GetEOS,
    GetIdentity,
    ForgetIdentity,
    ExecuteEOSActions,
    SignData,
    EOSBinaryReader,
    GetTokensInfo,
    GetTokenPrecision,
};