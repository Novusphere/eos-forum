<template>
  <div>
    <HeaderSection :load="load">
      <span class="title mr-3"><router-link :to="'/referendum'">EOS Referendum</router-link></span>
      <button type="button" class="btn btn-outline-primary ml-1" v-on:click="newProposal()">new</button>
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
                        <span v-if="p.expired" class="text-danger">[exp.]</span>
                        <span v-else class="text-warning">[exp. {{ getDeltaDays(new Date(p.data.expires_at)) }} days]</span>
                    </div>
                </span>
                
                <div style="font-size: x-small">
                    <ul class="list-inline">
                    <li class="list-inline-item"><a class="post-collapse" data-toggle="collapse" :href="'#post-' + p.transaction"></a></li>
                    <li class="list-inline-item">{{ new Date(p.createdAt * 1000).toLocaleString() }}</li>
                    <li class="list-inline-item">by <router-link :to="'/u/' + p.data.proposer" :class="(p.data.proposer == identity) ? 'text-mine' : ''">{{ p.data.proposer }}</router-link></li>
                    <li class="list-inline-item"><a :href="'https://eosq.app/tx/' + p.transaction">on chain</a></li>
                    </ul>
                </div>
                <div :id="'post-' + p.transaction" class="post-attachment collapse show">
                    <p class="post-content" v-html="md(p.data.proposal_json.content)">               
                    </p>
                    <div style="font-size: x-small">
                        <ul class="list-inline">
                            <li class="list-inline-item">
                                <button type="button" class="btn btn-sm btn-outline-primary" v-on:click="proposalStatus(p.transaction)">{{ p.expired ? ' results' : 'status' }}</button>
                                <button v-if="!p.expired" type="button" class="btn btn-sm btn-outline-primary" v-on:click="castVote(p.transaction, 1)">vote for</button>
                                <button v-if="!p.expired" type="button" class="btn btn-sm btn-outline-danger" v-on:click="castVote(p.transaction, 0)">vote against</button>
                            </li>
                            <li v-if="p.data.proposer == identity" class="list-inline-item">
                                <button v-if="p.expired" type="button" class="btn btn-sm btn-outline-primary" v-on:click="cleanProposal(p.transaction)">clean</button>
                                <button v-if="!p.expired" type="button" class="btn btn-sm btn-outline-danger" v-on:click="expire(p.transaction)">force expire</button>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>  
        </div>
        <div class="row mb-4">
            <div class="col-12">
              <div class="float-right">
                  <router-link v-if="current_page>1" class="btn btn-outline-primary" :to="'/referendum?page=' + (current_page-1)">&larr; prev</router-link>
                  <router-link v-if="current_page<pages" class="btn btn-outline-primary" :to="'/referendum?page=' + (current_page+1)">next &rarr;</router-link>
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
              <div class="text-center">
                This proposal has an approval rating of
                <span :class="vote.approval >= 0.5 ? 'text-success' : 'text-danger'">{{ (vote.approval * 100).toFixed(2) }}%</span>
                with 
                <span class="text-success">{{ vote.for.toFixed(4) }} EOS</span> 
                for and 
                <span class="text-danger">{{ vote.against.toFixed(4) }} EOS</span> 
                against and a total of 
                <a href="javascript:void(0)" data-toggle="collapse" data-target="#voteResults" class="text-primary">{{ vote.voters.length }} votes</a> 
                casted.
              </div>
              <div id="voteResults" class="collapse">
                <ul>
                  <li v-for="voter in vote.voters" :key="voter.account">
                    <span :class="voter.vote ? 'text-success' : 'text-danger'">
                      {{ voter.account }} - {{ voter.staked.toFixed(4) }} EOS ({{ voter.vote ? 'for' : 'against'}})
                    </span>
                  </li>
                </ul>
              </div>
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
                <div v-if="!post.preview">
                  <form>
                    <div class="form-group row">
                      <label class="col-sm-2 col-form-label">Title</label>
                      <div class="col-sm-10">
                        <input type="text" class="form-control" placeholder="Title" v-model="post.title">
                      </div>
                    </div>
                    <div class="form-group row">
                      <label class="col-sm-2 col-form-label">Expiry</label>
                      <div class="col-sm-8">
                        <input type="text" class="form-control" placeholder="mm-dd-yyyy" v-model="post.expiry">
                      </div>
                      <label class="col-sm-2 col-form-label">({{ expiry_delta }} days from now)</label>
                    </div>
                    <div class="form-group row">
                      <label for="inputContent" class="col-sm-2 col-form-label">Content</label>
                      <div class="col-sm-10">
                        <textarea rows="10" class="form-control" id="inputContent" placeholder="Content" v-model="post.content"></textarea>
                      </div>
                    </div>
                    <div class="form-group row">
                      <label class="col-sm-2 col-form-label"></label>
                      <div class="col-sm-10">
                        {{ post.content.length }} / {{ 30000 }}
                      </div>
                    </div>
                  </form>
                  <div class="row">
                    <div class="col-md-12">
                      <div class="text-center">
                        <span style="font-weight: bold">{{status}}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else>
                    <p v-html="md(post.content)">
                    </p>
                </div>
            </div>
            <div class="modal-footer">
                <div v-if="!post.preview">
                    <button type="button" class="btn btn-outline-primary" v-on:click="submitProposal()">post</button>
                    <button type="button" class="btn btn-outline-primary" v-on:click="post.preview = true">preview</button>
                    <button type="button" class="btn btn-outline-danger" data-dismiss="modal">close</button>
                </div>
                <div v-else>
                    <button type="button" class="btn btn-outline-primary" v-on:click="post.preview = false">back</button>
                </div>
            </div>
            </div>
        </div>
    </div>
  </div>
</template>

<script>
import jQuery from "jquery";
import sha256 from "sha256";

import ui from "@/ui";

import { GetEOS, ScatterEosOptions, GetIdentity } from "@/eos";
import { GetNovusphere } from "@/novusphere";
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
  computed: {
    expiry_delta: function() {
      var expiry = new Date(this.post.expiry);
      if (isNaN(expiry.getTime())) {
        return "?";
      }
      return this.getDeltaDays(expiry);
    }
  },
  methods: {
    getDeltaDays(future) {
      var delta = future.getTime() - new Date().getTime();
      return (delta / (1000 * 60 * 60 * 24)).toFixed(2);
    },
    generateName(identity, content) {
      var hash = sha256(identity + content);
      var name = "";
      for (var i = 0; i < 12; i++) {
        var cc = hash.charCodeAt(i);
        if (cc >= 48 && cc <= 57) name += String.fromCharCode(122 - (cc - 48));
        else name += String.fromCharCode(cc);
      }
      return name;
    },
    async load() {
      const identity = await GetIdentity();
      this.identity = identity.account;

      var referendum = await ui.views.Referendum(this.$route.query.page);

      this.posts = referendum.posts;
      this.pages = referendum.pages;
      this.current_page = referendum.current_page;
    },
    async newProposal() {
      const identity = await GetIdentity();
      if (identity.account) {
        jQuery("#submitProposal").modal();
      } else {
        alert("You must be logged in to create a proposal!");
      }
    },
    async submitProposal() {
      this.status = "Submitting proposal... this may take a moment.";

      try {
        await ui.actions.Referendum.PushNewProposal(this.post);
      } catch (reason) {
        this.status = reason;
        return;
      }

      jQuery("#submitProposal").modal("hide");
      this.status = "";

      await this.load();
    },
    md(text) {
      var md = ui.helpers.ParseMarkdown(text);
      return md.html;
    },
    async cleanProposal(propTxid) {
      await ui.actions.Referendum.CleanProposal(propTxid);
    },
    async expire(propTxid) {
      await ui.actions.Referendum.Expire(propTxid);
      await this.load();
    },
    async castVote(propTxid, vote) {
      await ui.actions.Referendum.Vote(propTxid, vote);
      await this.proposalStatus(propTxid);
    },
    async proposalStatus(txid) {
      var status = await ui.actions.Referendum.Status(txid);

      this.vote.title = status.title;
      this.vote.for = status.for;
      this.vote.against = status.against;
      this.vote.approval = status.approval;
      this.vote.voters = status.voters;

      jQuery("#voteResult").modal();
    }
  },
  data() {
    return {
      current_page: 0,
      pages: 0,
      posts: [],
      identity: "",
      vote: {
        title: "",
        for: 0,
        against: 0,
        approval: 0,
        voters: []
      },
      status: "", // of post
      post: {
        preview: false,
        expiry: "",
        title: "",
        content: ""
      }
    };
  }
};
</script>
