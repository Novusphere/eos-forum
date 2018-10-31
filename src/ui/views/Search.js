import { GetEOS, GetIdentity, ExecuteEOSActions } from "@/eos";
import { GetNovusphere } from "@/novusphere";

export default async function Search() {
    const novusphere = GetNovusphere();
    var subs = (await novusphere.api({
        aggregate: novusphere.config.collection_forum,
        maxTimeMS: 1000,
        cursor: {},
        pipeline: [
            {
                $match: {
                    "data.json_metadata.sub": { $exists: true, $ne: "" },
                    "data.json_metadata.edit": false
                }
            },
            {
                $group: {
                    _id: "$data.json_metadata.sub",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: {
                    count: -1
                }
            }
        ]
    })).cursor.firstBatch;

    return {
        subs: subs
    }
}