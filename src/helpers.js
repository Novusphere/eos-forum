import jQuery from "jquery";

export default {
    GetHost(href) {
        if (href.indexOf("magnet:") == 0) {
            return "magnet link";
        }
        var parser = document.createElement("a");
        parser.href = href;
        return parser.host.toLowerCase();
    },
    AsyncPost(url, data) {
        return new Promise((resolve, reject) => {
            jQuery.post(url, data, function(result) {
                resolve(result);
            })
            .fail(function(reason) {
                reject(reason);
            });
        });
    },
    AsyncGet(url, data) {
        return new Promise((resolve, reject) => {
            jQuery.get(url, data, function(result) {
                resolve(result);
            })
            .fail(function(reason) {
                reject(reason);
            });
        });
    }
}

