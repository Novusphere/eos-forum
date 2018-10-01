<template>
  <div>
    <SubmitPostModal ref="submit_modal" :sub="sub" :postContentCallback="postContent"></SubmitPostModal>
    <HeaderSection :load="load">
      <span class="title mr-3"><router-link :to="'/e/' + sub">{{ sub }}</router-link></span>
      <button v-if="!isSubscribed" v-on:click="subscribe(true)"  type="button" class="btn btn-outline-primary ml-1">subscribe</button>
      <button v-if="isSubscribed" v-on:click="subscribe(false)" type="button" class="btn btn-outline-danger ml-1">unsubscribe</button>
      <button type="button" class="btn btn-outline-primary" v-on:click="newPost()">new</button>
      <PostSorter ref="sorter" :change="load"></PostSorter>
    </HeaderSection>
    <MainSection>
      <div>
        <div v-if="posts.length == 0">
              <div class="text-center">
                <h1>There doesn't seem to be any posts here! Why not make one?</h1>
              </div>
        </div>
        <div class="row mb-2" v-for="p in posts" :key="p.transaction">
          <Post :submit_modal="$refs.submit_modal" :post="p" :show_content="false"></Post>
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
import jQuery from "jquery";

import { GetScatter, GetScatterIdentity } from "@/eos";
import { GetNovusphere } from "@/novusphere";
import { forum } from "@/novusphere-forum";
import { MigratePost, ApplyPostEdit } from "@/migrations";
import { storage, SaveStorage } from "@/storage";

import Post from "@/components/core/Post";
import PostSorter from "@/components/core/PostSorter";

import SubmitPostModal from "@/components/modal/SubmitPostModal";

import HeaderSection from "@/components/section/HeaderSection";
import MainSection from "@/components/section/MainSection";

const MAX_ITEMS_PER_PAGE = 25;
const DEFAULT_SUB = "all";

export default {
  name: "Home",
  components: {
    Post: Post,
    PostSorter: PostSorter,
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
  async mounted() {
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
      const identity = await GetScatterIdentity();

      apiResult = await novusphere.api({
        aggregate: novusphere.config.collection,
        maxTimeMS: 1000,
        cursor: {},
        pipeline: [
          { $match: forum.match_threads(sub) },
          { $lookup: forum.lookup_post_state() },
          { $project: forum.project_post() },
          { $sort: this.$refs.sorter.getSorter() },
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
    async newPost() {
      const identity = await GetScatterIdentity();
      if (
        identity.account ||
        this.sub == "anon" ||
        this.sub.indexOf("anon-") == 0
      ) {
        jQuery("#submitPost").modal();
      } else {
        alert("You must be logged in to post a new thread here!");
      }
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