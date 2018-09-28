import showdown from "showdown";
import jQuery from "jquery";

import twitter from "@/showdown-twitter";

const WHITE_LIST = [
    'A', 'B', 'BLOCKQUOTE', 'CODE', 'DEL', 
    'DD', 'DL', 'EM', 'H1', 'H2', 
    'H3', 'H4', 'I', 'IMG', 'KBD',
    'LI', 'OL', 'P', 'PRE', 'S',
    'SUP', 'SUB', 'STRONG', 'STRIKE', 'UL',
    'BR', 'HR', '#text'
];

const RX_JAVASCRIPT = new RegExp('javascript', 'i');
const RX_VBSCRIPT = new RegExp('vbscript', 'i');
const RX_DATA = new RegExp('data', 'i');

class MarkdownParser {
    constructor(text) {
        this.text = text;
        this.html = '';
        this.attachments = [];

        this._generateHtml();
        this._postProcess();
    }
    _generateHtml() {
        //
        // idk why I need to use \\ for the link instead of /, it just breaks if I don't
        // but hey, at least it works
        //
        var sdExt = twitter(
            (username) => '<a href="\\#/u/' + username + '">@' + username + '</a>',
            //(tag) => '<a href="">#' + tag + '</a>'
            (tag) => '<a href="\\#/tag/' + tag + '">#' + tag + '</a>'
        );

        var sd = new showdown.Converter({
            extensions: [ sdExt ],
            simplifiedAutoLink: true,
            requireSpaceBeforeHeadingText: true /* enabled for hashtags */
        });
        
        this.html = sd.makeHtml(this.text);
    }
    _postProcess() {
        var nodes = jQuery.parseHTML(this.html);
        var html = '';
        for (var i = 0 ; i < nodes.length; i++) {
            html += this._strip(nodes[i]);
        }
        
        this.html = html;
    }
    _safeAttribute(value) {
        if (value.search(RX_JAVASCRIPT) == 0 ||
            value.search(RX_VBSCRIPT) == 0 ||
            value.search(RX_DATA) == 0) {
                
                return '';
        }

        return value;
    }
    _strip(el) {
        if (el.children) {
            for (var i = 0; i < el.children.length; i++) {
                this._strip(el.children[i]);
            }
        }
    
        if (el.nodeName == 'SCRIPT') {
            el.innerHTML = '';
        }
        else if (WHITE_LIST.indexOf(el.nodeName) == -1) {
            if (el.nodeName == 'IFRAME') {
                this.attachments.push({
                    value: this._safeAttribute(el.getAttribute('src')),
                    width: this._safeAttribute(el.getAttribute('width')),
                    height: this._safeAttribute(el.getAttribute('height')),
                    display: 'iframe',
                    type: 'url'
                });
            }

            for (var i = 0; i < el.attributes.length; i++) {
                el.attributes[i].value = '';
            }

            el.innerHTML = '';
            el.style = 'display: none;';
        }
    
        if (el.attributes) {
            for (var i = 0; i < el.attributes.length; i++) {
                el.attributes[i].value = this._safeAttribute(el.attributes[i].value);
            }
        }
    
        if (el.outerHTML)
            return el.outerHTML;
        return '';
    }
}

export { MarkdownParser };