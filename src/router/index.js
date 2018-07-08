import Vue from 'vue'
import Router from 'vue-router'
import Index from '@/components/Index'
import Watch from '@/components/Watch'
import Test from '@/components/Test'
import Thread from '@/components/Thread'

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
    },
    {
        path: '/test',
        name: 'Test',
        component: Test
    },
    {
        path: '/e/:sub/:id',
        name: 'Thread',
        component: Thread
    }
  ]
})
