<template>
  <div>
    
    <layout :load="load">
        <template slot="topic">
          <span>Thread</span>
        </template>
        <template slot="content">
          <div class="mb-1">
            <router-link class="btn btm-sm btn-outline-primary" :to='{name: "Sub", params: { sub: opening_post.data.json_metadata.sub } }'>
              <font-awesome-icon :icon="['fas', 'arrow-left']" ></font-awesome-icon>
              e/{{ opening_post.data.json_metadata.sub }}
            </router-link>
          </div>
          <post :post="main_post" :thread="opening_post"></post>
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
import ui from "@/ui";
import { GetNovusphere } from "@/novusphere";

import Pager from "@/components/core/Pager";
import PostSorter from "@/components/core/PostSorter";
import Post from "@/components/core/Post";
import RecentlyVisited from "@/components/core/RecentlyVisited";

import Layout from "@/components/section/Layout";

export default {
  name: "Thread",
  metaInfo() {
    const title = this.main_post.data.json_metadata.title;
    return {
      titleTemplate: `%s | ${title}`
    };
  },
  components: {
    Pager,
    PostSorter,
    RecentlyVisited,
    Post,
    Layout
  },
  watch: {
    "$route.params.id": function() {
      this.load();
    },
    "$route.params.child_id": function() {
      this.load();
    }
  },
  async mounted() {
    this.load();
  },
  methods: {
    async load() {
      var thread = await ui.views.Thread(
        this.$route.params.id,
        this.$route.params.child_id
      );
      this.opening_post = thread.opening_post;
      this.main_post = thread.main_post;
    },
    postContent(txid, data) {
      this.load(); // reload thread
    }
  },
  data() {
    return {
      opening_post: ui.helpers.PlaceholderPost(),
      main_post: ui.helpers.PlaceholderPost()
    };
  }
};
</script>
