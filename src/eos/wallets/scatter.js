import Eos from "eosjs";

import ScatterJS from 'scatterjs-core';
import ScatterEOS from 'scatterjs-plugin-eosjs';
ScatterJS.plugins(new ScatterEOS());

import { storage } from "@/storage";

var scatter_timeout = storage.settings.scatter_timeout;

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

export default class ScatterWallet {
    static async detect(identity) {
        var result = null;

        if (window.scatter) {
            var scatter = window.scatter;
            window.scatter = null;
            console.log('Scatter loaded (plugin)');
            result = new ScatterWallet(scatter, identity);
        }
        if (scatter_timeout < 10000) {
            console.log('Trying to connect to scatter with timeout ' + scatter_timeout + 'ms...');
            var connected = await ScatterJS.scatter.connect('eos-forum', { initTimeout: scatter_timeout });
            if (connected) {
                console.log('Scatter loaded (desktop)');
                result = new ScatterWallet(ScatterJS.scatter, identity);
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
        this.scatter = scatter;
        this.identity = identity;
    }

    async setIdentity() {
        const scatter = this.scatter;
        const identity = await scatter.getIdentity({
            accounts: [
                {
                    chainId: SCATTER_CONFIG.chainId,
                    blockchain: SCATTER_CONFIG.blockchain
                }
            ]
        });

        this.identity.account = identity.accounts[0].name;
        this.identity.auth = identity.accounts[0].authority;
        this.identity.atmos = '0.000';
        this.identity.notifications = 0;

        await this.identity.update(true);
    }

    async forgetIdentity() {
        const scatter = this.scatter;
        scatter.forgetIdentity();

        this.identity.setDefault();
    }

    eos() {
        const scatter = this.scatter;

        SCATTER_CONFIG.host = storage.settings.eos_api.host;
        SCATTER_CONFIG.port = storage.settings.eos_api.port;

        return scatter.eos(SCATTER_CONFIG, Eos, EOS_OPTIONS, storage.settings.eos_api.protocol);
    }

    async executeActions(auth, actions) {
        const eos = this.eos();

        var eostx = await eos.transaction(actions.map(a => a.contract), contracts => {
            for (var i = 0; i < actions.length; i++) {
                var act = actions[i];
                contracts[act.contract][act.name](act.data, auth);
            }   
        });
    
        return eostx.transaction_id;
    }
}