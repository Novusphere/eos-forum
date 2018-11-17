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
import ui from "@/ui";
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
      default: () => ["popular", "time"]
    },
    default_by: {
      type: String,
      required: false,
      default: "popular"
    }
  },
  async mounted() {
    this.load();
  },
  watch: {
    "$route.query.sort": function() {
      this.load();
      if (this.change) {
        this.change(this.by);
      }
    }
  },
  methods: {
    load() {
      var sort = this.$route.query.sort;
      this.by = sort && this.options.includes(sort) ? sort : this.default_by;
    },
    setBy(val) {
      const route = ui.helpers.Route(this.$route, {
        query: { sort: val }
      });
      this.$router.push(route);
    },
    getSorter() {
      const novusphere = GetNovusphere();
      if (this.by == "popular") {
        return novusphere.query.sort.score();
      }
      return novusphere.query.sort.time();
    }
  },
  data() {
    return {
      by: "popular"
    };
  }
};
</script>
