const Eos =  require('eosjs');
var _scatter;

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

document.addEventListener('scatterLoaded', scatterExtension => {
    console.log('Scatter loaded');
    _scatter = window.scatter;
    window.scatter = null;
});

async function GetScatterIdentity() {
    var identity = await _scatter.getIdentity({
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
    
function GetEOS() {
    var eos;

    if (window.scatter) {    
        console.log('Scatter loaded');
        _scatter = window.scatter;
        window.scatter = null;
    }
    
    if (_scatter ) {
        eos = _scatter.eos(ScatterConfig, Eos, ScatterEosOptions, 'https');
    }
    else {
        eos = Eos({
            httpEndpoint: 'https://' + ScatterConfig.host,
            chainId: ScatterConfig.chainId, 
            keyProvider: []
        });
    }

    return eos;
}

export { GetEOS, GetScatterIdentity, ScatterConfig, ScatterEosOptions };