import requests from "@/requests";

var our_tokens = [{
    name: "EOS",
    logo: "",
    logo_lg: "",
    symbol: "EOS",
    account: "eosio.token"
}, {
    name: "CRASH",
    logo: "",
    logo_lg: "",
    symbol: "CRASH",
    account: "eoscrashplay"
}, {
    name: "PIXEOS",
    logo: "",
    logo_lg: "",
    symbol: "PIXEOS",
    account: "pixeos1token"
}];

async function GetTokensInfo() {
    var tokens = JSON.parse(
        await requests.get(
            "https://raw.githubusercontent.com/eoscafe/eos-airdrops/master/tokens.json"
        )
    );

    tokens = our_tokens.concat(tokens);

    return tokens;
}

async function GetTokenPrecision(eos, account, sym) {
    const stats = await eos.getCurrencyStats(
        account,
        sym
    );

    try {
        const precision = stats[sym].supply
            .split(" ")[0]
            .split(".")[1].length;

        return precision;
    }
    catch (ex) {
        console.log(account + ' ' + sym);
        console.log(stats);
        return 0;
    }
}

export { GetTokensInfo, GetTokenPrecision };