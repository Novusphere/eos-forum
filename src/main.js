// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from "vue"
import BootstrapVue from "bootstrap-vue"

import jQuery from "jquery";
window._jQuery = jQuery;


import { LoadStorage } from "@/storage"
import { LoadConstants } from "@/ui/constants"
import { GetTokensInfo } from "@/eos";

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
import { SaveStorage } from "./storage";

Vue.component('v-select', vSelect)
Vue.component('font-awesome-icon', FontAwesomeIcon);
Vue.use(BootstrapVue);
Vue.use(Meta);
Vue.use(VueAnalytics, {
  id: 'UA-131745808-1',
  router
})
Vue.config.productionTip = false;

(async function () {

  await LoadStorage();
  await LoadConstants();
  await GetTokensInfo(); // build cache

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
        sub: '',
      }
    },
    template: '<App/>'
  });

})();