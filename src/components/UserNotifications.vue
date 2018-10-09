<template>
    <div>
        <PostHistoryModal ref="history_modal"></PostHistoryModal>
        <HeaderSection :load="load">
            <span class="title mr-3">notifications</span>
        </HeaderSection>
        <MainSection>
        <div>
            <div class="row mb-2" v-for="p in posts" :key="p.o_id">
              <Post :history_modal="$refs.history_modal" :post="p" :show_content="true"></Post>
            </div>
            <div class="row mb-4">
                <div class="col-12">
                  <div class="float-right">
                      <router-link v-if="currentPage>1" class="btn btn-outline-primary" :to="'/u/' + account + '?page=' + (currentPage-1)">&larr; prev</router-link>
                      <router-link v-if="currentPage<pages" class="btn btn-outline-primary" :to="'/u/' + account + '?page=' + (currentPage+1)">next &rarr;</router-link>
                  </div>
                </div>
            </div>
        </div>
        </MainSection>
    </div>
</template>

<script>
import {
  GetEOS,
  GetScatter,
  GetScatterIdentity,
  ScatterConfig,
  ScatterEosOptions
} from "@/eos";
import { GetNovusphere } from "@/novusphere";
import { forum } from "@/novusphere-forum";
import { storage, SaveStorage } from "@/storage";
import { moderation } from "@/moderation";
import { MigratePost, ApplyPostEdit } from "@/migrations";

import Post from "@/components/core/Post";
import PostSorter from "@/components/core/PostSorter";

import PostHistoryModal from "@/components/modal/PostHistoryModal";

import HeaderSection from "@/components/section/HeaderSection";
import MainSection from "@/components/section/MainSection";

const MAX_ITEMS_PER_PAGE = 25;

export default {
  name: "UserNotifications",
  components: {
    PostHistoryModal: PostHistoryModal,
    HeaderSection: HeaderSection,
    MainSection: MainSection,
    Post: Post,
    PostSorter: PostSorter
  },
  watch: {
    "$route.query.page": function() {
      this.load();
    },
  },
  async mounted() {
    this.load();
  },
  computed: {
  },
  methods: {
    async load() {
      this.currentPage = parseInt(
        this.$route.query.page ? this.$route.query.page : 1
      );

      const eos = GetEOS();
      const novusphere = GetNovusphere();
      const identity = await GetScatterIdentity();
      if (!identity.account) {
          this.pages = 0;
          this.posts = [];
          return;
      }

      var posts, pages, n_notifications;

      n_notifications = (await novusphere.api({
        count: novusphere.config.collection,
        maxTimeMS: 1000,
        query: forum.match_notifications(identity.account)
      })).n;

      pages = Math.ceil(n_notifications / MAX_ITEMS_PER_PAGE);

      posts = (await novusphere.api({
        aggregate: novusphere.config.collection,
        maxTimeMS: 1000,
        cursor: {},
        pipeline: [
          { $match: forum.match_notifications(identity.account) },
          { $lookup: forum.lookup_post_state() },
          { $lookup: forum.lookup_post_parent() },
          {
            $project: forum.project_post({
              normalize_up: true,
              normalize_parent: true
            })
          },
          { $sort: forum.sort_by_time() },
          { $skip: forum.skip_page(this.currentPage, MAX_ITEMS_PER_PAGE) },
          { $limit: MAX_ITEMS_PER_PAGE },
          { $lookup: forum.lookup_post_replies() },
          { $lookup: forum.lookup_post_my_vote(identity.account) },
          {
            $project: forum.project_post({
              normalize_my_vote: true,
              recent_edit: true
            })
          },
          { $match: forum.match_valid_parent() }
        ]
      })).cursor.firstBatch;

      for (var i = 0; i < posts.length; i++) {
        var p = posts[i];
        await MigratePost(p);
      }

      // push data to this
      this.posts = posts;
      this.pages = pages;

      await this.markAsRead();
    },
    async markAsRead() {
        var identity = await GetScatterIdentity();
        identity.notifications = 0;

        storage.last_notification = (new Date()).getTime() / 1000;
        SaveStorage();
    }
  },
  data() {
    return {
      posts: [],
      currentPage: 1,
      pages: 0
    };
  }
};
</script>
