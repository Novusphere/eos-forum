<template>
  <div class="thread-container">
    <post v-if="opening_post.id" class="root" :post="main_post" :thread="opening_post" />
    <div v-else class="loader">
      <div class="white-bg">
        <div>
          Loading thread...
        </div>
        <h1>
          <font-awesome-icon :icon="['fas', 'spinner']" spin />
        </h1>
      </div>
    </div>
  </div>
</template>

<script>
import ui from "@/ui";
import { GetNovusphere } from "@/novusphere";

import Pager from "@/components/core/Pager";
import PostSorter from "@/components/core/PostSorter";
import Post from "@/components/core/Post";
import RecentlyVisited from "@/components/core/RecentlyVisited";

import Layout from "@/components/section/Layout";

export default {
  name: "ThreadModal",
  metaInfo() {
    const title = this.main_post.data.json_metadata.title;
    return {
      titleTemplate: `%s | ${title}`
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
    "$route.params.id": function() {
      this.load();
    },
    "$route.params.child_id": function() {
      this.load();
    }
  },
  async mounted() {
    console.log('opening post:', this.id);
    this.load(this.id);
  },
  props: {
    id: {
      default: 0,
      type: Number,
    }
  },
  methods: {
    async load(id = this.$route.params.id, child_id = this.$route.params.child_id) {
      var thread = await ui.views.Thread(id, child_id);
      this.opening_post = thread.opening_post;
      this.main_post = thread.main_post;
      // this.loading = false;
    },
    postContent(txid, data) {
      this.load(); // reload thread
    }
  },
  data() {
    return {
      opening_post: ui.helpers.PlaceholderPost(),
      main_post: ui.helpers.PlaceholderPost(),
      loading: true,
    };
  }
};
</script>

<style scoped>
.loader {
  width: 100vw;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}
.thread-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 20px;
  padding-bottom: 20px;
}
.white-bg {
    align-self: center;
    background-color: white;
    height: 200px;
    width: 60vw;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}
.root {
  padding-bottom: 10px;
  padding-top: 10px;
}
.post {
  width: 60vw;
}
</style>
