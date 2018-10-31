import { GetEOS, GetIdentity, ExecuteEOSActions } from "@/eos";

export default async function CheckCreateThread(sub) {
    const identity = await GetIdentity();
    if (
        identity.account ||
        sub == "anon" ||
        sub.indexOf("anon-") == 0
    ) {
        if (sub == "anon-r-eos") {
            throw ("You cannot make new threads in this sub from eos-forum");
            return;
        }

        return true; // good

    } else {
        throw ("You must be logged in to post a new thread here!");
    }
}