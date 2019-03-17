import requests from '@/requests';

var user_icons_json = null;

async function GetUserIcons(account) {
    if (!user_icons_json) {
        try {
            user_icons_json = JSON.parse(await requests.get('https://raw.githubusercontent.com/Novusphere/eos-forum-settings/master/user-icons.json'));
        }
        catch (ex) {
            user_icons_json = {};
        }
    }

    var result = [];

    if (account in user_icons_json) {
        result.push(user_icons_json[account]);
    }

    return result;
}

export {
    GetUserIcons
}