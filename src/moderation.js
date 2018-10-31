import { storage } from "@/storage";
import requests from "@/requests";

class Moderation {
    constructor() {
        this.resetCache();
    }

    resetCache() {
        this.cache = {};
    }

    async resolve(value, key) {
        if (key == '197001') {
            return null;
        }

        var endpoint = value;
        if ((endpoint.indexOf('https:') == 0) || (endpoint.indexOf('http:') == 0)) {
            // pass do nothing
        }
        else if (endpoint.indexOf('/') > -1) { // github
            endpoint = 'https://raw.githubusercontent.com/' + endpoint + '/master';
        }
        else { // eos account
            // TO-DO: resolve eos account to URL ep
            return null;
        }

        try {
            endpoint = endpoint + '/' + key + '.json';
            var json = JSON.parse(await requests.get(endpoint));
            return json;
        }
        catch (ex) {
            // failed to parse
            return null;
        }
    }

    dateToKey(date) {
        var key = (date.getUTCFullYear() * 100) + (date.getUTCMonth() + 1);
        return key;
    }

    async getCacheSet(createdAt) {

        var now = new Date().getTime();
        var date = new Date(createdAt * 1000);
        var key = this.dateToKey(date);
        var data;

        // lock
        for (;;) {
            data = this.cache[key];
            if (data == 0) {
                await requests.sleep(5);
            }
            else {
                break;
            }
        }

        if (data == null || (now - data.last_updated) >= 1000 * 60 * 10) { // update cache every 10 min

            this.cache[key] = 0; // lock

            data = {
                last_updated: now,
                accounts: [],
                transactions: [],
                nsfw: [],
                pinned: []
            };

            var s_accounts = new Set();
            var s_transactions = new Set();
            var s_nsfw = new Set();
            var pinned = {};

            function addToSet(s, e) {
                if (e) {
                    for (var j = 0; j < e.length; j++) {
                        s.add(e[j]);
                    }
                }
            }

            for (var i = 0; i < storage.moderation.mods.length; i++) {
                var json = await this.resolve(storage.moderation.mods[i], key);
                if (json == null) { // failed to resolve
                    continue;
                }

                try {
                    addToSet(s_accounts, json.account);
                    addToSet(s_transactions, json.transactions);
                    addToSet(s_nsfw, json.nsfw);

                    if (json.pinned) {
                        for (var sub in json.pinned) {
                            var s_pinned = pinned[sub];
                            if (!s_pinned) {
                                s_pinned = new Set();
                                pinned[sub] = s_pinned;
                            }
                            addToSet(s_pinned, json.pinned[sub]);
                        }
                    }
                }
                catch (ex) {
                    console.log('error with moderator ' + storage.moderation.mods[i] + ' for ' + key);
                }
            }

            for (var sub in pinned) {
                pinned[sub] = Array.from(pinned[sub]);
            }

            data.account = Array.from(s_accounts);
            data.transactions = Array.from(s_transactions);
            data.nsfw = Array.from(s_nsfw);
            data.pinned = pinned;

            this.cache[key] = data;
        }
        return data;
    }

    async getCurrentSet() {
        var now = new Date();
        var set1 = await this.getCacheSet(now.getTime() / 1000);
        return set1;
    }

    async getBlockedAccounts() {
        // only returns blocked accounts for this month/last month
        var now = new Date();
        var set1 = await this.getCurrentSet();
        var set2 = await this.getCacheSet((now.getTime() - (1000 * 60 * 60 * 24 * 31)) / 1000);

        var accounts = new Set();
        for (var i = 0; i < set1.accounts.length; i++) {
            accounts.add(set1.accounts[i]);
        }
        for (var i = 0; i < set2.accounts.length; i++) {
            accounts.add(set2.accounts[i]);
        }
        for (var i = 0; i < storage.moderation.accounts.length; i++) {
            accounts.add(storage.moderation.accounts[i]);
        }

        return Array.from(accounts);
    }

    async getPinned(sub) {
        var set1 = await this.getCurrentSet();
        var result = [];

        var all = set1.pinned["all"];
        if (all) {
            result = Array.concat(result, all);
        }

        if (sub.indexOf('anon-') == 0) {
            var anon = set1.pinned["anon"];
            if (anon) {
                result = Array.concat(result, anon);
            }
        }

        var p_sub = set1.pinned[sub];
        if (p_sub) {
            result = Array.concat(result, p_sub);
        }

        return result;
    }

    async isNsfw(createdAt, txid) {
        var set = await this.getCacheSet(createdAt);
        return set.nsfw.includes(txid);
    }

    async isBlocked(createdAt, txid, account) {
        if (account && storage.moderation.accounts.includes(account)) {
            return true;
        }

        if (txid && storage.moderation.transactions.includes(txid)) {
            return true;
        }

        if (!createdAt) {
            return false;
        }

        var set = await this.getCacheSet(createdAt);
        return (account && set.accounts.includes(account)) ||
            (txid && set.transactions.includes(txid));
    }
};

const moderation = new Moderation();

export { moderation };