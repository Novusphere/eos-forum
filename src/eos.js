import Eos from 'eosjs';
import ScatterJS from 'scatter-js/dist/scatter.esm';
import { storage } from './storage.js';

var _scatter = null;

const ScatterConfig = {
    blockchain: "eos",
    host: "eos.greymass.com", // ( or null if endorsed chainId )
    port: "443", // ( or null if defaulting to 80 )
    chainId: "aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906" // Or null to fetch automatically ( takes longer )
};

const ScatterEosOptions = {
    broadcast: true,
    sign: true,
    chainId: "aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906" // Or null to fetch automatically ( takes longer )
};

ScatterJS.scatter.connect('eos-forum').then(connected => {
    if (connected) {
        console.log('Scatter loaded');
        _scatter = ScatterJS.scatter;
        window.scatter = null;
    }
    else {
        _scatter = -1;
    }
});

function GetScatter() {
    return new Promise((resolve, reject) => {

        function _check() {
            if (_scatter == -1)
                reject();
            else if (_scatter)
                resolve(_scatter);
            else {
                setTimeout(_check, 1000);
            }
        }

        _check();

    });
}

async function GetScatterIdentity() {
    var identity = await (await GetScatter()).getIdentity({
        accounts: [
            {
                chainId: ScatterConfig.chainId,
                blockchain: ScatterConfig.blockchain
            }
        ]
    });

    return {
        account: identity.accounts[0].name,
        auth: identity.accounts[0].authority
    };
}

function GetEOS(scatter) {
    ScatterConfig.host = storage.settings.eos_api.host;
    ScatterConfig.port = storage.settings.eos_api.port;

    if (scatter) {
        return scatter.eos(ScatterConfig, Eos, ScatterEosOptions, storage.settings.eos_api.protocol);
    }
    else {
        return Eos({
            httpEndpoint: storage.settings.eos_api.protocol + '://' + ScatterConfig.host,
            chainId: ScatterConfig.chainId,
            keyProvider: []
        });
    }
}

export { GetEOS, GetScatter, GetScatterIdentity, ScatterConfig, ScatterEosOptions };