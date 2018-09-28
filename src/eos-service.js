import jQuery from "jquery";

var ServiceConfig = {
    url: 'https://eos-service.novusphere.io',
    anonymousAccount: 'eosforumanon'
};

class EOSService {
    constructor (config) {
        this.config = config;
    }
    async anonymousPost(post) {
        var _this = this;
        return new Promise((resolve, reject) => {
            jQuery.post(_this.config.url + '/eosforum/anon', post, function (res) {
                resolve(res);
            }).fail(function() {
                reject();
            });
        });
    }
}

function GetEOSService() {
    return new EOSService(ServiceConfig);
}

export { GetEOSService };