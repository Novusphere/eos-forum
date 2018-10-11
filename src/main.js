// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from "vue"
import BootstrapVue from "bootstrap-vue"

import jQuery from "jquery";
window._jQuery = jQuery;

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'
library.add(fas);
library.add(fab);

import App from "@/App"
import router from '@/router'
import { LoadStorage } from "@/storage"

Vue.component('font-awesome-icon', FontAwesomeIcon);
Vue.use(BootstrapVue);

Vue.config.productionTip = false;

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>'
});