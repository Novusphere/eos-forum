<template>
    <div>
      <SettingsModal></SettingsModal>

      <div class="header">
          <ul class="list-inline">
            <li v-for="sub in subs" :key="sub" class="list-inline-item"><router-link :to="'/e/' + sub">{{sub}}</router-link></li>
            <li class="float-right list-inline-item mr-2">
              <a href="#settings" data-toggle="modal" class="text-danger">settings</a>
            </li>
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
import { storage } from '../storage.js';

import SettingsModal from './SettingsModal.vue';

export default {
  name: "HeaderSection",
  components: {
    'SettingsModal': SettingsModal
  },
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
