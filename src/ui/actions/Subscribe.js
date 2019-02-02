import { storage, SaveStorage } from "@/storage";
import { SaveAccountState } from "@/accountstate";

export default async function Subscribe(subscribe, sub) {
    if (subscribe) {
        if (storage.subscribed_subs.includes(sub)) return;
        storage.subscribed_subs.push(sub);
        SaveStorage();

        await SaveAccountState();

        return true;
    } else {
        // remove all
        for (; ;) {
            var i = storage.subscribed_subs.indexOf(sub);
            if (i < 0) break;
            storage.subscribed_subs.splice(i, 1);
            //console.log(storage.subscribed_subs);
        }

        SaveStorage();

        await SaveAccountState();

        return false;
    }
}