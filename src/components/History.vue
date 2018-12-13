<template>
  <div>
    
    <layout>
        <template slot="topic">
          <span>History</span>
        </template>
        <template slot="content">
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
  name: "History",
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
  },
  async mounted() {
    this.load();
  },
  methods: {
    async load() {
      var history = await ui.views.PostHistory(this.$route.params.id);
      this.main_post = history.main_post;
      this.opening_post = history.main_post;
    },
  },
  data() {
    return {
      opening_post: ui.helpers.PlaceholderPost(),
      main_post: ui.helpers.PlaceholderPost()
    };
  }
};
</script>
