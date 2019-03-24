import { storage, SaveStorage } from "@/storage";
import { SaveAccountState } from "@/accountstate";

export default async function ToggleFollowUser(account, is_followed) {
    if (!account) {
        return;
    }
    
    var i = storage.following.indexOf(account);
    if (is_followed) {
        if (i > -1) {
            storage.following.splice(i, 1);
        }

    } else if (i == -1) {
        storage.following.push(account);
    }

    SaveStorage();
    await SaveAccountState();
}