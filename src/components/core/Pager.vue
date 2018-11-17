<template>
    <div>
        <button v-if="current_page>1" class="btn btn-outline-primary" v-on:click="page(-1)">
            <font-awesome-icon :icon="['fas', 'arrow-left']" ></font-awesome-icon> prev
        </button>
        <button v-if="current_page<pages" class="btn btn-outline-primary" v-on:click="page(1)">
            next <font-awesome-icon :icon="['fas', 'arrow-right']" ></font-awesome-icon>
        </button>
    </div>
</template>

<script>
import ui from "@/ui";

export default {
  name: "Pager",
  props: {
    current_page: {
      type: Number,
      required: true
    },
    pages: {
      type: Number,
      required: true
    }
  },
  methods: {
    page(p) {
      const route = ui.helpers.Route(this.$route, {
        query: { page: this.current_page + p }
      });
      this.$router.push(route);
    }
  },
  data() {
    return {};
  }
};
</script>