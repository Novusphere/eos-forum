<template>
  <div class="container-fluid px-0">

    <!-- brand banner -->
    <div class="BrandBanner__Container" v-if="brand_banner">
      <div class="BrandBanner__Banner">
        <object class="BrandBanner__Image" v-if="brand_banner.endsWith('.svg')" :data="brand_banner" type="image/svg+xml"></object>
        <img v-else class="BrandBanner__Image" :src="brand_banner">
      </div>
    </div>

    <!-- featured subs at the top -->
    <div class="text-center d-none d-sm-block FeaturedSubs">
      <ul class="list-inline mb-0">
        <li v-for="sub in subs"
          :key="sub"
          class="list-inline-item">
          <router-link :to="'/e/' + sub">{{sub}}</router-link>
        </li>
      </ul>
    </div>

    <!-- header navigation -->
    <div class="HeaderNavigation">
      <div class="container py-2">
        <div class="row no-gutters">
          <div class="col-4 col-sm-6 col-md-6 col-lg-8 col-xl-8">

            <div class="d-inline-block px-2 px-lg-4">
              <router-link :to="{ name: 'Index' }">
                <img :src="brand_logo" style="height: 38px;">
              </router-link>
            </div>

            <div class="d-inline-block">
              <div class="dropdown">
                <button class="btn btn-outline-primary dropdown-toggle"
                  type="button"
                  id="sortBy"
                  data-toggle="dropdown">
                  <span class="d-none d-sm-inline-block"><slot name="topic"></slot></span>
                </button>
                <div class="dropdown-menu">
                  <router-link class="dropdown-item"
                    :to="{name: 'Index' }">
                    Home
                  </router-link>
                  <router-link v-if="eos_referendum"
                    class="dropdown-item"
                    :to="{name: 'Sub', params: { sub: 'referendum' } }">
                    Referendum
                  </router-link>
                  <router-link v-for="sub in subs"
                    :key="sub"
                    class="dropdown-item"
                    :to="{ name: 'Sub', params: { sub: sub } }">
                    e/{{ sub }}
                  </router-link>
                </div>
              </div>
            </div>
          </div>

          <div class="col-8 col-sm-6 col-md-6 col-lg-4 col-xl-4 text-right">
            <button class="btn btn-outline-primary mx-2 mx-lg-4 ConnectButton"
              v-if="!identity.account"
              v-on:click="login()">
              connect wallet
            </button>

            <div class="d-inline-block MenuIconButton">
              <router-link :to="{ name: 'StartThread', params: { sub: $route.params.sub ? $route.params.sub : 'all' } }">
                <font-awesome-icon :icon="['fas', 'pen']" ></font-awesome-icon>
              </router-link>
            </div>

            <div v-if="identity.account" class="d-inline-block MenuIconButton">
              <router-link :to="{ name: 'UserNotifications' }"
                :class="(identity.notifications>0) ? 'text-danger' : ''">
                <font-awesome-icon :icon="['fas', 'envelope']" ></font-awesome-icon>
                <span v-if="identity.notifications > 0">
                  {{ identity.notifications }}
                </span>
              </router-link>
            </div>

            <div v-if="identity.account" class="d-inline-block dropdown MenuIconButton">
              <a data-toggle="dropdown" href="#">
                  <font-awesome-icon :icon="['fas', 'user']" ></font-awesome-icon>
              </a>
              <ul class="dropdown-menu" role="menu">
                <li class="dropdown-item">
                  <router-link :to="{ name: 'UserProfile', params: { account: identity.account } }">
                      {{ identity.account }}
                  </router-link>
                </li>
                <li class="dropdown-item">
                    {{ identity.atmos }} ATMOS
                </li>
                <li v-if="brand_symbol != 'ATMOS'" class="dropdown-item">
                    {{ identity.token }} {{ brand_symbol }}
                </li>
                <li class="dropdown-item">
                    <a role="menuitem"
                      tabindex="-3"
                      href="javascript:void(0)"
                      v-on:click="logout()">
                      disconnect
                    </a>
                </li>
              </ul>
            </div>

            <div class="d-inline-block MenuIconButton">
              <router-link :to="{ name: 'Settings' }">
                <font-awesome-icon :icon="['fas', 'cog']" ></font-awesome-icon>
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- content block -->
    <section class="Content">
      <div class="container">
        <div class="row">
          <div class="col-12 col-lg-12 col-xl-12">
            <div class="mt-1 mb-1"></div>
            <slot name="content-full"></slot>
          </div>
        </div>

        <div class="row">
          <div class="col-0 col-lg-3 col-xl-3">
            <slot name="left_sidebar"></slot>
          </div>
          <div class="col-12 col-lg-6 col-xl-6">
            <slot name="content"></slot>
          </div>
          <div class="col-0 col-lg-3 col-xl-3">
            <slot name="right_sidebar"></slot>
          </div>
        </div>
      </div>
    </section>

    <footer class="container">
      <div class="row">
        <div class="col-12 pt-2">

          <p class="text-center">
            This is an experimental Reddit-style forum built on EOS by the <a href="https://novusphere.io">Novusphere Community</a>.
            <br/>
            Special thanks to
            <a href="https://www.eoscanada.com/">EOS Canada</a>,
            <a href="https://greymass.com/">Greymass</a>,
            <a href="https://www.genereos.io/">GenerEOS</a>,
            <a href="https://get-scatter.com/">Scatter</a>,
            <a href="https://eosflare.io/">EOS Flare</a>.
          </p>

          <p class="text-center">
              This site is hosted entirely from <a href="https://github.com/Novusphere/novusphere-eos/tree/gh-pages">GitHub Pages</a> and is fully <a href="https://github.com/Novusphere/novusphere-eos">open source</a>.
              <br/>
              The developers of this software take no responsibility for the content displayed.
              <br/>
              No images, files or media are hosted by the forum,
              <br/>
              please contact the respective site owners hosting content in breach of DMCA.
          </p>

          <div class="text-center">
            <img src="https://cdn.novusphere.io/static/atmos.svg" style="width: 12.5%">
            <img src="https://cdn.novusphere.io/static/eos3.svg" style="width: 12.5%">
          </div>

        </div>
      </div>
    </footer>
  </div>
</template>

<script>
import "@/assets/css/style2.css";
import "@/assets/css/custom.css";

import ui from "@/ui";
import { FORUM_BRAND } from "@/ui/constants";
import { storage } from "@/storage";
import { ForgetIdentity, GetIdentity, GetEOS } from "@/eos";
import { GetNovusphere } from "@/novusphere";

export default {
  name: "Layout",
  metaInfo() {
    return {
      title: FORUM_BRAND.title,
      link: [{ rel: "icon", href: this.brand_icon }],
      htmlAttrs: {
        lang: "en",
        amp: undefined // "amp" has no value
      }
    };
  },
  props: {
    load: {
      type: Function,
      required: false
    }
  },
  watch: {
    "$route.params.sub": function() {
      this.updateBrand();
    }
  },
  computed: {
    subs() {
      return storage.subscribed_subs;
    }
  },
  async mounted() {
    this.updateBrand();
    this.identity = await GetIdentity();
    window.addEventListener("identity", this.updateIdentity);
  },
  async beforeDestroy() {
    window.removeEventListener("identity", this.updateIdentity);
  },
  methods: {
    updateBrand() {
      ui.helpers.UpdateBrand(this.$route.params.sub);
      this.brand_logo = FORUM_BRAND.logo;
      this.brand_icon = FORUM_BRAND.icon;
      this.brand_symbol = FORUM_BRAND.token_symbol;
      this.brand_banner = FORUM_BRAND.banner;
    },
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
          "Failed to detect an EOS wallet! However, you can still post to the forum anonymously for free!"
        );
      }
    },
    async logout() {
      await ForgetIdentity();
    }
  },
  data() {
    return {
      eos_referendum: storage.eos_referendum,
      identity: {},
      brand_logo: "",
      brand_icon: "",
      brand_symbol: "",
      brand_banner: ""
    };
  }
};
</script>
