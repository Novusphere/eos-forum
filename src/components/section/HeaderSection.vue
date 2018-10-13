<template>
    <div>
      <div class="header">
          <ul class="list-inline mb-0">
            <li v-if="!identity.account" class="list-inline-item">
              <a v-on:click="login()" href="javascript:void(0)">login</a>
            </li>
            <li v-if="identity.account" class="list-inline-item">
              <router-link :to="'/u/' + identity.account" class="text-highlight">
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
              <router-link :to="'/referendum'" class="text-highlight">eos-referendum</router-link>
            </li>
            <li class="list-inline-item">
              <a href="#faq" data-toggle="modal">faq/help</a>
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
import {
  DEFAULT_IDENTITY,
  ForgetScatterIdentity,
  GetScatterIdentity,
  GetScatter,
  GetEOS,
  SetOnIdentityUpdate
} from "@/eos";
import { GetNovusphere } from "@/novusphere";
import { forum } from "@/novusphere-forum";

var _lastIdentityUpdate = 0;
SetOnIdentityUpdate(async function(_identity) {
  var now = new Date().getTime();
  if (now - _lastIdentityUpdate >= 1000) {
    _lastIdentityUpdate = now;

    const eos = GetEOS();
    var atmos = parseFloat(
      (await eos.getCurrencyBalance(
        "novusphereio",
        _identity.account,
        "ATMOS"
      ))[0]
    );
    atmos = (isNaN(atmos) ? 0 : atmos).toFixed(3);

    _identity.atmos = atmos;

    const novusphere = GetNovusphere();
    const notifications = (await novusphere.api({
      aggregate: novusphere.config.collection,
      maxTimeMS: 1000,
      cursor: {},
      pipeline: [
        { $match: forum.match_notifications(_identity.account, storage.last_notification) },
        { $count: "n" }
      ]
    })).cursor.firstBatch;

    _identity.notifications = (notifications.length>0) ? notifications[0].n : 0;
  }
});

export default {
  name: "HeaderSection",
  props: {
    load: {
      type: Function,
      required: false
    }
  },
  async mounted() {
    await this.setIdentity();
    window.addEventListener('identity', this.setIdentity);
  },
  async beforeDestroy() {
    window.removeEventListener('identity', this.setIdentity);
  },
  methods: {
    async setIdentity(wait) {
      this.identity = await GetScatterIdentity(wait);
    },
    async login() {
      await this.setIdentity(true);
      if (this.identity.account) {
        if (this.load) {
          this.load();
        }
      } else {
        alert(
          "Failed to find Scatter or get Scatter identity! Please see our FAQ!"
        );
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
      identity: DEFAULT_IDENTITY,
      eos_referendum: storage.eos_referendum
    };
  }
};
</script>
