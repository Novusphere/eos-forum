<template>
  <div>
    <SubmitPostModal ref="submitModal" :sub="sub" :postContentCallback="postContent"></SubmitPostModal>
    <HeaderSection>
      <span class="title mr-3"><router-link :to="'/e/' + sub">{{ sub }}</router-link></span>
      <button v-if="!isSubscribed" v-on:click="subscribe(true)"  type="button" class="btn btn-outline-primary ml-1">subscribe</button>
      <button v-if="isSubscribed" v-on:click="subscribe(false)" type="button" class="btn btn-outline-danger ml-1">unsubscribe</button>
      <button type="button" class="btn btn-outline-secondary ml-1" data-toggle="modal" data-target="#submitPost">new</button>
    </HeaderSection>
    <MainSection>
      <div>
        <div v-if="posts.length == 0">
              <div class="text-center">
                <h1>There doesn't seem to be any posts here! Why not make one?</h1>
              </div>
        </div>
        <div class="row mb-2" v-for="p in posts" :key="p.transaction">
              <Post :submitModal="$refs.submitModal" :post="p" :showContent="false"></Post>
        </div>
        <div class="row mb-4">
            <div class="col-12">
              <div class="float-right">
                  <router-link v-if="currentPage>1" class="btn btn-outline-primary" :to="'/e/' + sub + '?page=' + (currentPage-1)">&larr; prev</router-link>
                  <router-link v-if="currentPage<pages" class="btn btn-outline-primary" :to="'/e/' + sub + '?page=' + (currentPage+1)">next &rarr;</router-link>
              </div>
            </div>
        </div>
      </div>
    </MainSection>
  </div>
</template>

<script>
import { GetNovusphere } from "../novusphere";
import { MigratePost, ApplyPostEdit } from "../migrations";
import { storage, SaveStorage } from "../storage";
import { forum } from "../novusphere-forum";
import jQuery from "jquery";

import Post from "./Post.vue";
import SubmitPostModal from "./SubmitPostModal.vue";
import HeaderSection from "./HeaderSection";
import MainSection from "./MainSection";
import { GetScatter, GetScatterIdentity } from '../eos';

const MAX_ITEMS_PER_PAGE = 25;
const DEFAULT_SUB = "all";

export default {
  name: "Index",
  components: {
    Post: Post,
    SubmitPostModal: SubmitPostModal,
    HeaderSection: HeaderSection,
    MainSection: MainSection
  },
  watch: {
    "$route.query.page": function() {
      this.load();
    },
    "$route.params.sub": function() {
      this.load();
    }
  },
  mounted() {
    this.load();
  },
  methods: {
    async load() {
      var currentPage = parseInt(
        this.$route.query.page ? this.$route.query.page : 1
      );

      var sub = (this.$route.params.sub
        ? this.$route.params.sub
        : DEFAULT_SUB
      ).toLowerCase();

      var novusphere = GetNovusphere();
      var apiResult;

      apiResult = await novusphere.api({
        count: novusphere.config.collection,
        maxTimeMS: 1000,
        query: forum.match_threads(sub)
      });

      var numPages = Math.ceil(apiResult.n / MAX_ITEMS_PER_PAGE);
      var identity = await GetScatterIdentity(true);

      apiResult = await novusphere.api({
        aggregate: novusphere.config.collection,
        maxTimeMS: 1000,
        cursor: {},
        pipeline: [
          { $match: forum.match_threads(sub) },
          { $lookup: forum.lookup_post_state()},
          { $project: forum.project_post() },
          { $sort: forum.sort_by_score() },
          { $skip: forum.skip_page(currentPage, MAX_ITEMS_PER_PAGE) },
          { $limit: MAX_ITEMS_PER_PAGE },
          { $lookup: forum.lookup_post_replies() },
          { $lookup: forum.lookup_post_my_vote(identity.account) },
          { $project: forum.project_post_final(true, true) }
        ]
      });

      var payload = apiResult.cursor.firstBatch;

      for (var i = 0; i < payload.length; i++) {
        var post = payload[i];
        MigratePost(post);

        if (post.recent_edit) {
          ApplyPostEdit(post, post.recent_edit);
        }

        var old_replies = storage.new_posts[post.data.post_uuid];
        post.new_replies =
          old_replies == undefined
            ? post.total_replies + 1
            : post.total_replies - old_replies;
        post.new_replies = Math.max(post.new_replies, 0); // bug fix
      }

      // push data to this
      this.isSubscribed = storage.subscribed_subs.includes(sub);
      this.posts = payload;
      this.pages = numPages;
      this.currentPage = currentPage;
      this.sub = sub;
    },
    postContent(txid) {
      this.$router.push("/e/" + this.sub + "/" + txid);
    },
    subscribe(sub) {
      if (sub) {
        if (storage.subscribed_subs.includes(this.sub)) return;
        storage.subscribed_subs.push(this.sub);
        //console.log(storage.subscribed_subs);
        SaveStorage();

        this.isSubscribed = true;
      } else {
        // remove all
        for (;;) {
          var i = storage.subscribed_subs.indexOf(this.sub);
          if (i < 0) break;
          storage.subscribed_subs.splice(i, 1);
          //console.log(storage.subscribed_subs);
        }

        SaveStorage();

        this.isSubscribed = false;
      }
    }
  },
  data() {
    return {
      isSubscribed: false,
      currentPage: 0,
      pages: 0,
      sub: "",
      posts: [] // for posts being displayed
    };
  }
};
</script>