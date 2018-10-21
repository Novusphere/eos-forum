/**
 * Support for @username and #hashtag
 * 
 * Modified from: https://raw.githubusercontent.com/showdownjs/twitter-extension/master/src/showdown-twitter.js
 * Modified on 7/28/2018 by the novusphere.io developers to add custom links
 * 
 */
export default function (makeUser, makeTag) {
    return function () {
        return [
            // @username syntax
            {
                type: 'lang',
                regex: '\\s([@][\\w_-]+)', //'\\B(\\\\)?@([\\w_-]+)\\b',
                replace: function (match, leadingSlash, username) {
                    // Check if we matched the leading \ and return nothing changed if so
                    if (leadingSlash === '\\') {
                        return match;
                    } else {
                        return makeUser(match);
                    }
                }
            },

            // #hashtag syntax
            {
                type: 'lang',
                regex: '\\B(\\\\)?#([a-zA-Z0-9_]+)\\b', // \B(\\)?#([a-zA-Z0-9_]+)\b
                replace: function (match, leadingSlash, tag) {
                    // Check if we matched the leading \ and return nothing changed if so
                    if (leadingSlash === '\\') {
                        return match;
                    } else {
                        return makeTag(tag);
                    }
                }
            },

            // Escaped @'s
            {
                type: 'lang',
                regex: '\\\\@',
                replace: '@'
            }
        ];
    }
}
