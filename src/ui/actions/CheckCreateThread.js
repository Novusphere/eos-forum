import { GetEOS, GetIdentity, ExecuteEOSActions } from "@/eos";

export default async function CheckCreateThread(sub) {
    if (sub == "anon-r-eos") {
        throw ("You cannot make new threads in this sub from eos-forum");
        return;
    }
}