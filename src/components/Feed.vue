<template>
  <layout ref="layout" :load="load">

    <template slot="topic">>
      <span>Feed</span>
    </template>

    <template slot="content">
      <div class="mt-1 mb-3">
        <div class="ml-1 float-left">
        </div>
        <div class="float-right">
          <pager :pages="pages"
            :current_page="current_page">
          </pager>
        </div>
        <div class="clearfix"></div>
      </div>

      <div class="post-container" v-if="!loading">
        <div v-if="posts.length == 0">
          <div class="text-center">
            <h1>There doesn't seem to be any posts here! Why not follow some users?</h1>
          </div>
        </div>

        <post
          v-for="p in posts"
          class="post-parent"
          :class="{'hide-preview': $root.showPreview === false}"
          :key="p.transaction"
          @openPost="$_openPost"
          :post="p"
          :showChildren="false"
          :showAsFeed="p.data.reply_to_poster != ''"
        />
        <modal
          @click.native.stop="$_closePost"
          v-if="selectedPostID">
          <thread-modal
            @close="$_closePost"
            :id="selectedPostID"
          />
        </modal>
      </div>
      <div class="text-center" v-else>
        <h1><font-awesome-icon :icon="['fas', 'spinner']" spin></font-awesome-icon></h1>
      </div>
      <div v-if="!loading" class="float-right mb-3">
        <pager :pages="pages"
          :current_page="current_page">
        </pager>
      </div>
    </template>

  </layout>
</template>

<script>
import ui from "@/ui";

import { GetEOS, GetIdentity, ScatterEosOptions } from "@/eos";
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
  name: "Feed",
  components: {
    Layout,
    Pager,
    Post,
    PostSorter,
    Modal,
    ThreadModal
  },
  watch: {
    "$route.query.page": function() {
      this.load();
    }
  },
  async mounted() {
    this.load();
  },
  computed: {},
  methods: {
    async load() {
      this.loading = true;
      this.posts = [];
      this.pages = 0;
      this.selectedPostID = undefined;
      window.scrollTo(0,0);

      var feed = await ui.views.Feed(this.$route.query.page);

      this.posts = feed.posts;
      this.pages = feed.pages;
      this.current_page = feed.current_page;
      this.loading = false;
    },
  },
  data() {
    return {
      loading: false,
      current_page: 0,
      pages: 0,
      posts: [], // for posts being displayed
      selectedPostID: undefined
    };
  }
};
</script>
