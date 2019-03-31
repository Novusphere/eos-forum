<template>
  <div class="modal" >
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
    $('html').css('overflow-y', '');
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
    z-index: 999;
    justify-content: center;
    background-color: rgba(0,0,0,0.65);
    display: flex;
    overflow-y: auto;
  }
</style>