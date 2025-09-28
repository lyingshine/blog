import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'
import logger from '../utils/logger'

// 懒加载组件 - 代码分割
const Home = () => import('../views/Home.vue')
const Article = () => import('../views/Article.vue')
const Articles = () => import('../views/Articles.vue')
const Category = () => import('../views/Category.vue')

const Login = () => import('../views/Login.vue')

// 管理员相关页面 - 单独的 chunk
const Admin = () => import('../views/Admin.vue')
const CreatePost = () => import('../views/CreatePost.vue')
const MyPosts = () => import('../views/MyPosts.vue')
const Trash = () => import('../views/Trash.vue')
const Profile = () => import('../views/Profile.vue')

// 其他功能页面
const Inspirations = () => import('../views/Inspirations.vue')

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/articles',
    name: 'Articles',
    component: Articles
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
  
  // 确保认证状态已初始化
  if (!authStore.initialized.value) {
    logger.debug('等待认证状态初始化...')
    await authStore.initAuth()
  }
  
  // 路由调试信息
  logger.route(from.name || 'unknown', to.name || 'unknown', {
    isAuthenticated: authStore.isAuthenticated.value,
    requiresAuth: to.meta.requiresAuth
  })
  
  // 检查路由是否需要认证
  if (to.meta.requiresAuth && !authStore.isAuthenticated.value) {
    logger.warn('需要认证但未登录，重定向到登录页')
    next('/login')
  } else if (to.name === 'Login' && authStore.isAuthenticated.value) {
    // 已登录用户访问登录页面时重定向到首页
    logger.debug('已登录用户访问登录页，重定向到首页')
    next('/')
  } else {
    logger.debug('路由检查通过，允许访问')
    next()
  }
})

export default router