// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
//import 'babel-polyfill';

import Vue from "vue"
import BootstrapVue from "bootstrap-vue"
import postMixin from '@/mixins/post';
  
import jQuery from "jquery";
window._jQuery = jQuery;

import { InitStorage } from "@/storage"
import { LoadConstants } from "@/ui/constants"
import { GetTokensInfo } from "@/eos";
import { GetUserIcons } from "@/usericon";

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'
library.add(fas);
library.add(far);
library.add(fab);

import App from "@/App"
import router from '@/router'
import Meta from 'vue-meta'
import VueAnalytics from 'vue-analytics'
import vSelect from 'vue-select'

(async function () {

  // redirect to correct url
  if (window.__ROUTER_MODE__ == "history") {
    if (window.location.hash) {
      window.location.href = window.location.origin + window.location.hash.substring(1);
      return;
    }
  }

  Vue.component('v-select', vSelect);
  Vue.component('font-awesome-icon', FontAwesomeIcon);
  Vue.use(BootstrapVue);
  Vue.use(Meta);
  Vue.mixin(postMixin);


  var analytics = {
    id: 'UA-131745808-1',
    router
  };

  // only apply custom analytics if adblock detected
  const adBanner = document.getElementById('adBanner'); 
  if (!adBanner || adBanner.clientHeight == 0) {
    console.log('Ad-blocker detected');

    if (window.__ANALYTICS__) {
      analytics.customResourceURL = window.__ANALYTICS__;
    }
  }

  Vue.use(VueAnalytics, analytics)
  Vue.config.productionTip = false;

  await LoadConstants();
  await InitStorage(); // --> LoadStorage()
  await GetTokensInfo(); // build cache
  await GetUserIcons(); // load icon cache

  /* eslint-disable no-new */
  new Vue({
    el: '#app',
    router,
    components: { App },
    data() {
      return {
        icons: [],
        showSubs: true,
        showPreview: true,
        mode: 'normal',
      }
    },
    template: '<App/>'
  });

})();