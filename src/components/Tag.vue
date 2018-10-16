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
                  <router-link v-if="currentPage>1" class="btn btn-outline-primary" :to="'/tag/' + tag + '?page=' + (currentPage-1)">&larr; prev</router-link>
                  <router-link v-if="currentPage<pages" class="btn btn-outline-primary" :to="'/tag/' + tag + '?page=' + (currentPage+1)">next &rarr;</router-link>
              </div>
            </div>
        </div>
      </div>
    </MainSection>
  </div>
</template>

<script>
import jQuery from "jquery";

import { GetScatter, GetScatterIdentity } from "@/eos";
import { GetNovusphere } from "@/novusphere";
import { forum } from "@/novusphere-forum";
import { MigratePost, ApplyPostEdit } from "@/migrations";
import { storage, SaveStorage } from "@/storage";

import Post from "@/components/core/Post";
import PostSorter from "@/components/core/PostSorter";

import PostHistoryModal from "@/components/modal/PostHistoryModal";

import HeaderSection from "@/components/section/HeaderSection";
import MainSection from "@/components/section/MainSection";

const MAX_ITEMS_PER_PAGE = 25;

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
      var currentPage = parseInt(
        this.$route.query.page ? this.$route.query.page : 1
      );

      var tag = (this.$route.params.tag).toLowerCase();

      var novusphere = GetNovusphere();
      var apiResult;

      apiResult = await novusphere.api({
        count: novusphere.config.collection,
        maxTimeMS: 1000,
        query: forum.match_posts_by_tag(tag)
      });

      var numPages = Math.ceil(apiResult.n / MAX_ITEMS_PER_PAGE);
      const identity = await GetScatterIdentity();

      apiResult = await novusphere.api({
        aggregate: novusphere.config.collection,
        maxTimeMS: 1000,
        cursor: {},
        pipeline: [
          { $match: forum.match_posts_by_tag(tag) },
          { $lookup: forum.lookup_post_state() },
          { $lookup: forum.lookup_post_parent() },
          { $project: forum.project_post({ 
              normalize_up: true, 
              normalize_parent: true,
              score: true 
            }) 
          },
          { $sort: this.$refs.sorter.getSorter() },
          { $skip: forum.skip_page(currentPage, MAX_ITEMS_PER_PAGE) },
          { $limit: MAX_ITEMS_PER_PAGE },
          { $lookup: forum.lookup_post_replies() },
          { $lookup: forum.lookup_post_my_vote(identity.account) },
          { $project: forum.project_post({ 
              normalize_my_vote: true,
              recent_edit: true
            }) 
          },
          { $match: forum.match_valid_parent() }
        ]
      });

      var posts = apiResult.cursor.firstBatch;

      for (var i = 0; i < posts.length; i++) {
        var p = posts[i];
        await MigratePost(p);

        if (p.parent) {
          await MigratePost(p.parent);

          if (p.parent.data.json_metadata) {
            const title = p.parent.data.json_metadata.title;
            p.data.json_metadata.title = title;
          }
        }
      }

      // push data to this
      this.posts = posts;
      this.pages = numPages;
      this.currentPage = currentPage;
      this.tag = tag;
    },
  },
  data() {
    return {
      currentPage: 0,
      pages: 0,
      tag: "",
      posts: [] // for posts being displayed
    };
  }
};
</script>