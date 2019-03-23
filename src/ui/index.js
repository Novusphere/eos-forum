import { GetNovusphere } from "@/novusphere";
import { GetEOS, GetIdentity } from "@/eos";
import { storage, SaveStorage } from "@/storage";
import { LoadAccountState, SaveAccountState } from "@/accountstate";

// views
import Home from "./views/Home";
import Feed from "./views/Feed";
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
import ToggleBlockUser from "./actions/ToggleBlockUser";
import ToggleFollowUser from "./actions/ToggleFollowUser";
import UpvotePaid from "./actions/UpvotePaid";
import UpvoteFree from "./actions/UpvoteFree";
import GetReccomendedModList from "./actions/GetReccomendedModList";
import PushNewPost from "./actions/PushNewPost";
import ReferendumActions from "./actions/Referendum";

// helpers
import UIHelpers from "./helpers";

// constants
import { FORUM_BRAND } from "./constants";

window.addEventListener('identity', async function() {
    await LoadAccountState();
    await SaveAccountState();
    SaveStorage();
});

window.addEventListener('identityUpdate', async function () {
    //console.log('identity' + Math.random());

    const eos = GetEOS();
    const identity = await GetIdentity();

    var atmos = parseFloat(
        (await eos.rpc.get_currency_balance(
            "novusphereio",
            identity.account,
            "ATMOS"
        ))[0]
    );

    var token = atmos;
    if (FORUM_BRAND.token_contract &&
        (FORUM_BRAND.token_contract != 'novusphereio' ||
        FORUM_BRAND.token_symbol != 'ATMOS')) {
            
        token = parseFloat(
            (await eos.rpc.get_currency_balance(
                FORUM_BRAND.token_contract,
                identity.account,
                FORUM_BRAND.token_symbol
            ))[0]
        );
    }

    const novusphere = GetNovusphere();
    const notifications = (await novusphere.api({
        aggregate: novusphere.config.collection_forum,
        maxTimeMS: 7500,
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
    identity.token = (isNaN(token) ? 0 : token).toFixed(3);
    identity.notifications = notifications.length > 0 ? notifications[0].n : 0;
});

export default {
    views: {
        Home,
        Feed,
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
        ToggleBlockUser,
        ToggleFollowUser,
        UpvotePaid,
        UpvoteFree,
        GetReccomendedModList,
        PushNewPost,
        Referendum: ReferendumActions
    },
    helpers: UIHelpers
};