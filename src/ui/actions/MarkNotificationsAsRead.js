import { GetEOS, GetIdentity, ExecuteEOSActions } from "@/eos";
import { storage, SaveStorage } from "@/storage";

export default async function MarkNotificationsAsRead() {
    var identity = await GetIdentity();
    identity.notifications = 0;

    storage.last_notification = (new Date()).getTime() / 1000;
    SaveStorage();
}