<template>
  <div>
    
    <layout :load="load">
        <template slot="topic">
          <span>u/{{ account }}</span>
        </template>
        <template slot="content">
          <div class="mb-1">
            <div class="float-left">
              <post-sorter ref="sorter" :change="load"></post-sorter>
            </div>
            <div class="float-left ml-1">
              <button class="btn btn-sm btn-outline-danger" v-on:click="toggleBlock()">{{ is_blocked ? 'unblock' : 'block' }}</button>
            </div>
            <div class="float-right">
              <pager :pages="pages" :current_page="current_page"></pager>
            </div>
            <div class="clearfix"></div>
          </div>

          <div v-if="!loading">
            <div v-if="posts.length == 0">
                  <div class="text-center">
                    <h1>No posts history found!</h1>
                  </div>
            </div>

            <post v-for="p in posts" :key="p.o_id" :post="p"></post>
          </div>          
          <div class="text-center" v-else>
            <h1><font-awesome-icon :icon="['fas', 'spinner']" spin></font-awesome-icon></h1>
          </div>
        </template>
        <template slot="sidebar">
            <div class="sidebarblock">
              <div>
                <h3>{{ account }}</h3>
                <div class="divline"></div>
                <div class="blocktxt">
                  Balances: {{ balances.atmos }} ATMOS
                </div>
                <div class="blocktxt">
                  Comments: {{ comments }}
                </div>
                <div class="blocktxt">
                  Threads: {{ threads }}
                </div>
                <div class="blocktxt">
                  Last Activity: {{ last_activity }}
                </div>
              </div>
            </div>
        </template>
    </layout>

  </div>
</template>

<script>
import ui from "@/ui";

import {
  GetEOS,
  GetIdentity,
  ScatterEosOptions
} from "@/eos";
import { GetNovusphere } from "@/novusphere";
import { storage, SaveStorage } from "@/storage";
import { moderation } from "@/moderation";

import Pager from "@/components/core/Pager";
import Post from "@/components/core/Post";
import PostSorter from "@/components/core/PostSorter";

import Layout from "@/components/section/Layout";

export default {
  name: "UserProfile",
  components: {
    Layout,
    Pager,
    Post,
    PostSorter
  },
  watch: {
    "$route.query.page": function() {
      this.load();
    },
    "$route.params.account": function() {
      this.load();
    }
  },
  async mounted() {
    this.$refs.sorter.by = "time";
    this.load();
  },
  computed: {
  },
  methods: {
    async load() {
      this.loading = true;

      var profile = await ui.views.UserProfile(this.$route.query.page, this.$route.params.account, this.$refs.sorter.getSorter());
      
      this.current_page = profile.current_page;
      this.account = profile.account;
    
      this.is_blocked = profile.is_blocked;
      this.balances.atmos = profile.balance_atmos;
      this.comments = profile.n_comments;
      this.threads = profile.n_threads;
      this.last_activity = profile.last_activity;
      this.posts = profile.posts;
      this.pages = profile.pages;
      this.loading = false;
    },
    async toggleBlock() {
      await ui.actions.BlockUser(this.account, this.is_blocked);
      await this.load();
    }
  },
  data() {
    return {
      loading: false,
      is_blocked: false,
      account: "",
      balances: {
        atmos: 0
      },
      comments: 0,
      threads: 0,
      last_activity: "",
      posts: [],
      current_page: 1,
      pages: 0
    };
  }
};
</script>
