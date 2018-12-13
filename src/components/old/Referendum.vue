<template>
  <div>
    <HeaderSection :load="load">
      <span class="title mr-3"><router-link :to="'/referendum'">eos-referendum</router-link></span>
      <button type="button" class="btn btn-sm btn-outline-primary ml-1" v-on:click="newProposal()">new</button>
      <PostSorter ref="sorter" :change="load" :default_by="'active'" :options="['active', 'cleaned']"></PostSorter>
    </HeaderSection>
    <MainSection>
      <div>
        <div v-if="posts.length == 0">
              <div class="text-center">
                <h1>There doesn't seem to be any posts here! Why not make one?</h1>
              </div>
        </div>
        <Post 
            v-for="p in posts" 
            :key="p.o_id" 
            :history_modal="null" 
            :post="p" 
            :show_content="true">
        </Post>
        <div class="row mb-4">
            <div class="col-12">
              <div class="float-right">
                  <Pager :pages="pages" :current_page="current_page"></Pager>
              </div>
            </div>
        </div>
      </div>
    </MainSection>

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

import Pager from "@/components/core/Pager";
import PostSorter from "@/components/core/PostSorter";
import Post from "@/components/core/Post";

import HeaderSection from "@/components/section/HeaderSection";
import MainSection from "@/components/section/MainSection";


const MAX_ITEMS_PER_PAGE = 25;
const REFERENDUM_CONTRACT = "eosforumrcpp";
const REFERENDUM_COLLECTION = "eosforum";

export default {
  name: "Referendum",
  components: {
    Pager: Pager,
    Post: Post,
    PostSorter: PostSorter,
    HeaderSection: HeaderSection,
    MainSection: MainSection
  },
  watch: {
    "$route.query.page": function() {
      this.load();
    }
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

      var referendum = await ui.views.Referendum(this.$route.query.page, this.$refs.sorter.by);

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
        voters: 0
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
