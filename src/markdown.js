import showdown from 'showdown'
import jQuery from 'jquery'

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

function strip(el) {
    if (el.children) {
        for (var i = 0; i < el.children.length; i++) {
            strip(el.children[i]);
        }
    }

    if (el.nodeName == 'SCRIPT') {
        el.innerHTML = '';
    }
    else if (WHITE_LIST.indexOf(el.nodeName) == -1) {
        el.innerHTML = '';
    }

    if (el.attributes) {
        for (var i = 0; i < el.attributes.length; i++) {

            var value = el.attributes[i].value;
            if (value.search(RX_JAVASCRIPT) == 0 ||
                value.search(RX_VBSCRIPT) == 0 ||
                value.search(RX_DATA) == 0) {

                el.attributes[i].value = '';
            }
        }
    }

    if (el.outerHTML)
        return el.outerHTML;
    return '';
}

function markdown_html(text) {
    var sd = new showdown.Converter({
        simplifiedAutoLink: true
    });
    var html = sd.makeHtml(text);
    return html;
}

function markdown_postprocess(mdHtml) {
    var nodes = jQuery.parseHTML(mdHtml);
    var html = '';
    for (var i = 0 ; i < nodes.length; i++) {
        html += strip(nodes[i]);
    }

    return html;
}

function markdown(text) {
    return markdown_postprocess(markdown_html(text));
}

export { markdown, markdown_html, markdown_postprocess };