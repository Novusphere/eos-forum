import requests from "@/requests";

const FORUM_CONTRACT = "eosio.forum";
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

var BRANDS = null;
var FORUM_BRAND = {};

async function LoadConstants() {
    if (!window.__PRESETS__) { // try to load from global settings
        try {
            const host = window.location.host;

            window.__PRESETS__ = JSON.parse(
                await requests.get(
                    `https://raw.githubusercontent.com/Novusphere/eos-forum-settings/master/presets/${host}.json`
                )
            );

            console.log(`Retrieved presets for ${host}`)
        }
        catch (ex) {
            // ... couldn't load
        }
    }

    if (window.__PRESETS__) {
        var presets = window.__PRESETS__;

        if (presets.header_texts)
            HEADER_TEXTS = presets.header_texts;

        if (presets.default_sub)
            DEFAULT_SUB = presets.default_sub;
    }

    BRANDS = JSON.parse(
        await requests.get(
            "https://raw.githubusercontent.com/Novusphere/eos-forum-settings/master/brand-subs.json"
        )
    );

    console.log('Loaded brands for subs: ' + Object.keys(BRANDS).join(', '));

    Object.assign(FORUM_BRAND, BRANDS["novusphere"]);
}

export {
    FORUM_CONTRACT,
    MAX_ITEMS_PER_PAGE,
    UPVOTE_ATMOS_RATE,
    HEADER_TEXTS,
    DEFAULT_SUB,
    FORUM_BRAND,
    BRANDS,
    LoadConstants
}