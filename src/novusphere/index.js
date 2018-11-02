import { NovusphereAdapter } from "./adapter";
import { storage, SaveStorage } from "@/storage";

const NovusphereConfig = {
    url: 'https://db.novusphere.io',
    collection_forum: 'eosforum',
    collection_nsdb: 'ns',
    collection_post_state: 'ns_post_state',
    collection_post_vote: 'ns_post_vote'
}

function GetNovusphere() {
    NovusphereConfig.url = storage.settings.novusphere_api;
    return new NovusphereAdapter(NovusphereConfig);
}

export { GetNovusphere };