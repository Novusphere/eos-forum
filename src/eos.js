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

function GetTransactionData() {
    // https://api.eostracker.io/transactions/459b1f5f2517abfdde719d72d9c287e32e37ea79fccfb45881a0dc38944e2ef0/actions
}

export { Eos, ScatterConfig, ScatterEosOptions, EosTransactionData };