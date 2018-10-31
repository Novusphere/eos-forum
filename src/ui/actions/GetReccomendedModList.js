import requests from "@/requests";

export default async function GetReccomendedModList() {
    var git = JSON.parse(await requests.get(
        "https://raw.githubusercontent.com/Novusphere/eos-forum-mod-list/master/list.json"
    ));

    return git.list;
};