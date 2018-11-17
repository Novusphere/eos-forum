<template>
    <div>
        <PostHistoryModal ref="history_modal"></PostHistoryModal>
        <HeaderSection :load="load">
            <span class="title mr-3">notifications</span>
        </HeaderSection>
        <MainSection>
        <div>
            <div class="row mb-2" v-for="p in posts" :key="p.o_id">
              <Post :history_modal="$refs.history_modal" :post="p" :show_content="true"></Post>
            </div>
            <div class="row mb-4">
                <div class="col-12">
                  <div class="float-right">
                      <Pager :pages="pages" :current_page="current_page"></Pager>
                  </div>
                </div>
            </div>
        </div>
        </MainSection>
    </div>
</template>

<script>
import ui from "@/ui";

import Pager from "@/components/core/Pager";
import Post from "@/components/core/Post";
import PostSorter from "@/components/core/PostSorter";

import PostHistoryModal from "@/components/modal/PostHistoryModal";

import HeaderSection from "@/components/section/HeaderSection";
import MainSection from "@/components/section/MainSection";

export default {
  name: "UserNotifications",
  components: {
    PostHistoryModal: PostHistoryModal,
    HeaderSection: HeaderSection,
    MainSection: MainSection,
    Pager: Pager,
    Post: Post,
    PostSorter: PostSorter
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
      var notifications = await ui.views.UserNotifications(this.$route.query.page);
      this.current_page = notifications.current_page;
      this.pages = notifications.pages;
      this.posts = notifications.posts;

      await ui.actions.MarkNotificationsAsRead();
    }
  },
  data() {
    return {
      posts: [],
      current_page: 1,
      pages: 0
    };
  }
};
</script>
