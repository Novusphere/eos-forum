export default {
    notifications(account, last_notification) {
        if (!last_notification) {
            last_notification = 1539100000; // when notifications got introduced
        }

        return {
            "createdAt": { $gt: last_notification },
            "data.json_metadata.sub": { $exists: true, $ne: "" },
            "data.poster": { $ne: account },
            $or: [
                { "data.reply_to_poster": account },
                { "data.json_metadata.parent_poster": account }
            ]
        };
    },
    threadById(id) {
        if (Array.isArray(id)) {
            return {
                transaction: { $in: id }
            };
        }
        else if (id.length == 64) {
            return {
                transaction: id
            };
        }
        else {
            return {
                id: parseInt(id)
            }
        }
    },
    threadReplies(uuid) {
        return { "data.reply_to_post_uuid": uuid };
    },
    threadsBySub(sub, ignore_accounts) {
        var query = {
            "data.json_metadata.sub": sub,
            "data.reply_to_post_uuid": "",
            createdAt: { $gte: 1531434299 } /* Last eosforumtest contract redeploy */
        };

        if (sub == "all") {
            query["data.json_metadata.sub"] = { $exists: true, $ne: "" };
            //{ $regex: "^(?!anon-r).*", $options: 'i' };
        }
        else if (sub == "anon") {
            query["data.json_metadata.sub"] = { $regex: "(^anon$|^anon-)", $options: 'i' };
            //{ $regex: "(^anon$|^anon-)(?!r-)", $options: 'i' };
        }
        /*else if (sub == "eos-referendum") {
            query = {
                "name": "propose",
                "createdAt": { $gte: 1537279731 } // first eosforumrcpp prop
            }
        }*/
        else if (Array.isArray(sub)) {
            query["data.json_metadata.sub"] = { $in: sub };

            // this is mainly used with the home sub, the $gte change helps cut down on load time
            //query["createdAt"]["$gte"] = parseInt((new Date()).getTime() / 1000) - (60*60*24*31*2);
        }

        if (ignore_accounts && ignore_accounts.length > 0) {
            query["data.poster"] = { $nin: ignore_accounts };
        }

        return query;
    },
    feed(following) {
        var two_months_ago = parseInt(new Date().getTime() / 1000) - (60*60*24*31*2);

        return {
            createdAt: { $gte: two_months_ago },
            "data.json_metadata.edit": false,
            "data.json_metadata.sub": { $exists: true, $ne: "" },
            "data.poster": { $in: following },
        };
    },
    threadsByAccount(account) {
        return {
            "data.json_metadata.edit": false,
            "data.json_metadata.sub": { $exists: true, $ne: "" },
            "data.reply_to_post_uuid": "",
            "data.poster": account,
            createdAt: {
                $gte: 1531434299
            } /* Last eosforumtest contract redeploy */
        };
    },
    postsByTag(tag) {
        if (!Array.isArray(tag)) {
            tag = [tag]; // turn into array
        }

        for (var i = 0; i < tag.length; i++) {
            tag[i] = tag[i].toLowerCase();
        }

        return {
            "data.json_metadata.edit": false,
            "tags": { $in: tag },
            //"data.content": { $regex: ".*#" + tag + ".*", $options: 'i' },
            createdAt: {
                $gte: 1531434299
            } /* Last eosforumtest contract redeploy */
        }
    },
    postEdits(poster, post_uuid) {
        return {
            "data.poster": poster,
            "data.json_metadata.parent_uuid": post_uuid,
            "data.json_metadata.edit": true
        };
    },
    postsByAccount(account, replies_only) {
        var query = this.threadsByAccount(account);
        if (replies_only) {
            query["data.reply_to_post_uuid"] = { $ne: "" };
        }
        else {
            delete query["data.reply_to_post_uuid"];
        }
        return query;
    },
    validParent() {
        return {
            $or: [
                { parent: null },
                { "parent.data.json_metadata": { $ne: null } }
            ]
        };
    }
}