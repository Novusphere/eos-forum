import { storage, SaveStorage } from "@/storage";

export default async function ToggleBlockUser(account, is_blocked) {
    if (is_blocked) {
        var i = storage.moderation.accounts.indexOf(account);
        if (i > -1) {
            storage.moderation.accounts.splice(i, 1);
        }

    } else {
        storage.moderation.accounts.push(account);
    }

    SaveStorage();
}