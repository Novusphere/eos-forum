<template>
    <div>
      <div class="header">
          <ul class="list-inline">
            <li v-for="sub in subs" :key="sub" class="list-inline-item"><router-link :to="'/e/' + sub">{{sub}}</router-link></li>
          </ul>
      </div>
      <div class="header-second mb-3">
        <div class="ml-3">
          <slot></slot>
        </div>
      </div>
    </div>
</template>

<script>
import { storage } from '../storage'

export default {
  name: "HeaderSection",
  async mounted() {
  },
  methods: {
  },
  computed: {
    subs: function() {
      return storage.subscribed_subs;
    }
  },
  data() {
    return {
    };
  }
}
</script>
