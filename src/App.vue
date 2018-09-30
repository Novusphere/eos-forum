<template>
  <div id="app">
    <SettingsModal></SettingsModal>
    <FaqModal></FaqModal>
    <ErrorModal></ErrorModal>
    
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

export default {
  name: "App",
  components: {
    SettingsModal: SettingsModal,
    FaqModal: FaqModal,
    ErrorModal: ErrorModal
  },
  mounted() {},
  methods: {},
  computed: {},
  data() {
    return {
    }
  }
};
</script>
