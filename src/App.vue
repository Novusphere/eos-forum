<template>
  <div id="app">
    <ErrorModal></ErrorModal>
    <ConfirmModal></ConfirmModal>
    <UpvoteModal ref="upvote"></UpvoteModal>

    <router-view/>
  </div>
</template>

<script>
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap/dist/js/bootstrap.js";
import "bootstrap-vue/dist/bootstrap-vue.css";

import ErrorModal from "@/components/modal/ErrorModal";
import ConfirmModal from "@/components/modal/ConfirmModal";
import UpvoteModal from "@/components/modal/UpvoteModal";

export default {
  name: "App",
  components: {
    ErrorModal: ErrorModal,
    ConfirmModal: ConfirmModal,
    UpvoteModal: UpvoteModal
  },
  mounted() {
    window._VueApp = this;
    if (screen.width <= 600) {
      this.$root.showSubs = false;
    }
    if (localStorage.getItem('preview')) {
      this.$root.showPreview = JSON.parse(localStorage.getItem('preview'));
    }
  },
  methods: {},
  computed: {},
  data() {
    return {};
  }
};
</script>
