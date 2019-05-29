import showdown from "showdown";
import jQuery from "jquery";

import twitter from "@/showdown-twitter";

const WHITE_LIST = [
    'A', 'B', 'BLOCKQUOTE', 'CODE', 'DEL',
    'DD', 'DL', 'EM', 'H1', 'H2',
    'H3', 'H4', 'I', 'IMG', 'KBD',
    'LI', 'OL', 'P', 'PRE', 'S',
    'SUP', 'SUB', 'STRONG', 'STRIKE', 'UL',
    'BR', 'HR', '#text', 'U',
    // non-standard
    'DIV', 'FIGURE', 'CENTER'
];

const RX_JAVASCRIPT = new RegExp('javascript', 'i');
const RX_VBSCRIPT = new RegExp('vbscript', 'i');
const RX_DATA = new RegExp('data', 'i');

class MarkdownParser {
    constructor(text, createdAt) {
        this.text = (text ? text : '').replace(/&#x200B;/g, "");
      this.html = '';
        this.attachments = [];

        if (createdAt == undefined || createdAt >= 1538136731) {
            this.useTwitter = true;
        }

        this._generateHtml();
        this._postProcess();
    }
    get _getPre() {
      return window.__ROUTER_MODE__ == "hash" ? "\\#" : "";
    }
    _generateHtml() {
        var extensions = [];

        if (this.useTwitter) {
            //
            // idk why I need to use \\ for the link instead of /, it just breaks if I don't
            // but hey, at least it works
            //

            extensions.push(twitter(
                (username) => {
                    return ` <a href="${this._getPre}/u/${username.trim().substring(1)}">${username}</a>`;
                },
                (tag) => ` <a href="${this._getPre}/tag/${tag}">#${tag}</a>`
            ));
        }

        var sd = new showdown.Converter({
            extensions: extensions,
            simplifiedAutoLink: true,
            requireSpaceBeforeHeadingText: (this.useTwitter) ? true : false
        });

        this.html = sd.makeHtml(this.text);
    }
    _postProcess() {
        var nodes = jQuery.parseHTML(this.html);
        var html = '';
        for (var i = 0; i < nodes.length; i++) {
            html += this._strip(nodes[i]);
        }

        this.html = html;
    }
    _safeAttribute(value) {
        if (value) {
            if (value.search(RX_JAVASCRIPT) == 0 ||
                value.search(RX_VBSCRIPT) == 0 ||
                value.search(RX_DATA) == 0) {

                return 'javascript:void(0)';
            }
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
        // process tiptap mention into a link
        if (el.nodeName == 'SPAN') {
          const [classItem] = el.classList;
          if (classItem === 'mention') {
            var username = this._safeAttribute(el.getAttribute('data-mention-id'));
            if (username) {
              el.outerHTML = `<a href="${this._getPre}/u/${username}">@${username}</a>`
            }
          }
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
