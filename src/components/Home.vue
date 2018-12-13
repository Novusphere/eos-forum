<template>
  <div>
    
    <layout :load="load">
        <template slot="topic">
          <span v-if="sub">e/{{sub}}</span>
          <span v-else>Home</span>
        </template>
        <template slot="content">
          <div class="mb-1">
            <div class="float-left">
              <router-link :to="{ name: 'StartThread', params: { sub: sub ? sub : 'all' } }" class="btn btn-sm btn-outline-success">
                new
              </router-link>
            </div>
            <div class="ml-1 float-left">
              <post-sorter ref="sorter" :change="load"></post-sorter>
            </div>
            <div class="ml-1 float-left">
              <button v-if="sub && !is_subscribed" v-on:click="subscribe(true)"  type="button" class="btn btn-sm btn-outline-primary">subscribe</button>
              <button v-if="sub && is_subscribed" v-on:click="subscribe(false)" type="button" class="btn btn-sm btn-outline-danger">unsubscribe</button>
            </div>
            <div class="float-right">
              <pager :pages="pages" :current_page="current_page"></pager>
            </div>
            <div class="clearfix"></div>
          </div>

            <div v-if="posts.length == 0">
                  <div class="text-center">
                    <h1>There doesn't seem to be any posts here! Why not make one?</h1>
                  </div>
            </div>

            <post v-for="p in posts" :key="p.transaction" :post="p"></post>
      
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
import ui from "@/ui";
import { GetNovusphere } from "@/novusphere";

import Pager from "@/components/core/Pager";
import PostSorter from "@/components/core/PostSorter";
import RecentlyVisited from "@/components/core/RecentlyVisited";
import Post from "@/components/core/Post";

import Layout from "@/components/section/Layout";

export default {
  name: "Home2",
  metaInfo() {
    const sub = (this.sub) ? `e/${this.sub}` : 'Home';
    return {
      titleTemplate: `%s | ${sub}`,
    };
  },
  components: {
    Pager,
    PostSorter,
    RecentlyVisited,
    Post,
    Layout
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

      if (this.$route.params.sub == 'eos-referendum') {
        this.$router.push('/referendum');
        return;
      }

      const novusphere = GetNovusphere();
      var home = await ui.views.Home(this.$route.query.page, this.$route.params.sub, this.$refs.sorter.getSorter());
      this.is_subscribed = home.is_subscribed;
      this.posts = home.posts;
      this.pages = home.pages;
      this.current_page = home.current_page;
      this.sub = home.sub;

    },
    async newThread() {
      try {
        await ui.actions.CheckCreateThread(this.sub);
        this.$refs.submit_modal.showModal();
      }
      catch (reason) {
        alert(reason);
      }
    },
    postContent(txid) {
      this.$router.push("/e/" + this.sub + "/" + txid);
    },
    async subscribe(sub) {
      this.is_subscribed = await ui.actions.Subscribe(sub, this.sub);
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