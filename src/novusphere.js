import { NovusphereAdapter } from './novusphere-adapter.js';
import { storage, SaveStorage } from './storage.js';

const NovusphereConfig = {
    url: 'https://db.novusphere.io', // point to your own instance of novusphere-db
    //url: 'http://localhost:8099',
    collection: 'eosforum',
    collection_post_state: 'ns_post_state',
    collection_post_vote: 'ns_post_vote'
}

function GetNovusphere() {
    NovusphereConfig.url = storage.settings.novusphere_api;
    return new NovusphereAdapter(NovusphereConfig);
}

export { GetNovusphere };