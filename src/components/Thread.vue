<template>
  <div> 
    <PostHistoryModal ref="history_modal"></PostHistoryModal>
    <SubmitPostModal ref="submit_modal" :sub="opening_post.data.json_metadata.sub" :post_content_callback="postContent" :reply_uuid="opening_post.data.post_uuid" :reply_account="opening_post.data.poster"></SubmitPostModal>
    <HeaderSection :load="load">
      <span class="title mr-3"><router-link :to="'/e/' + opening_post.data.json_metadata.sub">{{ opening_post.data.json_metadata.sub }}</router-link></span>          
    </HeaderSection>
    <MainSection>
      <div class="thread">
        <Post :submit_modal="$refs.submit_modal"
          :history_modal="$refs.history_modal"
          :post="main_post"
          :op="main_post.data.poster" 
          :show_content="true" 
          v-bind="main_post">
        </Post>
      </div>
    </MainSection>
  </div>
</template>

<script>
import { v4 as uuidv4 } from "uuid";
import jQuery from "jquery";

import ui from "@/ui";

import SubmitPostModal from "@/components/modal/SubmitPostModal";
import PostHistoryModal from "@/components/modal/PostHistoryModal";

import Post from "@/components/core/Post";

import HeaderSection from "@/components/section/HeaderSection";
import MainSection from "@/components/section/MainSection";

export default {
  name: "Thread",
  components: {
    SubmitPostModal: SubmitPostModal,
    PostHistoryModal: PostHistoryModal,
    Post: Post,
    HeaderSection: HeaderSection,
    MainSection: MainSection
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
    this.load();
  },
  methods: {
    async load() {
      var thread = await ui.views.Thread(this.$route.params.id, this.$route.params.child_id);
      this.opening_post = thread.opening_post;
      this.main_post = thread.main_post;
    },
    postContent(txid, data) {
      this.load(); // reload thread
    }
  },
  data() {
    return {
      opening_post: ui.helpers.PlaceholderPost(),
      main_post: ui.helpers.PlaceholderPost()
    };
  }
};
</script>