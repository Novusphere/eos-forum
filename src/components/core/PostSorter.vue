<template>
      <div class="dropdown d-inline-block">
        <button class="btn btn-outline-secondary dropdown-toggle" type="button" id="sortBy" data-toggle="dropdown">
          {{ by }}
        </button>
        <div class="dropdown-menu">
          <a class="dropdown-item" href="javascript:void(0)" v-on:click="setBy('popular')">popular</a>
          <a class="dropdown-item" href="javascript:void(0)" v-on:click="setBy('time')">time</a>
        </div>
      </div>
</template>

<script>
import { forum } from "@/novusphere-forum";

export default {
  name: "PostSorter",
  props: {
      change: {
          type: Function,
          required: false,
          default: null
      }
  },
  async mounted() {},
  methods: {
      setBy(val) {
          this.by = val;
          if (this.change) {
              this.change(this.by);
          }
      },
      getSorter() {
          if (this.by == 'popular') {
              return forum.sort_by_score();
          }
          return forum.sort_by_time();
      }
  },
  data() {
    return {
        by: 'popular'
    };
  }
};
</script>
