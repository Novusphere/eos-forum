<template>
  <div>
    <SubmitPostModal ref="submit_modal" :sub="sub" :post_content_callback="postContent"></SubmitPostModal>
    <HeaderSection :load="load">
      <span class="title mr-3"><router-link :to="'/e/' + sub">{{ sub }}</router-link></span>
      <button v-if="!is_subscribed" v-on:click="subscribe(true)"  type="button" class="btn btn-sm btn-outline-primary ml-1">subscribe</button>
      <button v-if="is_subscribed" v-on:click="subscribe(false)" type="button" class="btn btn-sm btn-outline-danger ml-1">unsubscribe</button>
      <button type="button" class="btn btn-sm btn-outline-primary" v-on:click="newThread()">new</button>
      <PostSorter ref="sorter" :change="load"></PostSorter>
    </HeaderSection>
    <MainSection>
      <div>
        <div v-if="posts.length == 0">
              <div class="text-center">
                <h1>There doesn't seem to be any posts here! Why not make one?</h1>
              </div>
        </div>
     
          <Post 
            v-for="p in posts" 
            :key="p.transaction" 
            :submit_modal="$refs.submit_modal" 
            :post="p" 
            :show_content="false">
          </Post>
     
        <div class="row mb-4">
            <div class="col-12">
              <div class="float-right">
                  <router-link v-if="current_page>1" class="btn btn-outline-primary" :to="'/e/' + sub + '?page=' + (current_page-1)">&larr; prev</router-link>
                  <router-link v-if="current_page<pages" class="btn btn-outline-primary" :to="'/e/' + sub + '?page=' + (current_page+1)">next &rarr;</router-link>
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

import SubmitPostModal from "@/components/modal/SubmitPostModal";

import HeaderSection from "@/components/section/HeaderSection";
import MainSection from "@/components/section/MainSection";

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
      var home = await ui.Home(this.$route.query.page, this.$route.params.sub, this.$refs.sorter.getSorter());
      this.is_subscribed = home.is_subscribed;
      this.posts = home.posts;
      this.pages = home.pages;
      this.current_page = home.current_page;
      this.sub = home.sub;
    },
    async newThread() {
      try {
        await ui.NewThread(this.sub);
        jQuery("#submitPost").modal();
      }
      catch (reason) {
        alert(reason);
      }
    },
    postContent(txid) {
      this.$router.push("/e/" + this.sub + "/" + txid);
    },
    async subscribe(sub) {
      this.is_subscribed = await ui.Subscribe(sub, this.sub);
    }
  },
  data() {
    return {
      is_subscribed: false,
      current_page: 0,
      pages: 0,
      sub: "",
      posts: [] // for posts being displayed
    };
  }
};
</script>