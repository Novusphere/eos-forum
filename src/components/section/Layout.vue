<template>
<div>
    <div class="container-fluid">
        <div class="tp-banner-container" v-if="brand_banner">
                <div class="tp-banner" >
                    <img :src="brand_banner">
                </div>
        </div>

        <div class="text-center headersubs d-none d-sm-block">
            <ul class="list-inline">
                <li v-for="sub in subs" :key="sub" class="list-inline-item"><router-link :to="'/e/' + sub">{{sub}}</router-link></li>
            </ul>
        </div>

        <div class="headernav">
            <div class="container">
                <div class="row">
                    <div class="col-xl-1 col-3 col-md-2 col-lg-2 logo "> 
                        <router-link :to="{ name: 'Index' }"><img :src="brand_logo" alt="" class="img-fluid"></router-link>
                    </div>
                    <div class="col-xl-3 col-9 col-md-5 col-lg-3 selecttopic">
                        <div class="dropdown d-inline-block">
                            <button class="btn btn-sm btn-outline-primary dropdown-toggle" type="button" id="sortBy" data-toggle="dropdown">
                                <slot name="topic"></slot>
                            </button>
                            <div class="dropdown-menu">
                                <router-link class="dropdown-item" :to="{name: 'Index' }">Home</router-link>
                                <router-link v-if="eos_referendum" class="dropdown-item" :to="{name: 'Sub', params: { sub: 'referendum' } }">Referendum</router-link>
                                <router-link v-for="sub in subs" :key="sub" class="dropdown-item" :to="{ name: 'Sub', params: { sub: sub } }">e/{{ sub }}</router-link>
                            </div>
                        </div>
                    </div>
                    <div class="col-xl-4 search col-lg-3 d-none d-md-block">
                        <div class="wrap">
                            <form v-if="false" action="#" method="post" class="form">
                                <div class="float-left txt">
                                    <input type="text" class="form-control" placeholder="Search Topics">
                                </div>
                                <div class="float-right">
                                    <button class="btn btn-secondary" type="button">
                                        <font-awesome-icon :icon="['fas', 'search']" ></font-awesome-icon>
                                    </button>
                                </div>
                                <div class="clearfix"></div>
                            </form>
                        </div>
                    </div>
                    <div class="col-xl-4 col-12 col-md-5 col-lg-4 avt">
                        <div v-if="identity.account" class="env float-left dropdown"> 
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
                                    <a role="menuitem" tabindex="-3" href="javascript:void(0)" v-on:click="logout()">disconnect</a>
                                </li>
                            </ul>
                        </div>
                        <div v-if="identity.account" class="env float-left">
                            <router-link :to="{ name: 'UserNotifications' }" :class="(identity.notifications>0) ? 'text-danger' : ''">
                                <font-awesome-icon :icon="['fas', 'envelope']" ></font-awesome-icon>
                                {{ identity.notifications }}
                            </router-link>
                        </div>
                        <div v-if="!identity.account" class="env float-left">
                            <button class="btn btn-sm btn-outline-primary" v-on:click="login()">connect wallet</button>
                        </div>
                        <div class="env float-left">
                            <router-link :to="{ name: 'Settings' }">
                                <font-awesome-icon :icon="['fas', 'cog']" ></font-awesome-icon>
                            </router-link>
                        </div>
                        <div class="clearfix"></div>
                    </div>
                </div>
            </div>
        </div>
        <section class="content">
            <div class="container">
                <div class="row">
                    <div class="col-xl-12 col-12 col-lg-12">
                        <div class="mt-1 mb-1"></div>
                        <slot name="content-full"></slot>
                    </div>
                </div>
            </div>
            <div class="container">
                <div class="row">
                    <div class="col-xl-8 col-lg-8">
                        <slot name="content"></slot>
                    </div>
                    <div class="col-xl-4 col-lg-4">
                        <slot name="sidebar"></slot>
                    </div>
                </div>
            </div>
        </section>
        <footer>
            <div class="container">
                <div class="row">
                    <div class="col-xl-12 col-12 col-md-12 ">
                        <p class="text-center">
                            This is an experimental Reddit-style forum built on EOS by the <a href="https://novusphere.io">Novusphere Community</a>.
                            Special thanks to <a href="https://www.eoscanada.com/">EOS Canada</a>, <a href="https://greymass.com/">Greymass</a>, <a href="https://www.genereos.io/">GenerEOS</a>, and <a href="https://get-scatter.com/">Scatter</a>.
                        </p> 
                        <p class="text-center">
                            This site is hosted entirely from <a href="https://github.com/Novusphere/novusphere-eos/tree/gh-pages">GitHub Pages</a> and is fully <a href="https://github.com/Novusphere/novusphere-eos">open source</a>.
                            The developers of this software take no responsibility for the content displayed.
                            No images, files or media are hosted by the forum, please contact the respective site owners hosting content in breach of DMCA.
                        </p>
                        <div class="row">
                            <div class="col-12">
                                <div class="text-center">
                                    <img src="https://cdn.novusphere.io/static/atmos.svg" style="width: 12.5%">
                                    <img src="https://cdn.novusphere.io/static/eos3.svg" style="width: 12.5%">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    </div>
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
