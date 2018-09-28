<template>
    <div>
      <SettingsModal></SettingsModal>
      <FaqModal></FaqModal>

      <div class="header">
          <ul class="list-inline mb-0">
            <li v-if="!identity.account" class="list-inline-item">
              <a v-on:click="login()" href="javascript:void(0)" class="text-success">login</a>
            </li>
            <li v-if="identity.account" class="list-inline-item">
              <router-link class="text-success" :to="'/u/' + identity.account">{{ identity.account }}</router-link>
            </li>
            <li v-if="identity.account" class="list-inline-item">
              <a v-on:click="logout()" href="javascript:void(0)" class="text-danger">logout</a>
            </li>
            <li class="list-inline-item">
              <a href="#settings" data-toggle="modal" class="text-danger">settings</a>
            </li>
            <li class="list-inline-item">
              <a href="#faq" data-toggle="modal" class="text-success">faq/help</a>
            </li>
          </ul>
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
import { storage } from "@/storage";
import { DEFAULT_IDENTITY, ForgetScatterIdentity, GetScatterIdentity, GetScatter } from '@/eos';

import SettingsModal from "@/components/modal/SettingsModal";
import FaqModal from "@/components/modal/FaqModal";

export default {
  name: "HeaderSection",
  components: {
    SettingsModal: SettingsModal,
    FaqModal: FaqModal
  },
  props: {
    load: {
      type: Function,
      required: false
    }
  },
  async mounted() {
    this.identity = await GetScatterIdentity();
  },
  methods: {
    async login() {
      this.identity = await GetScatterIdentity(true);
      if (this.load) {
        this.load();
      }
    },
    async logout() {
      this.identity = await ForgetScatterIdentity();
      if (this.load) {
        this.load();
      }
    }
  },
  computed: {
    subs() {
      return storage.subscribed_subs;
    }
  },
  data() {
    return {
      identity: DEFAULT_IDENTITY
    };
  }
};
</script>
