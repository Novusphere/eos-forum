import jQuery from 'jquery';

const MAX_TRACK_NEW_POSTS = 1000;

const DEFAULT_STORAGE = {
    version: 6,
    subscribed_subs: [ "all", "novusphere", "eos", "general", "anon", "movies", "music", "games", "bounties", "test" ],
    new_posts: {},
    settings: {
        novusphere_api: 'https://db.novusphere.io',
        eos_api: {
            host: "eos.greymass.com", // ( or null if endorsed chainId )
            port: "443", // ( or null if defaulting to 80 )
            protocol: "https"
        }
    }
};

var storage = jQuery.extend(true, {}, DEFAULT_STORAGE);

function importStorage(obj) {
    while (obj.version < storage.version) {

        if (obj.version < 5) {
            // subs introduced into storage
            obj.subscribed_subs = storage.subscribed_subs;
        }
        else if (obj.version == 5)
        {
            obj.settings = storage.settings;
        }

        obj.version++;
    }

    if (obj.version >= storage.version)
    {
        storage = obj;
        console.log('Loaded storage');
        //console.log(storage);
        return true;
    }
    console.log('Loaded storage failed');
    return false;
}

window.forgetStorage = function() {
    window.localStorage.setItem('eosforum', '');
    window.location.reload();
}

window.forgetSettings = function() {
    storage.settings = DEFAULT_STORAGE.settings;
    SaveStorage();
    window.location.reload();
}

function SaveStorage() {
    // trim new_posts to length MAX_TRACK_NEW_POSTS
    var new_post_keys = Object.keys(storage.new_posts);
    if (new_post_keys.length > MAX_TRACK_NEW_POSTS) {
        var count = MAX_TRACK_NEW_POSTS - new_post_keys.length;
        for (var i = 0; i < count; i++)
            delete storage.new_posts[new_post_keys[i]];
    }

    window.localStorage.setItem('eosforum', JSON.stringify(storage));
    //console.log('Saved storage');
    //console.log(storage);
}

function LoadStorage() {
    var oldStorageJson = window.localStorage.getItem('eosforum');
    var oldStorage;
    try {
        oldStorage = JSON.parse(oldStorageJson);
        if (!importStorage(oldStorage)) {
            console.log('Failed to import/migrate storage');
            console.log(oldStorageJson);
        }
        SaveStorage();
    }
    catch (ex) {
        console.log('Failed to load storage');
        console.log(ex);
        return;
    }

}

export { DEFAULT_STORAGE, storage, SaveStorage, LoadStorage };