import requests from "@/requests";

var ServiceConfig = {
    url: 'https://eos-service.novusphere.io',
    anon_account: 'eosforumanon'
};

class EOSService {
    constructor (config) {
        this.config = config;
    }
    async anonymousPost(post) {
        var result = await requests.post(this.config.url + '/eosforum/anon', post);
        return result;
    }
}

function GetEOSService() {
    return new EOSService(ServiceConfig);
}

export { GetEOSService };