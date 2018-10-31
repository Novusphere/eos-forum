import jQuery from "jquery";

export default {
    post(url, data) {
        return new Promise((resolve, reject) => {
            jQuery.post(url, data, function(result) {
                resolve(result);
            })
            .fail(function(reason) {
                reject(reason);
            });
        });
    },
    get(url, data) {
        return new Promise((resolve, reject) => {
            jQuery.get(url, data, function(result) {
                resolve(result);
            })
            .fail(function(reason) {
                reject(reason);
            });
        });
    },
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

