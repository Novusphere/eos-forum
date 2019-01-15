<template>
  <div>
    <h3>Recently Visited</h3>
    <div v-for="p in posts" :key="p.id">
      <div class="divline"></div>
      <div class="blocktxt">
        <router-link
          :to="{ name: 'Thread', params: { id: p.id, sub: p.sub } }">
          {{ p.title }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { storage } from "@/storage";

export default {
  name: "RecentlyVisited",
  async mounted() {
    var new_posts = Object.values(storage.new_posts);
    new_posts = new_posts
      .filter(np => np.id)
      .sort((s, s2) => s2.seen - s.seen)
      .slice(0, 5)
      .map(np => Object.assign({}, np));

    this.posts = new_posts;
  },
  methods: {},
  data() {
    return {
      posts: []
    };
  }
};
</script>
