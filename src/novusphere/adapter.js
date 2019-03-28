import requests from "@/requests";
import query from "./query";

class NovusphereAdapter {
    constructor(config) {
        this.config = config;
        this.query = query;
    }
    async api(args) {
        var result = await requests.post(this.config.url + '/api', JSON.stringify(args));
        if (result.error) {
            console.log(result);
            throw result;
        }
        return result;
    }
    async cors(url) {
        var endpoint = this.config.url + '/service/cors/?' + url;
        var result = await requests.get(endpoint);
        return result;
    }
    async getApiEnabled(endpoint, field) {
        //
        // check whether if our current api end point has an api enabled
        //
        try {
            if (this[field] == undefined) {
                var check = await requests.get(this.config.url + endpoint);
                this[field] = check.enabled;
            }
        }
        catch (ex) {
            this[field] = false;
        }

        if (this[field]) {
            return (this.config.url);
        }

        return 'https://db.novusphere.io';
    }
    async authorizeAccountState(name, key, nonce, sig) {
        var endpoint = (await this.getApiEnabled('/service/accountstate/', "_account_state")) +
            '/service/accountstate/authorize';

        var result = await requests.post(endpoint, {
            value: JSON.stringify({
                name: name,
                key: key,
                nonce: nonce,
                sig: sig
            })
        });

        return result;
    }
    async isAccountStateAuthorized(session_key, name, key) {
        var endpoint = (await this.getApiEnabled('/service/accountstate/', "_account_state")) +
            '/service/accountstate/authorized';

        endpoint += '?session_key=' + session_key;
        endpoint += '&key=' + key;
        endpoint += '&name=' + name;

        var result = await requests.get(endpoint);
        //console.log(JSON.stringify(result));

        if (result.error) {
            return false;
        }
        return result.authorized;
    }
    async getAccountState(id) {
        var endpoint = (await this.getApiEnabled('/service/accountstate/', "_account_state")) +
            '/service/accountstate/get';

        if (id.length >= 13) {
            endpoint += '?key=' + id;
        }
        else {
            endpoint += '?name=' + id;
        }

        var result = await requests.get(endpoint);
        if (result.error) {
            return null;
        }
        return result;
    }
    async saveAccountState(account) {
        var endpoint = (await this.getApiEnabled('/service/accountstate/', "_account_state")) +
            '/service/accountstate/save';

        var result = await requests.post(endpoint, { value: JSON.stringify(account) });
        return result;
    }
    async anonymousPost(post) {
        var endpoint = (await this.getApiEnabled('/service/anon/', "_anonymous_post")) +
            '/service/anon/post';

        var result = await requests.post(endpoint, post);
        return result;
    }
    async wait(delay, query) {
        for (; ;) {
            var result = (await this.api(query));
            var payload = result.cursor.firstBatch;
            if (payload.length > 0)
                return result;

            await requests.sleep(delay);
        }
    }
    async waitTx(txid, delay, maxtimeMS, collection) {

        if (!maxtimeMS) {
            maxtimeMS = 1000;
        }

        if (!collection) {
            collection = this.config.collection_forum;
        }

        var tx = await this.wait(delay, {
            'find': collection,
            'maxTimeMS': maxtimeMS,
            'filter': {
                'transaction': txid
            }
        });

        return tx;
    }
}

export { NovusphereAdapter };