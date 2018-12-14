const FORUM_CONTRACT = "eosforumrcpp";
const MAX_ITEMS_PER_PAGE = 25;
const UPVOTE_ATMOS_RATE = 10; // 1 upvote in ATMOS
var HEADER_TEXTS = [
    "Did you know you in your **settings** you can toggle between a day and night theme?",
    "Did you know you in your **settings** you can set delegated moderators to help filter spam?",
    "Did you know you can block users who post spam by clicking their name to visit their profile and then clicking block?",
    "Did you know you can post without an account in any of the **anon-** subs?"
];

var DEFAULT_SUB = "all";
if (window.__PRESETS__ && window.__PRESETS__.default_sub) {
    DEFAULT_SUB = window.__PRESETS__.default_sub;
}

// TO-DO: remove hard coding?
var BRANDS = {
    "novusphere": {
        "title": "A decentralized forum",
        "logo": "https://cdn.novusphere.io/static/atmos.svg",
        "icon": "https://cdn.novusphere.io/static/atmos2.png",
        "banner": "",
        "token_symbol": "ATMOS",
        "token_contract": "novusphereio"
    },
    "eoscafe": {
        "title": "A decentralized coffee lover's forum",
        "logo": "https://cdn.discordapp.com/attachments/522320367293825036/522320438161047552/icon-1.png",
        "icon": "https://cdn.discordapp.com/attachments/522320367293825036/522320438161047552/icon-1.png",
        "banner": "https://cdn.discordapp.com/attachments/522320367293825036/523167806607589386/image0.jpg",
        "token_symbol": "EOS",
        "token_contract": "eosio.token"
    },
    "eos": {
        "title": "EOS Community",
        "logo": "https://cdn.novusphere.io/static/eos3.svg",
        "icon": "https://cdn.novusphere.io/static/eos3.png",
        "banner": "",
        "token_symbol": "EOS",
        "token_contract": "eosio.token"
    }
}

var FORUM_BRAND =  Object.assign({}, BRANDS["novusphere"]);

if (window.__PRESETS__) {
    var presets = window.__PRESETS__;

    if (presets.header_texts)
        HEADER_TEXTS = presets.header_texts;

    if (presets.default_sub)
        DEFAULT_SUB = presets.default_sub;

    if (presets.brand)
        FORUM_BRAND = presets.brand;
}

export {
    FORUM_CONTRACT,
    MAX_ITEMS_PER_PAGE,
    UPVOTE_ATMOS_RATE,
    HEADER_TEXTS,
    DEFAULT_SUB,
    FORUM_BRAND,
    BRANDS
}