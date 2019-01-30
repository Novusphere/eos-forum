import sha256 from "sha256";

import requests from "@/requests";

import { GetEOS, GetIdentity, ExecuteEOSActions } from "@/eos";
import { GetNovusphere } from "@/novusphere";

const REFERENDUM_COLLECTION = "eosforum";
const REFERENDUM_CONTRACT = "eosio.forum";

export default {
    async GetProposal(txid) {
        const novusphere = GetNovusphere();

        const MATCH_QUERY = {
            name: "propose",
            transaction: txid
        };

        const LOOKUP_EXPIRED = {
            from: REFERENDUM_COLLECTION,
            let: {
                proposal_name: "$data.proposal_name",
                createdAt: "$createdAt"
            },
            pipeline: [
                { $match: { name: "clnproposal" } },
                {
                    $project: {
                        txid: "$transaction",
                        test: {
                            $and: [
                                { $eq: ["$data.proposal_name", "$$proposal_name"] },
                                { $gte: ["$createdAt", "$$createdAt"] }
                            ]
                        }
                    }
                },
                { $match: { test: true } }
            ],
            as: "expired"
        };

        var prop = (await novusphere.api({
            aggregate: REFERENDUM_COLLECTION,
            maxTimeMS: 7500,
            cursor: {},
            pipeline: [
                { $match: MATCH_QUERY },
                { $lookup: LOOKUP_EXPIRED },
            ]
        })).cursor.firstBatch;

        return (prop && prop.length > 0) ? prop[0] : null;
    },
    async GetVotes(prop) {
        var novusphere = GetNovusphere();

        var votes = (await novusphere.api({
            find: REFERENDUM_COLLECTION,
            maxTimeMS: 7500,
            filter: {
                name: "vote",
                "data.proposal_name": prop.data.proposal_name,
                createdAt: { $gte: prop.createdAt }
            },
            sort: novusphere.query.sort.time()
        })).cursor.firstBatch;

        var unvotes = (await novusphere.api({
            find: REFERENDUM_COLLECTION,
            maxTimeMS: 7500,
            filter: {
                name: "unvote",
                "data.proposal_name": prop.data.proposal_name,
                createdAt: { $gte: prop.createdAt }
            },
            sort: novusphere.query.sort.time()
        })).cursor.firstBatch;

        return { votes: votes, unvotes: unvotes };
    },
    async Status(txid) {
        var eos = GetEOS();
        var prop = await this.GetProposal(txid);

        var eosvotes = JSON.parse(await requests.get('https://s3.amazonaws.com/api.eosvotes.io/eosvotes/tallies/latest.json'));
        var status = eosvotes[prop.data.proposal_name];

        var voteResult_for = 0, voteResult_against = 0;

        if (status) {
            var voteResult_for = status.stats.staked['1'];
            var voteResult_against = status.stats.staked['0'];

            voteResult_for = (isNaN(voteResult_for) ? 0 : parseInt(voteResult_for)) / 10000;
            voteResult_against = (isNaN(voteResult_against) ? 0 : parseInt(voteResult_against)) / 10000;
        }

        return {
            title: prop.data.title,
            for: voteResult_for,
            against: voteResult_against,
            approval: voteResult_for / Math.max(voteResult_for + voteResult_against, 1),
            voters: status ? status.stats.votes.total : (-1)
        }

        /*var pv = await this.GetVotes(prop);

        var voteResult = {};
        var voteResult_for = 0;
        var voteResult_against = 0;

        // update vote results
        for (var i = 0; i < pv.votes.length; i++) {
            var v = pv.votes[i];
            if (v.data.voter in voteResult) {
                continue;
            }
            voteResult[v.data.voter] = {
                account: v.data.voter,
                txid: v.transaction,
                time: v.createdAt,
                vote: v.data.vote,
                json: v.data.vote_json,
                staked: 0
            };
        }

        // remove unvoted unvotes
        for (var i = 0; i < pv.unvotes.length; i++) {
            var uv = pv.unvotes[i];
            var vr = voteResult[uv.data.voter];
            if (vr) {
                if (vr.time < uv.createdAt) {
                    delete voteResult[uv.data.voter];
                }
            } else {
                //console.log("no vote found for " + uv.data.voter);
            }
        }

        // pull stake data from bp api async
        await Promise.all(
            Object.keys(voteResult).map(
                voter =>
                    new Promise(async resolve => {
                        var account = await eos.getAccount(voter);
                        //var staked = (account.voter_info) ? (account.voter_info.staked / 10000) : 0;
                        //var staked = (account.cpu_weight + account.net_weight) / 10000;
                        var staked = account.self_delegated_bandwidth
                            ? parseFloat(account.self_delegated_bandwidth.cpu_weight) +
                            parseFloat(account.self_delegated_bandwidth.net_weight)
                            : 0;
                        var vr = voteResult[voter];
                        vr.staked = staked;
                        resolve();
                    })
            )
        );

        // tall up votes
        for (var voter in voteResult) {
            var vr = voteResult[voter];
            if (vr.vote) {
                voteResult_for += vr.staked;
            } else {
                voteResult_against += vr.staked;
            }
        }

        return {
            title: prop.data.title,
            for: voteResult_for,
            against: voteResult_against,
            approval: voteResult_for / Math.max(voteResult_for + voteResult_against, 1),
            voters: [] //Object.values(voteResult).sort((v1, v2) => v2.staked - v1.staked)
        }*/
    },
    async PushNewProposal(post) {
        if (post.title.length > 1024) {
            throw ("Title is too long, over limit by " + (1024 - post.title.length) + " characters");
        }

        if (post.content.length > 30000) {
            throw ("Post is too long, over limit by " + (30000 - post.content.length) + " characters");
        }

        function generateName(identity, content) {
            var hash = sha256(identity + content);
            var name = "";
            for (var i = 0; i < 12; i++) {
              var cc = hash.charCodeAt(i);
              if (cc >= 48 && cc <= 57) name += String.fromCharCode(122 - (cc - 48));
              else name += String.fromCharCode(cc);
            }
            return name;
          }

        const identity = await GetIdentity();

        var proposal = {
            proposer: identity.account,
            proposal_name: generateName(identity.account, post.content),
            title: post.title,
            proposal_json: JSON.stringify({
                type: post.type,
                content: post.content,
                options: post.options
                //src: "novusphere-forum"
            }),
            expires_at: new Date(post.expires_at).getTime() / 1000
        };

        var txid;
        try {
            txid = await ExecuteEOSActions({
                contract: REFERENDUM_CONTRACT,
                name: "propose",
                data: proposal
            });
        } catch (ex) {
            console.log(ex);
            throw ("Error: Failed to submit proposal!");
        }

        const novusphere = GetNovusphere();
        await novusphere.waitTx(txid, 500, 1000, REFERENDUM_COLLECTION);

        return txid;
    },
    async CleanProposal(txid) {
        const prop = await this.GetProposal(txid);

        var action = {
            contract: REFERENDUM_CONTRACT,
            name: "clnproposal",
            data: {
                proposal_name: prop.data.proposal_name,
                max_count: 0xffffffff
            }
        }

        var cln_txid = await ExecuteEOSActions(action);
        return cln_txid;
    },
    async Expire(txid) {
        const prop = await this.GetProposal(txid);

        var action = {
            contract: REFERENDUM_CONTRACT,
            name: "expire",
            data: {
                proposal_name: prop.data.proposal_name
            }
        }

        var exp_txid = await ExecuteEOSActions(action);

        const novusphere = GetNovusphere();
        await novusphere.waitTx(exp_txid, 500, 1000, REFERENDUM_COLLECTION);
    },
    async Vote(txid, vote) {
        const identity = await GetIdentity();
        const prop = await this.GetProposal(txid);

        var action = {
            contract: REFERENDUM_CONTRACT,
            name: "vote",
            data: {
                voter: identity.account,
                proposal_name: prop.data.proposal_name,
                vote: vote,
                vote_json: "", //JSON.stringify({ src: "novusphere-forum" })
            }
        }

        var vote_txid = await ExecuteEOSActions(action);

        //const novusphere = GetNovusphere();
        //await novusphere.waitTx(vote_txid, 500, 1000, REFERENDUM_COLLECTION);

        return vote_txid;
    }
}