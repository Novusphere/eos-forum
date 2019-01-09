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

    const precision = stats[sym].max_supply
        .split(" ")[0]
        .split(".")[1].length;

    return precision;
}

export { GetTokensInfo, GetTokenPrecision };