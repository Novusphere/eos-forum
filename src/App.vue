<template>
  <div id="app">
    <SettingsModal></SettingsModal>
    <FaqModal></FaqModal>
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

import "@/assets/css/style.css";

import SettingsModal from "@/components/modal/SettingsModal";
import FaqModal from "@/components/modal/FaqModal";
import ErrorModal from "@/components/modal/ErrorModal";
import ConfirmModal from "@/components/modal/ConfirmModal";
import UpvoteModal from "@/components/modal/UpvoteModal";

export default {
  name: "App",
  components: {
    SettingsModal: SettingsModal,
    FaqModal: FaqModal,
    ErrorModal: ErrorModal,
    ConfirmModal: ConfirmModal,
    UpvoteModal: UpvoteModal
  },
  mounted() {
    window._VueApp = this;
  },
  methods: {},
  computed: {},
  data() {
    return {};
  }
};
</script>
