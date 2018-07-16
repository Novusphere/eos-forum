import { NovusphereAdapter } from './novusphere-adapter'

const NovusphereConfig = {
    url: 'https://db.novusphere.io', // point to your own instance of novusphere-db
    //url: 'http://localhost:8099',
    collection: 'eosforum',
}

function GetNovusphere() {
    return new NovusphereAdapter(NovusphereConfig);
}

export { GetNovusphere };