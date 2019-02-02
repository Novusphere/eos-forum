import { GetEOS, GetIdentity, ExecuteEOSActions } from "@/eos";
import { storage, SaveStorage } from "@/storage";
import { SaveAccountState } from "@/accountstate";

export default async function MarkNotificationsAsRead() {
    var identity = await GetIdentity();
    identity.notifications = 0;

    storage.last_notification = parseInt((new Date()).getTime() / 1000);
    SaveStorage();

    await SaveAccountState();
}