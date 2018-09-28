<template>
    <div>
        <PostHistoryModal ref="historyModal"></PostHistoryModal>
        <HeaderSection :load="load">
            <span class="title mr-3"><router-link :to="'/u/' + account">{{account}}</router-link></span>
            <a class="btn btn-outline-secondary ml-1" :href="'https://bloks.io/account/' + account">view on chain</a>
        </HeaderSection>
        <MainSection>
        <div>
            <div class="row mb-2">
                <div class="col-md-6 col-12">
                    <div class="row">
                        <div class="col-md-6 col-5">Balances</div>
                        <div class="col-md-6 col-7">{{balances.atmos}} ATMOS</div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 col-5">Comments</div>
                        <div class="col-md-6 col-7">{{comments}}</div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 col-5">Threads</div>
                        <div class="col-md-6 col-7">{{threads}}</div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 col-5">Last Activity</div>
                        <div class="col-md-6 col-7">{{ lastActivity }}</div>
                    </div>
                </div>
                <div class="col-md-6 col-12">
                    
                </div>
            </div>
            <div class="row mb-2" v-for="p in posts" :key="p.transaction">
                <Post 
                :submitModal="null" 
                :historyModal="$refs.historyModal"
                :post="p" 
                :showContent="true">
                </Post>
            </div>
            <div class="row">
                <div class="col-md-2" v-if="currentPage>1">
                    <router-link :to="'/u/' + account + '?page=' + (currentPage-1)">&larr; prev</router-link>
                </div>
                <div class="col-md-2" v-if="currentPage<pages">
                    <router-link :to="'/u/' + account + '?page=' + (currentPage+1)">next &rarr;</router-link>
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
import { MigratePost, ApplyPostEdit } from "@/migrations";

import Post from "@/components/core/Post";

import PostHistoryModal from "@/components/modal/PostHistoryModal";

import HeaderSection from "@/components/section/HeaderSection";
import MainSection from "@/components/section/MainSection";

const MAX_ITEMS_PER_PAGE = 25;

export default {
  name: "UserProfile",
  components: {
    PostHistoryModal: PostHistoryModal,
    HeaderSection: HeaderSection,
    MainSection: MainSection,
    Post: Post
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
    this.load();
  },
  methods: {
    async load() {
      this.currentPage = parseInt(
        this.$route.query.page ? this.$route.query.page : 1
      );
      this.account = this.$route.params.account;

      const eos = GetEOS();
      const novusphere = GetNovusphere();

      var balanceAtmos;
      var comments, threads, pages, posts;

      balanceAtmos = parseFloat(
        (await eos.getCurrencyBalance("novusphereio", this.account, "ATMOS"))[0]
      );
      balanceAtmos = (isNaN(balanceAtmos) ? 0 : balanceAtmos).toFixed(3);

      comments = (await novusphere.api({
        count: novusphere.config.collection,
        maxTimeMS: 1000,
        query: forum.match_posts_by_account(this.account, true)
      })).n;

      threads = (await novusphere.api({
        count: novusphere.config.collection,
        maxTimeMS: 1000,
        query: forum.match_threads_by_account(this.account)
      })).n;

      pages = Math.ceil((comments + threads) / MAX_ITEMS_PER_PAGE);

      const identity = await GetScatterIdentity();

      posts = (await novusphere.api({
        aggregate: novusphere.config.collection,
        maxTimeMS: 1000,
        cursor: {},
        pipeline: [
          { $match: forum.match_posts_by_account(this.account, false) },
          { $sort: forum.sort_by_time() },
          { $skip: forum.skip_page(this.currentPage, MAX_ITEMS_PER_PAGE) },
          { $limit: MAX_ITEMS_PER_PAGE },
          { $lookup: forum.lookup_post_parent() },
          { $lookup: forum.lookup_post_state() },
          { $project: forum.project_post() },
          { $lookup: forum.lookup_post_replies() },
          { $lookup: forum.lookup_post_my_vote(identity.account) },
          { $project: forum.project_post_final(true, false) },
          { $match: forum.match_valid_parent() }
        ]
      })).cursor.firstBatch;

      for (var i = 0; i < posts.length; i++) {
        var p = posts[i];
        MigratePost(p);

        if (p.parent) {
          MigratePost(p.parent);
          
          if (p.parent.data.json_metadata) {
            const title = p.parent.data.json_metadata.title;
            p.data.json_metadata.title = title;
          }
        }
      }

      // push data to this
      this.balances.atmos = balanceAtmos;
      this.comments = comments;
      this.threads = threads;
      this.lastActivity =
        posts.length > 0
          ? new Date(posts[0].createdAt * 1000).toLocaleString()
          : "N/A";
      this.posts = posts;
      this.pages = pages;
    }
  },
  data() {
    return {
      account: "",
      balances: {
        atmos: 0
      },
      comments: 0,
      threads: 0,
      lastActivity: "",
      posts: [],
      currentPage: 1,
      pages: 0
    };
  }
};
</script>
