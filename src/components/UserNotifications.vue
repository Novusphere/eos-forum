<template>
  <layout :load="load">

    <template slot="topic">
      <span>Notifications</span>
    </template>

    <template slot="content">
      <div class="mb-1">
        <div class="float-right">
          <pager :pages="pages" :current_page="current_page"></pager>
        </div>
        <div class="clearfix"></div>
      </div>

      <div v-if="!loading">
        <div v-if="posts.length == 0">
              <div class="text-center">
                <h1>You have no notifications</h1>
              </div>
        </div>

        <post
          class="notification post-parent"
          v-for="p in posts"
          :key="p.transaction"
          :showAsFeed="true"
          @openPost="$_openPost"
          :post="p"
        />
        <modal
          @click.native="$_closePost"
          v-if="selectedPostID">
          <thread-modal
            @click.native.stop
            :id="selectedPostID"
          />
        </modal>
      </div>
      <div class="text-center" v-else>
        <h1><font-awesome-icon :icon="['fas', 'spinner']" spin></font-awesome-icon></h1>
      </div>
    </template>

  </layout>
</template>

<script>
import ui from "@/ui";

import Pager from "@/components/core/Pager";
import Post from "@/components/core/Post";
import PostSorter from "@/components/core/PostSorter";
import Layout from "@/components/section/Layout";

import Modal from "@/components/modal/Modal.vue";
import ThreadModal from "@/components/ThreadModal.vue";

export default {
  name: "UserNotifications",
  components: {
    Layout,
    Pager,
    Post,
    PostSorter,
    Modal,
    ThreadModal,
  },
  watch: {
    "$route.query.page": function() {
      this.load();
    },
  },
  async mounted() {
    this.load();
  },
  computed: {
  },
  methods: {
    async load() {
      this.loading = true;

      var notifications = await ui.views.UserNotifications(this.$route.query.page);

      this.current_page = notifications.current_page;
      this.pages = notifications.pages;
      this.posts = notifications.posts;

      await ui.actions.MarkNotificationsAsRead();

      this.loading = false;
    },
  },
  data() {
    return {
      loading: false,
      posts: [],
      current_page: 1,
      pages: 0,
      selectedPostID: undefined,
    };
  }
};
</script>
