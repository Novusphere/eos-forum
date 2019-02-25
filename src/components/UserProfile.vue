<template>

  <layout :load="load">
    <template slot="topic">
      <span>u/{{ account }}</span>
    </template>

    <template slot="content">
        <b-tabs>
        <b-tab title="comments" active>
          <div class="mt-2 mb-2">
            <div class="float-left">
              <post-sorter ref="sorter" :change="load"></post-sorter>
            </div>
            <div class="float-left ml-1">
              <b-button class="btn btn-danger" v-on:click="toggleBlock()">{{ is_blocked ? 'unblock' : 'block' }}</b-button>
            </div>
            <div class="float-right">
              <pager :pages="pages" :current_page="current_page"></pager>
            </div>
            <div class="clearfix"></div>
          </div>
          
          <div class="post-container" v-if="!loading">
            <div v-if="posts.length == 0">
              <div class="text-center">
                <h1>There doesn't seem to be any posts here! Why not make one?</h1>
              </div>
            </div>

            <post
              v-for="p in posts"
              class="post-parent"
              :key="p.o_id"
              @openPost="$_openPost"
              :post="p"
            />
            <modal
              @click.native="$_closePost"
              v-if="selectedPostID">
              <thread-modal
                @click.native.stop
                :id="selectedPostID"
              />
            </modal>
          </div>
          <div class="text-center" v-else>
            <h1><font-awesome-icon :icon="['fas', 'spinner']" spin></font-awesome-icon></h1>
          </div>
        </b-tab>
        <b-tab title="threads" >
          Threads...
        </b-tab>
        <b-tab title="blogs">
          Blogs...
        </b-tab>
      </b-tabs>
    </template>

    <template slot="right_sidebar">
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
import Modal from "@/components/modal/Modal.vue";
import ThreadModal from "@/components/ThreadModal.vue";

export default {
  name: "UserProfile",
  components: {
    Layout,
    Pager,
    Post,
    PostSorter,
    Modal,
    ThreadModal,
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
    },
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
      pages: 0,
      selectedPostID: undefined,
    };
  }
};
</script>
