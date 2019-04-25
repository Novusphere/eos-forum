<template>
  <div>
    <PostHistoryModal ref="history_modal"></PostHistoryModal>
    <HeaderSection :load="load">
      <span class="title mr-3">search</span>
    </HeaderSection>
    <MainSection>
      <div>
        <div class="row mb-2">
            <ul>
                <li v-for="sub in subs" :key="sub._id">
                    <router-link :to="'/e/' + sub._id">/e/{{ sub._id }}</router-link> 
                    - {{ sub.count }} posts
                </li>
            </ul>
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

import PostHistoryModal from "@/components/modal/PostHistoryModal";

import HeaderSection from "@/components/section/HeaderSection";
import MainSection from "@/components/section/MainSection";

const MAX_ITEMS_PER_PAGE = 25;

export default {
  name: "Search",
  components: {
    Post: Post,
    PostSorter: PostSorter,
    PostHistoryModal: PostHistoryModal,
    HeaderSection: HeaderSection,
    MainSection: MainSection
  },
  watch: {},
  async mounted() {
    this.load();
  },
  methods: {
    async load() {
      var search = ui.views.Search();

      this.subs = search.subs;
    }
  },
  data() {
    return {
        subs: []
    };
  }
};
</script>