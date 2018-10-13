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
import { moderation } from "@/moderation";

import Post from "@/components/core/Post";
import PostSorter from "@/components/core/PostSorter";

import SubmitPostModal from "@/components/modal/SubmitPostModal";

import HeaderSection from "@/components/section/HeaderSection";
import MainSection from "@/components/section/MainSection";

const MAX_ITEMS_PER_PAGE = 25;

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

      var DEFAULT_SUB = "all";
      if (window.__PRESETS__ && window.__PRESETS__.default_sub) {
        DEFAULT_SUB = window.__PRESETS__.default_sub;
      }

      var sub = (this.$route.params.sub
        ? this.$route.params.sub
        : DEFAULT_SUB
      ).toLowerCase();

      var novusphere = GetNovusphere();
      var apiResult;
      var blocked_accounts = storage.moderation.hide_spam_threads
        ? await moderation.getBlockedAccounts()
        : [];

      //console.log(blocked_accounts);

      var n_posts = (await novusphere.api({
        count: novusphere.config.collection,
        maxTimeMS: 1000,
        query: forum.match_threads(sub, blocked_accounts)
      })).n;

      var numPages = Math.ceil(n_posts / MAX_ITEMS_PER_PAGE);
      const identity = await GetScatterIdentity();

      var threads = (await novusphere.api({
        aggregate: novusphere.config.collection,
        maxTimeMS: 1000,
        cursor: {},
        pipeline: [
          { $match: forum.match_threads(sub, blocked_accounts) },
          { $lookup: forum.lookup_post_state() },
          {
            $project: forum.project_post({
              normalize_up: true,
              normalize_parent: true,
              score: true
            })
          },
          { $sort: this.$refs.sorter.getSorter() },
          { $skip: forum.skip_page(currentPage, MAX_ITEMS_PER_PAGE) },
          { $limit: MAX_ITEMS_PER_PAGE },
          { $lookup: forum.lookup_thread_replies() },
          { $lookup: forum.lookup_post_my_vote(identity.account) },
          {
            $project: forum.project_post({
              normalize_my_vote: true,
              recent_edit: true,
              total_replies: true
            })
          }
        ]
      })).cursor.firstBatch;

      var pinned_threads = (await novusphere.api({
        aggregate: novusphere.config.collection,
        maxTimeMS: 1000,
        cursor: {},
        pipeline: [
          { $match: forum.match_thread_txids(await moderation.getPinned(sub)) },
          { $lookup: forum.lookup_post_state() },
          {
            $project: forum.project_post({
              normalize_up: true,
              normalize_parent: true
            })
          },
          { $lookup: forum.lookup_thread_replies() },
          { $lookup: forum.lookup_post_my_vote(identity.account) },
          {
            $project: forum.project_post({
              normalize_my_vote: true,
              recent_edit: true,
              total_replies: true
            })
          }
        ]
      })).cursor.firstBatch;

      threads = Array.concat(
        pinned_threads,
        threads.filter(t => !pinned_threads.find(t2 => t2.id == t.id))
      );

      for (var i = 0; i < threads.length; i++) {
        var post = threads[i];
        if (i < pinned_threads.length) {
          post.is_pinned = true;
        }
        await MigratePost(post);

        var old_replies = storage.new_posts[post.data.post_uuid];
        if (old_replies && isNaN(old_replies)) {
          old_replies = old_replies.replies; // migration to new format
        }
        post.new_replies =
          old_replies == undefined
            ? post.total_replies + 1
            : post.total_replies - old_replies;
        post.new_replies = Math.max(post.new_replies, 0); // bug fix
      }

      // push data to this
      this.isSubscribed = storage.subscribed_subs.includes(sub);
      this.posts = threads;
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