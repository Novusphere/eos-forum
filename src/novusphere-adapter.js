import jQuery from 'jquery'
import { NovuspherePager } from './novusphere-pager'

class NovusphereAdapter {
    constructor(config) {
        this.config = config;
    }
    api(args) {
        return new Promise((resolve, reject) => {
            jQuery.post(this.config.url + '/api', JSON.stringify(args), function(result) {
                if (result.error) {
                    console.log(result);
                    throw (result);
                }
                else
                    resolve(result);
            })
            .fail(function(reason) {
                reject(reason);
            });
        });
    }
    pager(size, query) {
        return new NovuspherePager(this, size);
    }
    wait(tryDelay, query) {
        var _this = this;
        return new Promise((resolve, reject) => {

            async function _try() {
                var apiResult = await _this.api(query);
                var payload = apiResult.cursor.firstBatch;
                if (payload.length > 0)
                    resolve(apiResult);
                else
                    setTimeout(_try, tryDelay);
            }

            _try();
        });
    }
    async waitTx(txid, tryDelay, maxtimeMS, collection) {
        var tx = await this.wait(tryDelay, {
            'find': collection ? collection : this.config.collection,
            'maxTimeMS': maxtimeMS,
            'filter': {
              'transaction': txid
            }
         });
         
        return tx;
    }
}

export { NovusphereAdapter };