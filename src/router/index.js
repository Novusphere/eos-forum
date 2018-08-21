import Vue from 'vue'
import Router from 'vue-router'
import Index from '@/components/Index'
import Test from '@/components/Test'
import Thread from '@/components/Thread'
import UserProfile from '@/components/UserProfile'

Vue.use(Router)

export default new Router({
  routes: [
    { // default route
      path: '/',
      name: 'Index',
      component: Index
    },
    {
      path: '/e/:sub?',
      name: 'Sub',
      component: Index
    },
    {
      path: '/e/:sub/:id/:child_id?',
      name: 'Thread',
      component: Thread
    },
    {
      path: '/u/:account',
      name: 'UserProfile',
      component: UserProfile
    },
    {
        path: '/test',
        name: 'Test',
        component: Test
    }
  ]
})
