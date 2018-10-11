import { storage } from "@/storage";
import Helpers from "@/helpers";

class Moderation {
    constructor() {
        this.resetCache();
    }

    resetCache() {
        this.cache = {};
    }

    async resolve(value, key) {
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
            var json = JSON.parse(await Helpers.AsyncGet(endpoint));
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
        var data = this.cache[key];
        if (data == null || (now - data.last_updated) >= 1000 * 60 * 10) { // update cache every 10 min

            data = { last_updated: now, accounts: [], transactions: [] };

            for (var i = 0; i < storage.moderation.mods.length; i++) {
                var json = await this.resolve(storage.moderation.mods[i], key);
                if (json == null) { // failed to resolve
                    continue;
                }

                if (json.accounts) {
                    for (var j = 0; j < json.accounts.length; j++) {
                        data.accounts.push(json.accounts[j]);
                    }
                }
                if (json.transactions) {
                    for (var j = 0; j < json.transactions.length; j++) {
                        data.transactions.push(json.transactions[j]);
                    }
                }
            }

            this.cache[key] = data;
        }
        return data;
    }

    async getBlockedAccounts() {
        // only returns blocked accounts for this month/last month
        var now = new Date();
        var set1 = await this.getCacheSet(now.getTime() / 1000);
        var set2 = await this.getCacheSet((now.getTime() - (1000 * 60 * 60 * 24 * 31)) / 1000);

        var accounts = [];
        for (var i = 0; i < set1.accounts.length; i++) {
            accounts.push(set1.accounts[i]);
        }
        for (var i = 0; i < set2.accounts.length; i++) {
            accounts.push(set2.accounts[i]);
        }
        for (var i = 0; i < storage.moderation.accounts.length; i++) {
            accounts.push(storage.moderation.accounts[i]);
        }

        return accounts;
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