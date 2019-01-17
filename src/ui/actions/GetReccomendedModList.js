import requests from "@/requests";

export default async function GetReccomendedModList() {
    var git = JSON.parse(await requests.get(
        "https://raw.githubusercontent.com/Novusphere/eos-forum-settings/master/mod-list.json"
    ));

    return git.list;
};