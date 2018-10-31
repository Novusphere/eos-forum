import { GetNovusphere } from "@/novusphere";
import { GetEOS } from "@/eos";
import { storage } from "@/storage";

// views
import Home from "./views/Home";
import Tag from "./views/Tag";
import PostHistory from "./views/PostHistory";
import Thread from "./views/Thread";
import UserNotifications from "./views/UserNotifications";
import UserProfile from "./views/UserProfile";
import Search from "./views/Search";
import Referendum from "./views/Referendum";

// actions
import CheckCreateThread from "./actions/CheckCreateThread";
import Subscribe from "./actions/Subscribe";
import MarkNotificationsAsRead from "./actions/MarkNotificationsAsRead";
import BlockUser from "./actions/BlockUser";
import UpvotePaid from "./actions/UpvotePaid";
import UpvoteFree from "./actions/UpvoteFree";
import GetReccomendedModList from "./actions/GetReccomendedModList"; 
import PushNewPost from "./actions/PushNewPost";
import ReferendumActions from "./actions/Referendum";

// helpers
import UIHelpers from "./helpers";
import { GetIdentity } from "../eos";

window.addEventListener('identityUpdate', async function() {
    const eos = GetEOS();
    const identity = await GetIdentity();
    
    var atmos = parseFloat(
        (await eos.getCurrencyBalance(
            "novusphereio",
            identity.account,
            "ATMOS"
        ))[0]
    );

    const novusphere = GetNovusphere();
    const notifications = (await novusphere.api({
        aggregate: novusphere.config.collection_forum,
        maxTimeMS: 1000,
        cursor: {},
        pipeline: [
            {
                $match: novusphere.query.match.notifications(
                    identity.account,
                    storage.last_notification
                )
            },
            { $count: "n" }
        ]
    })).cursor.firstBatch;

    identity.atmos = (isNaN(atmos) ? 0 : atmos).toFixed(3);
    identity.notifications = notifications.length > 0 ? notifications[0].n : 0;
});

export default {
    views: {
        Home,
        Tag,
        Thread,
        UserNotifications,
        UserProfile,
        PostHistory,
        Search,
        Referendum,
    },
    actions: { // all actions should be async
        CheckCreateThread,
        Subscribe,
        MarkNotificationsAsRead,
        BlockUser,
        UpvotePaid,
        UpvoteFree,
        GetReccomendedModList,
        PushNewPost,
        Referendum: ReferendumActions
    },
    helpers: UIHelpers
};