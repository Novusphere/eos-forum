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