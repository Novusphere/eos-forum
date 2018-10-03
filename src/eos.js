import Eos from "eosjs";
import ScatterJS from "scatter-js/dist/scatter.esm";

import { storage } from '@/storage';

const DEFAULT_IDENTITY = { account: '', auth: '', atmos: '0.000' };

var _scatter = null;
var _identity = DEFAULT_IDENTITY;
var _lastIdentityUpdate = 0;

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

console.log('Trying to connect to scatter...');
ScatterJS.scatter.connect('eos-forum', { initTimeout: 1500 }).then(connected => {
    if (connected) {
        console.log('Scatter loaded');
        _scatter = ScatterJS.scatter;
        window.scatter = null;

        if (_scatter.identity) {
            GetScatterIdentity(true);
        }
    }
    else {
        console.log('Scatter could not be loaded');
        _scatter = -1;
    }
});

function GetScatter() {
    return new Promise((resolve, reject) => {

        function _check() {
            if (_scatter)
                resolve((_scatter == -1) ? null : _scatter);
            else {
                setTimeout(_check, 100);
            }
        }

        _check();

    });
}

async function GetScatterIdentity(tryPull) {
    var scatter = await GetScatter();
    if (tryPull && !_identity.account) {
        if (scatter != null) {
            const identity = await scatter.getIdentity({
                accounts: [
                    {
                        chainId: ScatterConfig.chainId,
                        blockchain: ScatterConfig.blockchain
                    }
                ]
            });

            _identity = {
                account: identity.accounts[0].name,
                auth: identity.accounts[0].authority,
                atmos: '0.000'
            };
        }
    }

    if (_identity.account) {
        var now = (new Date()).getTime();
        if (now - _lastIdentityUpdate >= 1000) {
            const eos = GetEOS();
            var atmos = parseFloat((await eos.getCurrencyBalance("novusphereio", _identity.account, "ATMOS"))[0]);
            atmos = (isNaN(atmos) ? 0 : atmos).toFixed(3);

            _identity.atmos = atmos;
            _lastIdentityUpdate = now;
        }
    }

    return _identity;
}

async function ForgetScatterIdentity() {
    const scatter = await GetScatter();
    scatter.forgetIdentity();

    _identity = DEFAULT_IDENTITY;
    return _identity;
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

export {
    DEFAULT_IDENTITY,
    GetEOS,
    GetScatter,
    GetScatterIdentity,
    ForgetScatterIdentity,
    ScatterConfig,
    ScatterEosOptions
};