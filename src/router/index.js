import Vue from 'vue';
import Router from 'vue-router';

import Home from '@/components/Home';
import Test from '@/components/Test';
import Thread from '@/components/Thread';
import UserProfile from '@/components/UserProfile';
import Referendum from '@/components/Referendum';
import Tag from "@/components/Tag";

Vue.use(Router)

export default new Router({
  routes: [
    { // default route
      path: '/',
      name: 'Index',
      component: Home
    },
    {
      path: '/e/:sub?',
      name: 'Sub',
      component: Home
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
      path: '/tag/:tag',
      name: "Tag",
      component: Tag
    }
    /*{
      path: '/referendum',
      name: 'Referendum',
      component: Referendum
    },
    {
        path: '/test',
        name: 'Test',
        component: Test
    }*/
  ]
})
