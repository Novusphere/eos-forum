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
                                <button type="button" class="btn btn-sm btn-outline-info" v-on:click="proposalStatus(p.transaction)">status</button>
                                <button type="button" class="btn btn-sm btn-outline-success" v-on:click="castVote(p.transaction, 1)">vote for</button>
                                <button type="button" class="btn btn-sm btn-outline-danger" v-on:click="castVote(p.transaction, 0)">vote against</button>
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
                <span :class="vote.approval >= 0.5 ? 'text-success' : 'text-danger'">{{ (vote.approval * 100).toFixed(2) }}%</span>
                with 
                <span class="text-success">{{ vote.for.toFixed(4) }} EOS</span> 
                for and 
                <span class="text-danger">{{ vote.against.toFixed(4) }} EOS</span> 
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
                    <form>
                    <div class="form-group row">
                        <label class="col-sm-2 col-form-label">End at block height</label>
                        <div class="col-sm-10">
                        <input type="text" class="form-control" placeholder="optional" v-model="proposal.end">
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-2 col-form-label">Title</label>
                        <div class="col-sm-10">
                        <input type="text" class="form-control" placeholder="Title" v-model="proposal.title">
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-2 col-form-label">Proposal</label>
                        <div class="col-sm-10">
                        <textarea rows="10" class="form-control" placeholder="Proposal" v-model="proposal.content"></textarea>
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-2 col-form-label"></label>
                        <div class="col-sm-10">
                        {{ proposal.content.length }} / {{ 30000 }}
                        </div>
                    </div>
                    </form>
                    <div class="row">
                    <div class="col-md-12">
                        <div class="text-center">
                        <span style="font-weight: bold">{{proposal.status}}</span>
                        </div>
                    </div>
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
import { GetNovusphere } from "../novusphere";
import { MigratePost, ApplyPostEdit, TransformPropose } from "../migrations";
import { GetEOS, ScatterConfig, ScatterEosOptions, GetScatterIdentity } from "../eos";
import { MarkdownParser } from "../markdown";

import Post from "./Post.vue";
import SubmitPostModal from "./SubmitPostModal.vue";
import HeaderSection from "./HeaderSection";
import MainSection from "./MainSection";

import sha256 from "sha256";

const MAX_ITEMS_PER_PAGE = 25;

export default {
  name: "Referendum",
  components: {
    Post: Post,
    SubmitPostModal: SubmitPostModal,
    HeaderSection: HeaderSection,
    MainSection: MainSection
  },
  async mounted() {
    window.sha256 = sha256;
    await this.load();
  },
  methods: {
    async load() {
      var currentPage = parseInt(
        this.$route.query.page ? this.$route.query.page : 1
      );
      var novusphere = GetNovusphere();

      var apiResult;

      var MATCH_QUERY = {
        name: "propose"
      };

      apiResult = await novusphere.api({
        count: novusphere.config.collection,
        maxTimeMS: 1000,
        query: MATCH_QUERY
      });

      var numPages = Math.ceil(apiResult.n / MAX_ITEMS_PER_PAGE);

      apiResult = await novusphere.api({
        aggregate: novusphere.config.collection,
        maxTimeMS: 1000,
        cursor: {},
        pipeline: [
          {
            $match: MATCH_QUERY
          },
          {
            $sort: {
              createdAt: -1
            }
          },
          {
            $skip: (currentPage - 1) * MAX_ITEMS_PER_PAGE
          },
          {
            $limit: MAX_ITEMS_PER_PAGE
          }
        ]
      });

      var payload = apiResult.cursor.firstBatch;

      for (var i = 0; i < payload.length; i++) {
        var post = payload[i];
      }

      // push data to this
      this.posts = payload;
      this.pages = numPages;
      this.currentPage = currentPage;
    },
    async submitProposal() {
      var novusphere = GetNovusphere();

      this.proposal.status = "Getting Scatter identity...";
      var eosAccount, eosAuth;

      try {
        var identity = await GetScatterIdentity();
        eosAccount = identity.account;
        eosAuth = identity.auth;
      } 
      catch (ex) {
        this.proposal.status += " Failed!";
        console.log(ex);
        return;
      }

      this.proposal.status = 'Creating tx and broadcasting to EOS...';

      var eostx;
      try {
        var eos = GetEOS();

        var proposal_json = JSON.stringify({
            content: this.proposal.content,
            ends_at_block_height: parseInt(this.proposal.end)
        });

        var proposal_name = this.generateName(this.proposal.title, proposal_json);

        var eosprop = {
            proposer: eosAccount,
            proposal_name: proposal_name,
            title: this.proposal.title,
            proposal_json: proposal_json
        };
        var eosforum = await eos.contract("eosforumdapp");
        eostx = await eosforum.transaction(tx => {
            tx.propose(eosprop, {
            authorization: [
                {
                actor: eosAccount,
                permission: eosAuth
                }
            ]
            });
        });
      }
      catch (ex) {
        this.proposal.status += " Failed!";
        console.log(ex);
        return;
      }

      // wait for tx, then reload
      this.proposal.status = 'Waiting for Novusphere to index...';
      await novusphere.waitTx(eostx.transaction_id, 500, 1000);
      jQuery('#submitProposal').modal('hide');
      this.proposal.status = '';
      await this.load();
    },
    md(text) {
      var md = new MarkdownParser(text);
      return md.html;
    },
    generateName(title, json) {
      var hash = sha256(title + json);
      var name = "";
      for (var i = 0; i < 12; i++) {
        var cc = hash.charCodeAt(i);
        if (cc >= 48 && cc <= 57) name += String.fromCharCode(122 - (cc - 48));
        else name += String.fromCharCode(cc);
      }
      return name;
    },
    async getProposal(txid) {
      var novusphere = GetNovusphere();
      var prop = (await novusphere.api({
        find: novusphere.config.collection,
        maxTimeMS: 1000,
        filter: {
          name: "propose",
          transaction: txid
        }
      })).cursor.firstBatch[0];

      return prop;
    },
    getPropHash(prop) {
      return sha256(prop.data.title + prop.data._proposal_json);
    },
    async getProposalVotes(prop) {
      var novusphere = GetNovusphere();
      var prop_hash = this.getPropHash(prop);

      var votes = (await novusphere.api({
        find: novusphere.config.collection,
        maxTimeMS: 1000,
        filter: {
          name: "vote",
          "data.proposal_hash": prop_hash,
          "data.proposal_name": prop.data.proposal_name,
          createdAt: { $gte: prop.createdAt }
        },
        sort: {
          createdAt: -1
        }
      })).cursor.firstBatch;

      return votes;
    },
    async castVote(propTxid, vote) {
      var novusphere = GetNovusphere();

      var eosAccount, eosAuth;
      try {
        var identity = await GetScatterIdentity();
        eosAccount = identity.account;
        eosAuth = identity.auth;
      }
      catch (ex) {
          console.log(ex);
          alert('Error: Scatter failed to load');
          return;
      }

      var eos = GetEOS();
      var prop = await this.getProposal(propTxid);
      var prop_hash = this.getPropHash(prop);

      var eosvote = {
        voter: eosAccount,
        proposer: prop.data.proposer,
        proposal_name: prop.data.proposal_name,
        proposal_hash: prop_hash,
        vote: vote,
        vote_json: ""
      };
      var eosforum = await eos.contract("eosforumdapp");
      var eostx = await eosforum.transaction(tx => {
        tx.vote(eosvote, {
          authorization: [
            {
              actor: eosAccount,
              permission: eosAuth
            }
          ]
        });
      });

      // show status
      await novusphere.waitTx(eostx.transaction_id, 500, 1000, "eosforum_test");
      await this.proposalStatus(prop.transaction);
    },
    async proposalStatus(txid) {
      var eos = GetEOS();
      var prop = await this.getProposal(txid);
      var votes = await this.getProposalVotes(prop);

      var voteResult = {};
      var voteResult_for = 0;
      var voteResult_against = 0;
      for (var i = 0; i < votes.length; i++) {
        var v = votes[i];
        if (v.data.voter in voteResult) continue;

        var account = await eos.getAccount(v.data.voter);
        var staked = account.voter_info.staked / 10000;

        voteResult[v.data.voter] = {
          txid: v.transaction,
          vote: v.data.vote,
          json: v.data.vote_json,
          staked: staked
        };

        if (v.data.vote) {
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
