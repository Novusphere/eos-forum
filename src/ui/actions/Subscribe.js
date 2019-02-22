import { storage, SaveStorage } from "@/storage";
import { SaveAccountState } from "@/accountstate";

export default async function Subscribe(subscribe, sub) {

    function removeAll(arr, item) {
        for (; ;) {
            var i = arr.indexOf(item);
            if (i < 0) {
                break;
            }
            arr.splice(i, 1);
        }
    }

    if (subscribe) {
        if (storage.subscribed_subs.includes(sub)) {
            return true;
        }

        removeAll(storage.unsubscribed_subs, sub);
        storage.subscribed_subs.push(sub);
        
    } else {
        if (storage.unsubscribed_subs.includes(sub)) {
            return false;
        }

        removeAll(storage.subscribed_subs, sub);
        storage.unsubscribed_subs.push(sub);
    }

    storage.subscribed_subs = storage.subscribed_subs.sort();

    //console.log(storage.subscribed_subs);
    //console.log(storage.unsubscribed_subs);

    SaveStorage();
    await SaveAccountState();

    return subscribe;
}