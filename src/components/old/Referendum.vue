<template>
  <div>
    
    <layout ref="layout" :load="load">
        <template slot="topic">
          <span v-if="sub">e/{{sub}}</span>
          <span v-else>Home</span>
        </template>
        <template slot="content">
          <div class="mb-1">
            <div class="float-left">
              <router-link :to="{ name: 'StartThread', params: { sub: sub ? sub : 'all' } }" class="btn btn-sm btn-outline-success">
                new
              </router-link>
            </div>
            <div class="ml-1 float-left"> 
              <post-sorter ref="sorter" :change="load" :default_by="'active'" :options="['active', 'old']"></post-sorter>
            </div>
            <div class="float-right">
              <pager :pages="pages" :current_page="current_page"></pager>
            </div>
            <div class="clearfix"></div>
          </div>

            <div v-if="posts.length == 0">
                  <div class="text-center">
                    <h1>There doesn't seem to be any proposals here! Why not make one?</h1>
                  </div>
            </div>

            <post v-for="p in posts" :key="p.transaction" :post="p"></post>
      
        </template>
        <template slot="sidebar">
            <div class="sidebarblock">
                <recently-visited></recently-visited>
            </div>
        </template>
    </layout>

  </div>
</template>

<script>
import sha256 from "sha256";

import ui from "@/ui";

import { GetEOS, ScatterEosOptions, GetIdentity } from "@/eos";
import { GetNovusphere } from "@/novusphere";
import { MarkdownParser } from "@/markdown";

import Pager from "@/components/core/Pager";
import PostSorter from "@/components/core/PostSorter";
import Post from "@/components/core/Post";

import Layout from "@/components/section/Layout";

export default {
  name: "Referendum",
  components: {
    Pager,
    Post,
    PostSorter,
    Layout
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
