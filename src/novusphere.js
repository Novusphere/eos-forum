import { NovusphereAdapter } from './novusphere-adapter'

const NovusphereConfig = {
    url: 'https://db.novusphere.io', // point to your own instance of novusphere-db
    collection: 'novusphere',
}

function GetNovusphere() {
    return new NovusphereAdapter(NovusphereConfig);
}

export { GetNovusphere };