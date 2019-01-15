<template>
  <div class="modal">
    <div class="body">
      <slot />
    </div>
  </div>
</template>

<script>
import $ from 'jquery';
export default {
  name: "Modal",
  async mounted() {
  },
  beforeCreate() {
    $('html').css('overflow-y', 'hidden');
  },
  beforeDestroy() {
    $('html').css('overflow-y', 'overlay');
  },
  methods: {
  },
};
</script>

<style scoped>
  .modal {
    width: 100vw;
    height: 100vh;
    position: fixed;
    top:0;
    left:0;
    z-index: 99999999;
    align-items: center;
    justify-content: center;
    background-color: rgba(0,0,0,0.5);
    display: flex !important;
  }
  .body {
    overflow: auto;
  }
  /* .body {
    width: 80vw;
  } */
</style>