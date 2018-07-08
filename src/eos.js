const Eos =  require('eosjs');

const ScatterConfig = {
        blockchain: "eos",
        host: "api.eosnewyork.io", // ( or null if endorsed chainId )
        port: "443", // ( or null if defaulting to 80 )
        chainId: "aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906" // Or null to fetch automatically ( takes longer )
    };

const ScatterEosOptions = {
        broadcast: true,
        sign: true,
        chainId: "aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906" // Or null to fetch automatically ( takes longer )
    };
    
function GetEOS(scatter) {
    var eos;
    
    if (scatter) {
        eos = scatter.eos(ScatterConfig, Eos, ScatterEosOptions, 'https');
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

export { GetEOS, ScatterConfig, ScatterEosOptions };