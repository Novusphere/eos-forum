import { storage, SaveStorage } from "@/storage";

export default async function ToggleFollowUser(account, is_followed) {
    if (is_followed) {
        var i = storage.following.indexOf(account);
        if (i > -1) {
            storage.following.splice(i, 1);
        }

    } else {
        storage.following.push(account);
    }

    SaveStorage();
}