export default {
    GetHost(href) {
        if (href.indexOf("magnet:") == 0) {
            return "magnet link";
        }
        var parser = document.createElement("a");
        parser.href = href;
        return parser.host.toLowerCase();
    }
}

