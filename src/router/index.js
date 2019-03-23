import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

window.__ROUTER_MODE__ = window.__ROUTER_MODE__ || "hash";
window.__PRE_ROUTE__ = (window.__ROUTER_MODE__ == "hash") ? "#" : "";

const router = new Router({
  mode: window.__ROUTER_MODE__,
  routes: [
    { // default route
      path: '/',
      name: 'Index',
      component: () => import('@/components/Home')
    },
    { // default route
      path: '/feed',
      name: 'Feed',
      component: () => import('@/components/Feed')
    },
    {
      path: '/e/:sub?',
      name: 'Sub',
      component: () => import('@/components/Home')
    },
    {
      path: '/e/:sub/new',
      name: 'StartThread',
      component: () => import('@/components/StartThread')
    },
    {
      path: '/e/:sub/edit/:edit_id',
      name: 'EditThread',
      component: () => import('@/components/StartThread')
    },
    {
      path: '/e/:sub/:id/:title?/:child_id?',
      name: 'Thread',
      component: () => import('@/components/Thread')
    },
    {
      path: '/history/:id',
      name: 'History',
      component: ()=> import('@/components/History')
    },
    {
      path: '/settings',
      name: 'Settings',
      component: () => import('@/components/Settings')
    },
    {
      path: '/u/:account',
      name: 'UserProfile',
      component: () => import('@/components/UserProfile')
    },
    {
      path: '/tag/:tag',
      name: "Tag",
      component: () => import('@/components/Tag')
    },
    {
      path: '/setID',
      name: "setID",
      component: () => import('@/components/SetID'),
    },
    {
      path: '/notifications',
      name: 'UserNotifications',
      component: () => import('@/components/UserNotifications')
    },
    {
      path: '/test',
      name: 'Test',
      component: () => import('@/components/Test')
    }
  ]
});

router.beforeEach((to, from, next) => {
  window.scrollTo(0,0);
  next();
});

export default router;