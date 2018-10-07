import { storage } from "@/storage";
import Helpers from "@/helpers";

class Moderation {
    constructor() {
        this.cache = {};
    }
    
    async getCacheSet(createdAt) {
        var now = new Date().getTime();
        var date = new Date(createdAt * 1000);
        var key = (date.getUTCFullYear() * 100) + (date.getUTCMonth() + 1); 
        var data = this.cache[key];
        if (data == null || (now - data.last_updated) >= 1000 * 60 * 10) { // update cache every 10 min

            data = { last_updated: now, accounts: [], transactions: [] };

            for (var i = 0; i < storage.moderation.mods.length; i++) {
                try {
                    var endpoint = 'https://raw.githubusercontent.com/' + storage.moderation.mods[i] + '/master/' + key + '.json';
                    var json = JSON.parse(await Helpers.AsyncGet(endpoint));
                    //console.log(json);

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
                catch (ex) {
                    // pass
                    //console.log(ex);
                }
            }

            //console.log(data);
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
        
        return accounts;
    }

    async isBlocked(createdAt, txid, account) {
        if (storage.moderation.accounts.includes(account)) {
            return true;
        }
        if (storage.moderation.transactions.includes(txid)) {
            return true;
        }
        var set = await this.getCacheSet(createdAt);
        return set.accounts.includes(account) || set.transactions.includes(txid);
    }
};

const moderation = new Moderation();

export { moderation };