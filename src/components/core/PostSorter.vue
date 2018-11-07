<template>
      <div class="dropdown d-inline-block">
        <button class="btn btn-sm btn-outline-primary dropdown-toggle" type="button" id="sortBy" data-toggle="dropdown">
          {{ by }}
        </button>
        <div class="dropdown-menu">
          <a v-for="o in options" :key="o" class="dropdown-item" href="javascript:void(0)" v-on:click="setBy(o)">{{ o }}</a>
        </div>
      </div>
</template>

<script>
import { GetNovusphere } from "@/novusphere";

export default {
  name: "PostSorter",
  props: {
      change: {
          type: Function,
          required: false,
          default: null
      },
      options: {
          type: Array,
          required: false,
          default: () => [ 'popular', 'time' ]
      },
      default_by: {
          type: String,
          required: false,
          default: 'popular'
      }
  },
  async mounted() {
      this.by = this.default_by;
  },
  methods: {
      setBy(val) {
          this.by = val;
          if (this.change) {
              this.change(this.by);
          }
      },
      getSorter() {
          const novusphere = GetNovusphere();
          if (this.by == 'popular') {
              return novusphere.query.sort.score();
          }
          return novusphere.query.sort.time();
      }
  },
  data() {
    return {
        by: 'popular'
    };
  }
};
</script>
