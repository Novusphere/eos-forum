import Eos from "eosjs";

import ScatterJS from 'scatterjs-core';
import ScatterEOS from 'scatterjs-plugin-eosjs';
//import ScatterLynx from 'scatterjs-plugin-lynx';
ScatterJS.plugins(new ScatterEOS()); //, new ScatterLynx());

import { storage } from "@/storage";

var scatter_timeout = storage.settings.scatter_timeout;

const SCATTER_CONFIG = {
    blockchain: "eos",
    host: "eos.greymass.com", // ( or null if endorsed chainId )
    port: "443", // ( or null if defaulting to 80 )
    chainId: "aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906", // Or null to fetch automatically ( takes longer )
    protocol:'https'
};

const EOS_OPTIONS = {
    broadcast: true,
    sign: true,
    chainId: "aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906" // Or null to fetch automatically ( takes longer )
};

export default class ScatterWallet {
    static async detect(identity) {
        var result = null;

        if (scatter_timeout < 10000) {
            console.log('Trying to connect to scatter with timeout ' + scatter_timeout + 'ms...');
            
            const network = SCATTER_CONFIG;
            var connected = await ScatterJS.connect('eos-forum', { network, initTimeout: scatter_timeout });
            
            if (connected) {
                console.log('Scatter loaded (desktop)');
                result = new ScatterWallet(ScatterJS, identity);
            }
            else {
                scatter_timeout = Math.min(10000, scatter_timeout + 1500);
            }
        }

        if (result && result.scatter.identity) {
            await result.setIdentity();
        }

        return result;
    }

    constructor(scatter, identity) {
        this.identity = identity;
    }

    async setIdentity() {
        await ScatterJS.login();

        const identity = ScatterJS.account('eos');

        this.identity.account = identity.name;
        this.identity.auth = identity.authority;
        this.identity.atmos = '0.000';
        this.identity.token = '0.000';
        this.identity.notifications = 0;

        await this.identity.update(true);
    }

    async forgetIdentity() {
        await ScatterJS.logout();

        this.identity.setDefault();
    }

    eos() {
        SCATTER_CONFIG.host = storage.settings.eos_api.host;
        SCATTER_CONFIG.port = storage.settings.eos_api.port;

        return ScatterJS.eos(SCATTER_CONFIG, Eos, EOS_OPTIONS, storage.settings.eos_api.protocol);
    }

    async executeActions(auth, actions) {
        const eos = this.eos();

        var eostx = await eos.transaction(actions.map(a => a.contract), contracts => {
            for (var i = 0; i < actions.length; i++) {
                const act = actions[i];
                const act_contract = act.contract.replace(/\./g, "_");
                contracts[act_contract][act.name](act.data, auth);
            }   
        });
    
        return eostx.transaction_id;
    }
}