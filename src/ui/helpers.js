import { v4 as uuidv4 } from "uuid";
import ecc from "eosjs-ecc";

import { MarkdownParser } from "@/markdown";
import { storage } from "@/storage";

import { Post } from "@/types/post";

import {
    FORUM_CONTRACT,
    MAX_ITEMS_PER_PAGE,
    UPVOTE_ATMOS_RATE,
    HEADER_TEXTS,
    DEFAULT_SUB
} from "@/ui/constants";

function GetRandomHeaderText() {
    var header_text = HEADER_TEXTS[Math.floor(Math.random() * HEADER_TEXTS.length)];
    return header_text;
}

function GetHost(href) {
    if (href.indexOf("magnet:") == 0) {
        return "magnet link";
    }
    var parser = document.createElement("a");
    parser.href = href;
    return parser.host.toLowerCase();
}

function GenerateAnonData(content) {
    var data = {
        name: storage.anon_id.name,
        pub: "",
        sig: ""
    };

    if (storage.anon_id.key && ecc.isValidPrivate(storage.anon_id.key)) {
        data.pub = ecc.privateToPublic(storage.anon_id.key);
        data.sig = ecc.sign(content, storage.anon_id.key, 'utf8');
    }

    return data;
}

function PlaceholderPost() {
    return new Post();
}

function UpvotesToAtmos(n_votes) {
    return n_votes * UPVOTE_ATMOS_RATE;
}

function AtmosToUpvotes(n_atmos) {
    return n_atmos / UPVOTE_ATMOS_RATE;
}

function IsAnonSub(sub) {
    return sub == "anon" || sub.indexOf("anon-") == 0;
}

function GeneratePostUuid() {
    return uuidv4();
}

function ParseMarkdown(content, createdAt) {
    return new MarkdownParser(content, createdAt);
}

function Route($route, delta) {
    var query = Object.assign({}, $route.query);
    var params = Object.assign({}, $route.params);
    var name = $route.name;

    if (delta.query)
        query = Object.assign(query, delta.query);

    if (delta.params)
        params = Object.assign(params, delta.params);

    return { name: name, query: query, params: params };
}

export default {
    GetRandomHeaderText,
    GenerateAnonData,
    PlaceholderPost,
    UpvotesToAtmos,
    AtmosToUpvotes,
    IsAnonSub,
    GeneratePostUuid,
    ParseMarkdown,
    GetHost,
    Route
}