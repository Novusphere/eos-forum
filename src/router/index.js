import Vue from 'vue'
import Router from 'vue-router'
import Index from '@/components/Index'
import Watch from '@/components/Watch'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Index',
      component: Index
    },
    {
      path: '/watch/:id',
      name: 'Watch',
      component: Watch
    }
  ]
})
