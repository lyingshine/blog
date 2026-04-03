import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Article from '../views/Article.vue'
import About from '../views/About.vue'
import Login from '../views/Login.vue'
import WriteArticle from '../views/WriteArticle.vue'
import Moments from '../views/Moments.vue'
import Discovery from '../views/Discovery.vue'
import Admin from '../views/Admin.vue'
import DailyPlanner from '../views/DailyPlanner.vue'
import Messages from '../views/Messages.vue'
import AdminReports from '../views/AdminReports.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/article/:id',
    name: 'Article',
    component: Article
  },
  {
    path: '/about',
    name: 'About',
    component: About
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { guestOnly: true }
  },
  {
    path: '/write',
    name: 'WriteArticle',
    component: WriteArticle,
    meta: { requiresAuth: true }
  },
  {
    path: '/moments',
    name: 'Moments',
    component: Moments
  },
  {
    path: '/discovery',
    name: 'Discovery',
    component: Discovery
  },
  {
    path: '/messages',
    name: 'Messages',
    component: Messages
  },
  {
    path: '/admin',
    name: 'Admin',
    component: Admin,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/reports',
    name: 'AdminReports',
    component: AdminReports,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/planner',
    name: 'DailyPlanner',
    component: DailyPlanner
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0, left: 0 }
  }
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const refreshToken = localStorage.getItem('refreshToken')
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const hasSession = !!token || !!refreshToken

  if (to.meta.requiresAuth && !hasSession) {
    next('/login')
  } else if (to.meta.requiresAdmin && user?.role !== 'admin' && !(refreshToken && !user)) {
    next('/')
  } else if (to.meta.guestOnly && hasSession) {
    next('/')
  } else {
    next()
  }
})

export default router
