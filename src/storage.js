import jQuery from "jquery";

const MAX_TRACK_NEW_POSTS = 1000;

var DEFAULT_STORAGE = {
    version: 15,
    eos_referendum: true,
    subscribed_subs: ["all", "novusphere", "eos", "anon", "anon-r-eos", "anon-pol-econ", "music", "anon-bounties"],
    new_posts: {},
    last_notification: 0,
    moderation: {
        hide_spam_threads: true,
        mods: [],
        accounts: [],
        transactions: []
    },
    anon_id: {
        name: '',
        key: ''
    },
    settings: {
        atmos_upvotes: true,
        scatter_timeout: 1500,
        theme: "https://eos-forum.org/static/css/theme/day.css",
        novusphere_api: "https://db.novusphere.io",
        eos_api: {
            host: "eos.greymass.com", // ( or null if endorsed chainId )
            port: "443", // ( or null if defaulting to 80 )
            protocol: "https"
        }
    }
};

window.__PRESETS__ = window.localStorage.getItem('presets');
if (window.__PRESETS__) {
    console.log('Found presets');

    try {
        window.__PRESETS__ = JSON.parse(window.__PRESETS__);
        console.log('Loaded presets');
    }
    catch (ex) {
        window.__PRESETS__ = null;
        console.log('Failed to load presets');
        console.log(ex);
    }

    if (window.__PRESETS__.storage) {
        DEFAULT_STORAGE = jQuery.extend(true, DEFAULT_STORAGE, window.__PRESETS__.storage);
        if (window.__PRESETS__.storage.subscribed_subs) {
            DEFAULT_STORAGE.subscribed_subs = window.__PRESETS__.storage.subscribed_subs;
        }
    }
}

var storage = jQuery.extend(true, {}, DEFAULT_STORAGE);

function importStorage(obj) {
    while (obj.version < storage.version) {

        if (obj.version < 5) {
            obj.subscribed_subs = storage.subscribed_subs;
        }
        else if (obj.version < 7) {
            obj.settings = storage.settings;
        }
        else if (obj.version < 8) {
            obj.settings.atmos_upvotes = storage.settings.atmos_upvotes;
        }
        else if (obj.version < 9) {
            obj.settings.scatter_timeout = storage.settings.scatter_timeout;
        }
        else if (obj.version < 11) {
            obj.settings.theme = storage.settings.theme;
        }
        else if (obj.version < 12) {
            obj.eos_referendum = storage.eos_referendum;
        }
        else if (obj.version < 13) {
            obj.moderation = storage.moderation;
        }
        else if (obj.version < 14) {
            obj.moderation.hide_spam_threads = storage.moderation.hide_spam_threads;
        }
        else if (obj.version < 15) {
            obj.anon_id = storage.anon_id;
        }

        obj.version++;
    }

    if (obj.version >= storage.version) {
        storage = obj;
        console.log('Loaded storage version ' + storage.version);
        //console.log(storage);
        return true;
    }
    console.log('Loaded storage failed');
    return false;
}

window.__getStorage = function() {
    return storage;
}

window.__saveStorage = function() {
    SaveStorage();
}

window.__forgetStorage = function () {
    window.localStorage.setItem('eosforum', '');
    window.location.reload();
}

window.__forgetSettings = function () {
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