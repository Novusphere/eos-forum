<template>
  <layout
    :load="load"
    :mode="$route.params.mode"
    >
    <template slot="topic">
      <span>Thread</span>
    </template>

    <template slot="content">

      <div class="mb-1" v-if="!loading">
        <button
          class="btn btn-sm btn-primary"
          @click="
            $root.mode = 'normal',
            $router.push({
            name: is_perma ? 'Thread' : 'Sub',
            params: {
              sub: $route.params.sub,
              id: $route.params.id,
            }
          })"
        >
          <template v-if="is_perma">
            <font-awesome-icon :icon="['fas', 'arrow-left']" />
            back to original post
          </template>
          <template v-else>
            <font-awesome-icon :icon="['fas', 'arrow-left']" />
            e/{{ $route.params.sub }}
          </template>
        </button>
      </div>

      <div class="text-center" v-if="(!opening_post || !opening_post.id) && !loading">
        <h1>Thread not found</h1>
      </div>

      <post class="mb-2 pb-2"
        v-if="opening_post && opening_post.id && !loading"
        :post="main_post"
        :thread="opening_post">
      </post>

      <div class="text-center" v-if="loading">
        <h1><font-awesome-icon :icon="['fas', 'spinner']" spin></font-awesome-icon></h1>
      </div>
    </template>
  </layout>
</template>

<script>
import ui from "@/ui";
import { GetNovusphere } from "@/novusphere";

import Pager from "@/components/core/Pager";
import PostSorter from "@/components/core/PostSorter";
import Post from "@/components/core/Post";

import Layout from "@/components/section/Layout";

export default {
  name: "Thread",
  metaInfo() {
    const title = this.main_post.data.json_metadata.title;
    return {
      titleTemplate: `%s | ${title}`
    };
  },
  components: {
    Pager,
    PostSorter,
    Post,
    Layout
  },
  watch: {
    "$route.params.id": function() {
      this.load(true);
    },
    "$route.params.child_id": function() {
      this.load(true);
    }
  },
  beforeDestroy() {
    this.inactive = true;
    this.$root.mode = "normal";
  },
  async mounted() {
    this.load();
  },
  computed: {
    is_perma() {
      return this.$route.params.child_id;
    }
  },
  methods: {
    async load(
      force = false,
      id = this.$route.params.id,
      child_id = this.$route.params.child_id
    ) {
      this.loading = true;
      if (this.inactive) {
        return;
      }

      var thread = await ui.views.Thread(id, child_id);
      if (force || child_id || thread.count > this.count) {
        this.opening_post = thread.opening_post;
        this.main_post = thread.main_post;
        this.count = thread.count;
      }

      if (!child_id) {
        //setTimeout(() => this.load(id, child_id), 7500);
      }

      this.loading = false;
    },
    postContent(txid, data) {
      this.load(); // reload thread
    }
  },
  data() {
    return {
      opening_post: ui.helpers.PlaceholderPost(),
      main_post: ui.helpers.PlaceholderPost(),
      count: 0,
      inactive: false,
      loading: false
    };
  }
};
</script>