import Eos from "eosjs";
import ScatterJS from 'scatterjs-core';
import ScatterEOS from 'scatterjs-plugin-eosjs';
ScatterJS.plugins(new ScatterEOS());
//import ScatterJS from "scatter-js/dist/scatter.esm";

import { GetNovusphere } from "@/novusphere";
import { forum } from "@/novusphere-forum";
import { LoadStorage, storage } from '@/storage';

const SCATTER_CONFIG = {
    blockchain: "eos",
    host: "eos.greymass.com", // ( or null if endorsed chainId )
    port: "443", // ( or null if defaulting to 80 )
    chainId: "aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906" // Or null to fetch automatically ( takes longer )
};

const EOS_OPTIONS = {
    broadcast: true,
    sign: true,
    chainId: "aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906" // Or null to fetch automatically ( takes longer )
};

const DEFAULT_IDENTITY = {
    account: '',
    auth: '',
    atmos: '0.000',
    notifications: 0
};

const WALLET_TYPE_NONE = 0;
const WALLET_TYPE_SCATTER = 1;
const WALLET_TYPE_LYNX = 2; // to-do

var g_wallet_type = WALLET_TYPE_NONE;
var g_wallet_interface = null;

const UPDATE_IDENTITY_SPEED = 5000;
var g_identity = Object.assign({}, DEFAULT_IDENTITY);

LoadStorage();
UpdateIdentity();
DetectWallet();

// ---

async function DetectWallet() {
    if (window.scatter) {
        console.log('Scatter loaded (plugin)');

        g_wallet_interface = window.scatter;
        g_wallet_type = WALLET_TYPE_SCATTER;
        window.scatter = null;

        if (g_wallet_interface.identity) {
            GetIdentity(true);
        }
    }
    else {
        console.log('Trying to connect to scatter with timeout ' + storage.settings.scatter_timeout + 'ms...');
        var connected = await ScatterJS.scatter.connect('eos-forum', { initTimeout: storage.settings.scatter_timeout });
        if (connected) {
            console.log('Scatter loaded (desktop)');
            g_wallet_interface = ScatterJS.scatter;
            g_wallet_type = WALLET_TYPE_SCATTER;
            window.scatter = null;

            if (ScatterJS.scatter.identity) {
                GetIdentity(true);
            }
        }
        else {
            console.log('Scatter could not be loaded');
        }
    }

    if (g_wallet_type == WALLET_TYPE_NONE) {
        setTimeout(DetectWallet, 2500);
    }
}

async function UpdateIdentity(forced) {
    if (g_identity.account) {
        const eos = GetEOS();

        var atmos = parseFloat(
            (await eos.getCurrencyBalance(
                "novusphereio",
                g_identity.account,
                "ATMOS"
            ))[0]
        );

        const novusphere = GetNovusphere();
        const notifications = (await novusphere.api({
            aggregate: novusphere.config.collection,
            maxTimeMS: 1000,
            cursor: {},
            pipeline: [
                {
                    $match: forum.match_notifications(
                        g_identity.account,
                        storage.last_notification
                    )
                },
                { $count: "n" }
            ]
        })).cursor.firstBatch;

        g_identity.atmos = (isNaN(atmos) ? 0 : atmos).toFixed(3);
        g_identity.notifications = notifications.length > 0 ? notifications[0].n : 0;
    }

    if (!forced) {
        setTimeout(UpdateIdentity, UPDATE_IDENTITY_SPEED);
    }
}

async function GetIdentity(pull) {

    if (!g_identity.account && pull) {

        if (g_wallet_type == WALLET_TYPE_SCATTER) {
            const scatter = g_wallet_interface;
            const identity = await scatter.getIdentity({
                accounts: [
                    {
                        chainId: SCATTER_CONFIG.chainId,
                        blockchain: SCATTER_CONFIG.blockchain
                    }
                ]
            });

            g_identity.account = identity.accounts[0].name;
            g_identity.auth = identity.accounts[0].authority;
            g_identity.atmos = '0.000';
            g_identity.notifications = 0;

            UpdateIdentity(true);

            // event for identity changing
            window.dispatchEvent(new Event('identity'));
        }

    }

    return g_identity;
}

async function ForgetIdentity() {

    if (g_wallet_type == WALLET_TYPE_SCATTER) {
        const scatter = g_wallet_interface;
        scatter.forgetIdentity();
    }

    g_identity = Object.assign({}, DEFAULT_IDENTITY);
    window.dispatchEvent(new Event('identity'));

    return g_identity;
}

function GetEOS() {
    if (g_wallet_type == WALLET_TYPE_SCATTER) {
        const scatter = g_wallet_interface;

        SCATTER_CONFIG.host = storage.settings.eos_api.host;
        SCATTER_CONFIG.port = storage.settings.eos_api.port;

        return scatter.eos(SCATTER_CONFIG, Eos, EOS_OPTIONS, storage.settings.eos_api.protocol);
    }
    else {
        const eos_api = storage.settings.eos_api;

        return Eos({
            httpEndpoint: eos_api.protocol + '://' + eos_api.host,
            chainId: EOS_OPTIONS.chainId,
            keyProvider: []
        });
    }
}

async function ExecuteEOSActions(actions) {

    if (!Array.isArray(actions)) {
        actions = [actions]; // single action
    }

    if (g_wallet_type == WALLET_TYPE_SCATTER) {
        const identity = await GetIdentity();
        const auth = {
            authorzation: [
                {
                    actor: identity.account,
                    permission: identity.auth
                }
            ]
        };
        
        const eos = GetEOS();

        var eostx = await eos.transaction(actions.map(a => a.contract), _contracts => {
            var contracts = Object.values(_contracts);
            for (var i = 0; i < actions.length; i++) {
                var act = actions[i];
                contracts[i][act.name](act.data, auth);
            }
        });
    
        return eostx.transaction_id;
    }

    return null; // fail
}

export {
    DEFAULT_IDENTITY,
    GetEOS,
    GetIdentity,
    ForgetIdentity,
    ExecuteEOSActions,
    SCATTER_CONFIG,
    EOS_OPTIONS
};