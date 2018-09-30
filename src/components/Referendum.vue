<template>
  <div>
    <HeaderSection>
      <span class="title mr-3"><router-link :to="'/referendum'">EOS Referendum</router-link></span>
      <button type="button" class="btn btn-outline-secondary ml-1" data-toggle="modal" data-target="#submitProposal">new</button>
    </HeaderSection>
    <MainSection>
      <div>
        <div v-if="posts.length == 0">
              <div class="text-center">
                <h1>There doesn't seem to be any posts here! Why not make one?</h1>
              </div>
        </div>
        <div class="row mb-2" v-for="p in posts" :key="p.transaction">
            <div :class="'col-md-12 mb-3 post'">
                <span style="font-weight: bold; font-size: 20px">
                    <div>
                        <span class="title">{{ p.data.title }}</span>
                        <span v-if="p.expired" class="text-danger">[expired]</span>
                    </div>
                </span>
                
                <div style="font-size: x-small">
                    <ul class="list-inline">
                    <li class="list-inline-item"><a class="post-collapse" data-toggle="collapse" :href="'#post-' + p.transaction"></a></li>
                    <li class="list-inline-item">{{ new Date(p.createdAt * 1000).toLocaleString() }}</li>
                    <li class="list-inline-item">by <a :href="'https://bloks.io/account/' + p.data.proposer">{{ p.data.proposer }}</a></li>
                    <li class="list-inline-item"><a :href="'https://bloks.io/transaction/' + p.transaction">on chain</a></li>
                    </ul>
                </div>
                <div :id="'post-' + p.transaction" class="post-attachment collapse show">
                    <p class="post-content" v-html="md(p.data.proposal_json.content)">               
                    </p>
                    <div style="font-size: x-small">
                        <ul class="list-inline">
                            <li class="list-inline-item">
                                <button type="button" class="btn btn-sm btn-outline-primary" v-on:click="proposalStatus(p.transaction)">{{ p.expired ? ' results' : 'status' }}</button>
                                <button v-if="!p.expired" type="button" class="btn btn-sm btn-outline-secondary" v-on:click="castVote(p.transaction, 1)">vote for</button>
                                <button v-if="!p.expired" type="button" class="btn btn-sm btn-outline-danger" v-on:click="castVote(p.transaction, 0)">vote against</button>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>  
        </div>
        <div class="row mb-4">
            <div class="col-12">
              <div class="float-right">
                  <router-link v-if="currentPage>1" class="btn btn-outline-primary" :to="'/referendum?page=' + (currentPage-1)">&larr; prev</router-link>
                  <router-link v-if="currentPage<pages" class="btn btn-outline-primary" :to="'/referendum?page=' + (currentPage+1)">next &rarr;</router-link>
              </div>
            </div>
        </div>
      </div>
    </MainSection>

    <div id="voteResult" class="modal fade" tabindex="-1" role="dialog">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">{{ vote.title }}</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                This proposal has an approval rating of
                <span :class="vote.approval >= 0.5 ? 'text-highlight' : 'text-alert'">{{ (vote.approval * 100).toFixed(2) }}%</span>
                with 
                <span class="text-highlight">{{ vote.for.toFixed(4) }} EOS</span> 
                for and 
                <span class="text-alert">{{ vote.against.toFixed(4) }} EOS</span> 
                against and a total of 
                <span class="text-info">{{ vote.votes }} votes</span> 
                casted.
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-outline-danger" data-dismiss="modal">close</button>
            </div>
            </div>
        </div>
    </div>

    <div id="submitProposal" class="modal fade" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-full" role="document">
            <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Create Proposal</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <div v-if="!proposal.preview">
                    <div class="text-center">
                      <h1>Creating proposals have been disabled until eosio.forum is officially deployed.</h1>
                    </div>
                </div>
                <div v-else>
                    <p v-html="md(proposal.content)">
                    </p>
                </div>
            </div>
            <div class="modal-footer">
                <div v-if="!proposal.preview">
                    <button type="button" class="btn btn-outline-primary" v-on:click="submitProposal()">post</button>
                    <button type="button" class="btn btn-outline-secondary" v-on:click="proposal.preview = true">preview</button>
                    <button type="button" class="btn btn-outline-danger" data-dismiss="modal">close</button>
                </div>
                <div v-else>
                    <button type="button" class="btn btn-outline-primary" v-on:click="proposal.preview = false">back</button>
                </div>
            </div>
            </div>
        </div>
    </div>
  </div>
</template>

<script>
import jQuery from "jquery";

import {
  GetEOS,
  GetScatter,
  ScatterConfig,
  ScatterEosOptions,
  GetScatterIdentity
} from "@/eos";
import { GetNovusphere } from "@/novusphere";
import { forum } from "@/novusphere-forum";
import { MarkdownParser } from "@/markdown";

import Post from "@/components/core/Post";

import HeaderSection from "@/components/section/HeaderSection";
import MainSection from "@/components/section/MainSection";

const MAX_ITEMS_PER_PAGE = 25;
const REFERENDUM_CONTRACT = "eosforumrcpp";
const REFERENDUM_COLLECTION = "_eosforum";

export default {
  name: "Referendum",
  components: {
    Post: Post,
    HeaderSection: HeaderSection,
    MainSection: MainSection
  },
  async mounted() {
    await this.load();
  },
  methods: {
    async load() {
      var currentPage = parseInt(
        this.$route.query.page ? this.$route.query.page : 1
      );

      const novusphere = GetNovusphere();

      var MATCH_QUERY = {
        name: "propose"
      };

      var apiResult = await novusphere.api({
        count: REFERENDUM_COLLECTION,
        maxTimeMS: 1000,
        query: MATCH_QUERY
      });

      var numPages = Math.ceil(apiResult.n / MAX_ITEMS_PER_PAGE);

      apiResult = await novusphere.api({
        aggregate: REFERENDUM_COLLECTION,
        maxTimeMS: 1000,
        cursor: {},
        pipeline: [
          { $match: MATCH_QUERY },
          { $sort: forum.sort_by_time() },
          { $skip: forum.skip_page(currentPage, MAX_ITEMS_PER_PAGE) },
          { $limit: MAX_ITEMS_PER_PAGE }
        ]
      });

      // mark expired proposals
      const unixNow = new Date();
      var payload = apiResult.cursor.firstBatch;
      for (var i = 0; i < payload.length; i++) {
        var p = payload[i];
        if (unixNow > new Date(p.data.expires_at)) {
          p.expired = true;
        }
      }

      // push data to this
      this.posts = payload;
      this.pages = numPages;
      this.currentPage = currentPage;
    },
    async submitProposal() {
      return;
    },
    md(text) {
      var md = new MarkdownParser(text);
      return md.html;
    },
    async getProposal(txid) {
      const novusphere = GetNovusphere();
      var prop = (await novusphere.api({
        find: REFERENDUM_COLLECTION,
        maxTimeMS: 1000,
        filter: {
          name: "propose",
          transaction: txid
        }
      })).cursor.firstBatch[0];

      return prop;
    },
    async getProposalVotes(prop) {
      var novusphere = GetNovusphere();

      var votes = (await novusphere.api({
        find: REFERENDUM_COLLECTION,
        maxTimeMS: 1000,
        filter: {
          name: "vote",
          "data.proposal_name": prop.data.proposal_name,
          createdAt: { $gte: prop.createdAt }
        },
        sort: forum.sort_by_time()
      })).cursor.firstBatch;

      var unvotes = (await novusphere.api({
        find: REFERENDUM_COLLECTION,
        maxTimeMS: 1000,
        filter: {
          name: "unvote",
          "data.proposal_name": prop.data.proposal_name,
          createdAt: { $gte: prop.createdAt }
        },
        sort: forum.sort_by_time()
      })).cursor.firstBatch;

      return { votes: votes, unvotes: unvotes };
    },
    async castVote(propTxid, vote) {
      const novusphere = GetNovusphere();
      const identity = await GetScatterIdentity();

      if (!identity.account) {
        alert("You must be logged in to vote!");
        return;
      }

      const eos = GetEOS(await GetScatter());
      const prop = await this.getProposal(propTxid);

      // NOTE & TO-DO: "vote" is changing to "vote_value"
      var eostxArg = {
        voter: identity.account,
        proposal_name: prop.data.proposal_name,
        vote: vote,
        vote_json: ""
      };
      var eosforum = await eos.contract(REFERENDUM_CONTRACT);
      var eostx = await eosforum.transaction(tx => {
        tx.vote(eostxArg, {
          authorization: [
            {
              actor: identity.account,
              permission: identity.auth
            }
          ]
        });
      });

      // show status
      await novusphere.waitTx(
        eostx.transaction_id,
        500,
        1000,
        REFERENDUM_COLLECTION
      );
      await this.proposalStatus(prop.transaction);
    },
    async proposalStatus(txid) {
      var eos = GetEOS(await GetScatter());
      var prop = await this.getProposal(txid);
      var pv = await this.getProposalVotes(prop);

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
        if (vr.time < uv.createdAt) {
          delete voteResult[uv.data.voter];
        }
      }

      // pull stake data from bp api
      for (var voter in voteResult) {
        var account = await eos.getAccount(voter);
        var staked = account.voter_info.staked / 10000;
        var vr = voteResult[voter];

        vr.staked = staked;
        if (vr.vote) {
          voteResult_for += staked;
        } else {
          voteResult_against += staked;
        }
      }

      this.vote.title = prop.data.title;
      this.vote.for = voteResult_for;
      this.vote.against = voteResult_against;
      this.vote.approval =
        voteResult_for / Math.max(voteResult_for + voteResult_against, 1);
      this.vote.votes = Object.keys(voteResult).length;

      jQuery("#voteResult").modal();
    }
  },
  data() {
    return {
      currentPage: 0,
      pages: 0,
      posts: [],
      vote: {
        title: "",
        for: 0,
        against: 0,
        votes: 0,
        approval: 0
      },
      proposal: {
        status: "",
        preview: false,
        title: "",
        content: "",
        end: 0
      }
    };
  }
};
</script>
