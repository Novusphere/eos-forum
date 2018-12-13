<template>
  <div>
    
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

          <div v-if="posts.length == 0">
                <div class="text-center">
                  <h1>No posts with #{{ tag }} found!</h1>
                </div>
          </div>

          <post v-for="p in posts" :key="p.o_id" 
            :post="p"></post>
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
import jQuery from "jquery";

import ui from "@/ui";

import Pager from "@/components/core/Pager";
import Post from "@/components/core/Post";
import PostSorter from "@/components/core/PostSorter";

import Layout from "@/components/section/Layout";

export default {
  name: "Tag",
  components: {
    Pager,
    Post,
    PostSorter,
    Layout
  },
  watch: {
    "$route.query.page": function() {
      this.load();
    },
    "$route.params.tag": function() {
      this.load();
    }
  },
  async mounted() {
    this.load();
  },
  methods: {
    async load() {
      var tag = await ui.views.Tag(this.$route.query.page, this.$route.params.tag, this.$refs.sorter.getSorter());

      // push data to this
      this.posts = tag.posts;
      this.pages = tag.pages;
      this.current_page = tag.current_page;
      this.tag = tag.tag;
    },
  },
  data() {
    return {
      current_page: 0,
      pages: 0,
      tag: "",
      posts: [] // for posts being displayed
    };
  }
};
</script>