import { NovusphereAdapter } from './novusphere-adapter.js';
import { storage, SaveStorage } from './storage.js';

const NovusphereConfig = {
    url: 'https://db.novusphere.io', // point to your own instance of novusphere-db
    //url: 'http://localhost:8099',
    collection: 'eosforum',
}

function GetNovusphere() {
    NovusphereConfig.url = storage.settings.novusphere_api;
    return new NovusphereAdapter(NovusphereConfig);
}

export { GetNovusphere };