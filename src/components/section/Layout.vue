<template>
  <div class="container-fluid px-0">

    <!-- brand banner -->
    <div class="BrandBanner__Container" v-if="brand_banner">
      <div class="BrandBanner__Banner">
        <object class="BrandBanner__Image" v-if="brand_banner.endsWith('.svg')" :data="brand_banner" type="image/svg+xml"></object>
        <img v-else class="BrandBanner__Image" :src="brand_banner">
      </div>
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

            <div class="d-none d-sm-inline-block sub">
              <template v-if="$route.params.sub" >
                {{ $route.params.sub }}
              </template>
              <template v-else>
                Home
              </template>
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
                <li v-if="brand_symbol && (brand_symbol != 'ATMOS')" class="dropdown-item">
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
            <div class="sidebarblock">
              <font-awesome-icon
                @click="toggleSubs()"
                class="sub-toggle"
                :icon="['fas', $root.showSubs ? 'minus-square' : 'plus-square']" />
              <router-link class="dropdown-item"
                :to="{name: 'Index' }">
                Home
              </router-link>
              <router-link v-if="eos_referendum"
                class="dropdown-item"
                :to="{name: 'Sub', params: { sub: 'referendum' } }">
                Referendum
              </router-link>
              <div class="divline" />
              <router-link v-for="s in subs"
                v-show="$root.showSubs"
                :key="s.sub"
                class="dropdown-item"
                :to="{ name: 'Sub', params: { sub: s.sub } }">
                e/{{ s.sub }}
                <img v-if="s.logo" :src="s.logo" style="max-width:24px">
              </router-link>
            </div>
          </div>
          <div class="col-12 col-lg-6 col-xl-6">
            <slot name="content"></slot>
          </div>
          <div class="col-0 col-lg-3 col-xl-3">
            <div v-if="noRightBar" class="sidebarblock">
              <recently-visited></recently-visited>
            </div>
            <slot v-else name="right_sidebar" />
          </div>
        </div>
      </div>
    </section>

    <footer class="container">
      <div class="row">
        <div class="col-12 pt-2">

          <p class="text-center" style="font-size: 20px">
            <ul class="list-inline">
              <li class="list-inline-item"><a target="_blank" href="https://discord.gg/PtXzUVr"><font-awesome-icon :icon="['fab', 'discord']" ></font-awesome-icon></a></li>
              <li class="list-inline-item"><a target="_blank" href="https://www.youtube.com/channel/UCEHErggJuJJWDuBEoyLiRVQ"><font-awesome-icon :icon="['fab', 'youtube']" ></font-awesome-icon></a></li>
              <li class="list-inline-item"><a target="_blank" href="https://twitter.com/thenovusphere"><font-awesome-icon :icon="['fab', 'twitter']" ></font-awesome-icon></a></li>
              <li class="list-inline-item"><a target="_blank" href="https://medium.com/@thenovusphere/"><font-awesome-icon :icon="['fab', 'medium']" ></font-awesome-icon></a></li>
              <li class="list-inline-item"><a target="_blank" href="https://github.com/Novusphere"><font-awesome-icon :icon="['fab', 'github']" ></font-awesome-icon></a></li>
              <li class="list-inline-item"><a target="_blank" href="https://t.me/atmosforum"><font-awesome-icon :icon="['fab', 'telegram']" ></font-awesome-icon></a></li>
            </ul>
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

          <p class="text-center">
            <strong>Partners</strong>
            <ul class="list-inline">
              <li class="list-inline-item"><router-link :to="{ name: 'Sub', params: { sub: 'eoscafe' } }"><img src="https://cdn.discordapp.com/attachments/522320367293825036/522320438161047552/icon-1.png" width="60">EOS Cafe</router-link></li>
              <li class="list-inline-item"><router-link :to="{ name: 'Sub', params: { sub: 'pixeos' } }"><img src="https://raw.githubusercontent.com/eoscafe/eos-airdrops/master/logos/pixeos.png" width="60">pixEOS</router-link></li>
            </ul>
          </p>

          <div class="text-center">
            <img src="https://cdn.novusphere.io/static/atmos.svg" style="width: 12.5%">
            <img src="https://cdn.novusphere.io/static/eos3.svg" style="width: 12.5%">
          </div>

          <p class="text-center">
            <strong>Special Thanks</strong>
            <ul class="list-inline">
              <li class="list-inline-item"><a target="_blank" href="https://www.eoscanada.com/">EOS Canada</a></li>
              <li class="list-inline-item"><a target="_blank" href="https://greymass.com/">Greymass</a></li>
              <li class="list-inline-item"><a target="_blank" href="https://www.genereos.io/">GenerEOS</a></li>
              <li class="list-inline-item"><a target="_blank" href="https://get-scatter.com/">Scatter</a></li>
              <li class="list-inline-item"><a target="_blank" href="https://eoslynx.com/">EOS Lynx</a></li>
              <li class="list-inline-item"><a target="_blank" href="https://eosflare.io/">EOS Flare</a></li>
            </ul>
          </p>

        </div>
      </div>
    </footer>
  </div>
</template>

<script>
import "@/assets/css/style2.css";
import "@/assets/css/custom.css";

import ui from "@/ui";
import { BRANDS, FORUM_BRAND } from "@/ui/constants";
import { storage } from "@/storage";
import { ForgetIdentity, GetIdentity, GetEOS } from "@/eos";
import { GetNovusphere } from "@/novusphere";
import RecentlyVisited from "@/components/core/RecentlyVisited";

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
  components: {
    RecentlyVisited
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
      var subs = storage.subscribed_subs.map(s => ({
        sub: s,
        logo: ""
      }));

      for (var i = 0; i < subs.length; i++) {
        const brand = BRANDS[subs[i].sub];
        if (brand) {
          subs[i].logo = brand.logo;
        }
      }

      return subs;
    },
    noRightBar() {
      return !this.$slots["right_sidebar"];
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
          "Failed to detect a compatible EOS wallet!" +
            " If your wallet is open, and we failed to detect it try refreshing the page." +
            " However if you don't have a compatible EOS wallet, you can still post to the forum anonymously for free!"
        );
      }
    },
    async logout() {
      await ForgetIdentity();
    },
    toggleSubs() {
      this.$root.showSubs = !this.$root.showSubs;
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

<style scoped>
.sub {
  text-transform: capitalize;
  font-size: 18px;
  color: black;
}
.sub-toggle:hover {
  cursor: pointer;
}
.sub-toggle {
  position: absolute;
  right: 0;
  top: 0;
  height: 58px;
  width: 50px;
  padding: 10px;
  background-color: white;
}
</style>