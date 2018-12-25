<template>
  <layout ref="layout" :load="load">

    <template slot="topic">
      <span v-if="sub">e/{{sub}}</span>
      <span v-else>Home</span>
    </template>

    <template slot="content">
      <div class="mt-1 mb-3">
        <div class="ml-1 float-left">
          <post-sorter ref="sorter"
            :default_by="default_sorter"
            :options="sorter_options"
            :change="load">
          </post-sorter>
        </div>
        <div class="ml-1 float-left" v-if="!loading">
          <button v-if="sub && !is_subscribed"
            v-on:click="subscribe(true)"
            type="button"
            class="btn btn-outline-primary mr-1">
            subscribe
          </button>
          <button v-if="sub && is_subscribed"
            v-on:click="subscribe(false)"
            type="button"
            class="btn btn-outline-danger mr-1">
            unsubscribe
          </button>
        </div>
        <div class="float-right">
          <pager :pages="pages"
            :current_page="current_page">
          </pager>
        </div>
        <div class="clearfix"></div>
      </div>

      <div v-if="!loading">
        <div v-if="posts.length == 0">
          <div class="text-center">
            <h1>There doesn't seem to be any posts here! Why not make one?</h1>
          </div>
        </div>

        <post v-for="p in posts" :key="p.transaction" :post="p"></post>
      </div>

      <div class="text-center" v-else>
        <h1><font-awesome-icon :icon="['fas', 'spinner']" spin></font-awesome-icon></h1>
      </div>
    </template>

    <template slot="right_sidebar">
      <div class="sidebarblock">
        <recently-visited></recently-visited>
      </div>
    </template>

  </layout>
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
  computed: {
    default_sorter() {
      if (this.sub == 'referendum')
        return 'active';
      return 'popular';
    },
    sorter_options() {
      if (this.sub == 'referendum')
        return ['active', 'old'];

      return ['popular', 'time'];
    }
  },
  async mounted() {
    this.load();
  },
  methods: {
    async load() {
      this.loading = true;
      this.sub = this.$route.params.sub;
      this.posts = [];
      this.pages = 0;

      const novusphere = GetNovusphere();
      var home = await ui.views.Home(this.$route.query.page, this.sub, this.$refs.sorter.getSorter());
      this.is_subscribed = home.is_subscribed;
      this.posts = home.posts;
      this.pages = home.pages;
      this.current_page = home.current_page;
      this.sub = home.sub;
      this.loading = false;

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
      loading: false,
      is_subscribed: false,
      current_page: 0,
      pages: 0,
      sub: "",
      posts: [] // for posts being displayed
    };
  }
};
</script>
