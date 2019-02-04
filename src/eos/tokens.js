import requests from "@/requests";

var token_cache = null;

async function GetTokensInfo() {
    if (!token_cache) {

        var tokens = JSON.parse(
            await requests.get(
                "https://raw.githubusercontent.com/eoscafe/eos-airdrops/master/tokens.json"
            )
        );

        var our_tokens = [];
        try {
            our_tokens = JSON.parse(
                await requests.get(
                    "https://raw.githubusercontent.com/Novusphere/eos-forum-settings/master/tokens.json"
                )
            );
        }
        catch (ex) {
            console.log('malformed (our) tokens.json');
            console.log(ex);
        }


        // merge our_tokens into tokens with overrides
        for (var i = 0; i < our_tokens.length; i++) {

            var token = our_tokens[i];
            var existing = tokens.find(t => t.symbol == token.symbol && t.account == token.account);
            if (existing) {
                Object.assign(existing, token);
            }
            else {
                tokens.push(token);
            }

        }

        token_cache = tokens;
    }

    return token_cache;
}

async function GetTokenPrecision(eos, account, sym) {
    try {
        const stats = await eos.getCurrencyStats(
            account,
            sym
        );

        const precision = stats[sym].supply
            .split(" ")[0]
            .split(".")[1].length;

        return precision;
    }
    catch (ex) {
        //console.log(account + ' ' + sym);
        //console.log(stats);
        return 0;
    }
}

export { GetTokensInfo, GetTokenPrecision };