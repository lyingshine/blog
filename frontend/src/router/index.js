import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Article from '../views/Article.vue'
import Category from '../views/Category.vue'
import About from '../views/About.vue'
import Login from '../views/Login.vue'
import Admin from '../views/Admin.vue'
import CreatePost from '../views/CreatePost.vue'
import MyPosts from '../views/MyPosts.vue'
import Trash from '../views/Trash.vue'
import Profile from '../views/Profile.vue'
import Inspirations from '../views/Inspirations.vue'
import { useAuthStore } from '../stores/auth.store'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/article/:id',
    name: 'Article',
    component: Article,
    props: true
  },
  {
    path: '/category/:name',
    name: 'Category',
    component: Category,
    props: true
  },
  {
    path: '/about',
    name: 'About',
    component: About
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/admin',
    name: 'Admin',
    component: Admin,
    meta: { requiresAuth: true }
  },
  {
    path: '/create',
    name: 'CreatePost',
    component: CreatePost,
    meta: { requiresAuth: true }
  },
  {
    path: '/edit/:id',
    name: 'EditPost',
    component: CreatePost,
    props: true,
    meta: { requiresAuth: true }
  },
  {
    path: '/my-posts',
    name: 'MyPosts',
    component: MyPosts,
    meta: { requiresAuth: true }
  },
  {
    path: '/trash',
    name: 'Trash',
    component: Trash,
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true }
  },
  {
    path: '/inspirations',
    name: 'Inspirations',
    component: Inspirations
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // 检查路由是否需要认证
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.name === 'Login' && authStore.isAuthenticated) {
    // 已登录用户访问登录页面时重定向到首页
    next('/')
  } else {
    next()
  }
})

export default router