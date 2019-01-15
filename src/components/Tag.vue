<template>
  <layout :load="load">
    <template slot="topic">
      <span>#{{ tag }}</span>
    </template>

    <template slot="content">
      <div class="mb-1">
        <div class="float-left">
          <post-sorter ref="sorter" :change="load"></post-sorter>
        </div>
        <div class="float-right">
          <pager :pages="pages" :current_page="current_page"></pager>
        </div>
        <div class="clearfix"></div>
      </div>

      <div v-if="!loading">
        <div v-if="posts.length == 0">
          <div class="text-center">
            <h1>No posts with #{{ tag }} found!</h1>
          </div>
        </div>

        <post v-for="p in posts" :key="p.o_id" :post="p"></post>
      </div>
      <div class="text-center" v-else>
        <h1><font-awesome-icon :icon="['fas', 'spinner']" spin></font-awesome-icon></h1>
      </div>
    </template>

    <template slot="right_sidebar">
      <div class="sidebarblock">
        <recently-visited></recently-visited>
      </div>
    </template>

  </layout>
</template>

<script>
import ui from "@/ui";

import Pager from "@/components/core/Pager";
import Post from "@/components/core/Post";
import PostSorter from "@/components/core/PostSorter";
import RecentlyVisited from "@/components/core/RecentlyVisited";

import Layout from "@/components/section/Layout";

export default {
  name: "Tag",
  components: {
    Pager,
    Post,
    PostSorter,
    RecentlyVisited,
    Layout
  },
  watch: {
    "$route.query.page": function() {
      this.load();
    },
  },
  async mounted() {
    this.load();
  },
  methods: {
    async load() {
      this.loading = true;
      this.tag = this.$route.params.tag;

      var tag = await ui.views.Tag(this.$route.query.page, this.tag, this.$refs.sorter.getSorter());

      // push data to this
      this.posts = tag.posts;
      this.pages = tag.pages;
      this.current_page = tag.current_page;
      this.tag = tag.tag;
      this.loading = false;
    },
  },
  data() {
    return {
      loading: false,
      current_page: 0,
      pages: 0,
      tag: "",
      posts: [] // for posts being displayed
    };
  }
};
</script>
