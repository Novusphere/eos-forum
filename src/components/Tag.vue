<template>
  <div>
    <PostHistoryModal ref="history_modal"></PostHistoryModal>
    <HeaderSection :load="load">
      <span class="title mr-3"><router-link :to="'/tag/' + tag">#{{ tag }}</router-link></span>
      <PostSorter ref="sorter" :change="load"></PostSorter>
    </HeaderSection>
    <MainSection>
      <div>
        <div v-if="posts.length == 0">
          <div class="text-center">
            <h1>No posts with #{{ tag }} found!</h1>
          </div>
        </div>

          <Post 
            v-for="p in posts" 
            :key="p.o_id" 
            :history_modal="$refs.history_modal" 
            :post="p" 
            :show_content="true">
          </Post>

        <div class="row mb-4">
            <div class="col-12">
              <div class="float-right">
                  <router-link v-if="current_page>1" class="btn btn-outline-primary" :to="'/tag/' + tag + '?page=' + (current_page-1)">&larr; prev</router-link>
                  <router-link v-if="current_page<pages" class="btn btn-outline-primary" :to="'/tag/' + tag + '?page=' + (current_page+1)">next &rarr;</router-link>
              </div>
            </div>
        </div>
      </div>
    </MainSection>
  </div>
</template>

<script>
import jQuery from "jquery";

import ui from "@/ui";

import Post from "@/components/core/Post";
import PostSorter from "@/components/core/PostSorter";

import PostHistoryModal from "@/components/modal/PostHistoryModal";

import HeaderSection from "@/components/section/HeaderSection";
import MainSection from "@/components/section/MainSection";

export default {
  name: "Tag",
  components: {
    Post: Post,
    PostSorter: PostSorter,
    PostHistoryModal: PostHistoryModal,
    HeaderSection: HeaderSection,
    MainSection: MainSection
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