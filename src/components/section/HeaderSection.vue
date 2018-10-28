<template>
    <div>
      <div class="header">
          <ul class="list-inline mb-0">
            <li v-if="!identity.account" class="list-inline-item">
              <a v-on:click="login()" href="javascript:void(0)">login</a>
            </li>
            <li v-if="identity.account" class="list-inline-item">
              <router-link :to="'/u/' + identity.account" class="text-mine">
                {{ identity.account }} | {{ identity.atmos }} ATMOS
              </router-link>
            </li>
            <li v-if="identity.account" class="list-inline-item">
              <router-link :to="'/notifications'">
                <font-awesome-icon :icon="['fas', 'bell']" ></font-awesome-icon>
                <span v-if="identity.notifications" class="badge badge-danger">{{ identity.notifications }}</span>
              </router-link>
            </li>
            <li v-if="identity.account" class="list-inline-item">
              <a v-on:click="logout()" href="javascript:void(0)">logout</a>
            </li>
            <li class="list-inline-item">
              <a href="#settings" data-toggle="modal">settings</a>
            </li>
            <li v-if="eos_referendum" class="list-inline-item">
              <router-link :to="'/referendum'">eos-referendum</router-link>
            </li>
            <li class="list-inline-item">
              <a href="#faq" data-toggle="modal">faq/help</a>
            </li>
          </ul>
          <ul class="list-inline">
            <li v-for="sub in subs" :key="sub" class="list-inline-item"><router-link :to="'/e/' + sub">{{sub}}</router-link></li>
          </ul>
          <div class="text-center ml-1 mr-1" v-html="random_header">
            Did you know that the Novusphere team runs a moderated version of the forum at forum.novusphere.io?
          </div>
      </div>
      <div class="header-second">
        <div class="ml-3">
          <slot></slot>
          <div class="mt-1"></div>
        </div>
      </div>
    </div>
</template>

<script>
import ui from "@/ui";

import { MarkdownParser } from "@/markdown";

import { storage } from "@/storage";
import { DEFAULT_IDENTITY, ForgetIdentity, GetIdentity, GetEOS } from "@/eos";
import { GetNovusphere } from "@/novusphere";
import { forum } from "@/novusphere-forum";

export default {
  name: "HeaderSection",
  props: {
    load: {
      type: Function,
      required: false
    }
  },
  async mounted() {
    var header_text = ui.GetRandomHeaderText();
    this.random_header = new MarkdownParser(header_text).html;

    this.identity = await GetIdentity();
    window.addEventListener("identity", this.updateIdentity);
  },
  async beforeDestroy() {
    window.removeEventListener("identity", this.updateIdentity);
  },
  methods: {
    async updateIdentity() {
      this.identity = await GetIdentity();
      if (this.load) {
        this.load();
      }
    },
    async setIdentity(wait) {
      this.identity = await GetIdentity(wait);
    },
    async login() {
      this.identity = await GetIdentity(true);
      if (!this.identity.account) {
        alert(
          "Failed to find Scatter or get Scatter identity! Please see our FAQ!"
        );
      }
    },
    async logout() {
      await ForgetIdentity();
    }
  },
  computed: {
    subs() {
      return storage.subscribed_subs;
    }
  },
  data() {
    return {
      identity: DEFAULT_IDENTITY,
      eos_referendum: storage.eos_referendum,
      random_header: ""
    };
  }
};
</script>
