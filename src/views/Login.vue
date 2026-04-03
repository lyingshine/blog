<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-header">
        <div class="auth-logo">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <h1 class="auth-title">{{ isLogin ? '欢迎回来' : '创建账户' }}</h1>
        <p class="auth-subtitle">{{ isLogin ? '登录后继续记录与分享' : '注册后开启你的个人内容空间' }}</p>
      </div>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label class="form-label">用户名</label>
          <div class="form-input-wrapper">
            <input v-model="form.username" type="text" class="form-input" placeholder="请输入用户名" required />
          </div>
        </div>

        <div v-if="!isLogin" class="form-group">
          <label class="form-label">邮箱</label>
          <div class="form-input-wrapper">
            <input v-model="form.email" type="email" class="form-input" placeholder="请输入邮箱" required />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">密码</label>
          <div class="form-input-wrapper">
            <input v-model="form.password" :type="showPassword ? 'text' : 'password'" class="form-input" placeholder="请输入密码" required />
            <button type="button" class="password-toggle" @click="showPassword = !showPassword">{{ showPassword ? '隐藏' : '显示' }}</button>
          </div>
        </div>

        <Transition name="fade">
          <div v-if="error" class="form-error">{{ error }}</div>
        </Transition>

        <button type="submit" class="submit-btn" :disabled="loading">
          <span v-if="loading" class="loading-spinner"></span>
          <span v-else>{{ isLogin ? '登录' : '注册' }}</span>
        </button>
      </form>

      <div class="auth-switch">
        <span>{{ isLogin ? '还没有账户？' : '已有账户？' }}</span>
        <button type="button" class="switch-btn" @click="toggleMode">{{ isLogin ? '立即注册' : '立即登录' }}</button>
      </div>

      <div class="demo-hint">
        <p>示例账户：admin / admin123</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const isLogin = ref(true)
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

const form = ref({
  username: '',
  email: '',
  password: ''
})

const toggleMode = () => {
  isLogin.value = !isLogin.value
  error.value = ''
  form.value = { username: '', email: '', password: '' }
}

const handleSubmit = async () => {
  error.value = ''
  loading.value = true

  try {
    if (isLogin.value) {
      await authStore.login(form.value.username, form.value.password)
    } else {
      await authStore.register(form.value.username, form.value.email, form.value.password)
    }
    router.push('/')
  } catch (err) {
    error.value = err.message || '操作失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page { min-height: calc(100vh - 48px); display: flex; align-items: center; justify-content: center; padding: 40px 20px; }
.auth-container { width: 100%; max-width: 400px; background: var(--color-surface); border-radius: var(--radius-xl); padding: 40px; box-shadow: var(--shadow-lg); border: 1px solid var(--color-border-light); }
.auth-header { text-align: center; margin-bottom: 32px; }
.auth-logo { display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; background: var(--color-accent); border-radius: 14px; color: white; margin-bottom: 20px; }
.auth-title { font-size: 24px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 8px; }
.auth-subtitle { font-size: 15px; color: var(--color-text-secondary); }
.auth-form { display: flex; flex-direction: column; gap: 20px; }
.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-label { font-size: 14px; font-weight: 500; color: var(--color-text-primary); }
.form-input-wrapper { position: relative; display: flex; align-items: center; }
.form-input { width: 100%; height: 48px; padding: 0 14px; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 15px; color: var(--color-text-primary); transition: all 0.2s ease; }
.form-input:focus { outline: none; border-color: var(--color-accent); box-shadow: 0 0 0 3px var(--color-accent-subtle); }
.password-toggle { position: absolute; right: 12px; border: none; background: transparent; color: var(--color-text-tertiary); }
.form-error { padding: 12px 14px; background: rgba(239, 68, 68, 0.1); border-radius: var(--radius-md); color: #ef4444; font-size: 14px; }
.submit-btn { width: 100%; height: 48px; background: var(--color-accent); color: white; border: none; border-radius: var(--radius-md); font-size: 16px; font-weight: 600; display: flex; align-items: center; justify-content: center; }
.submit-btn:disabled { opacity: .7; }
.loading-spinner { width: 20px; height: 20px; border: 2px solid rgba(255, 255, 255, 0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; }
.auth-switch { text-align: center; margin-top: 24px; font-size: 14px; color: var(--color-text-secondary); }
.switch-btn { border: none; background: transparent; color: var(--color-accent); margin-left: 4px; }
.demo-hint { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--color-border-light); }
.demo-hint p { font-size: 13px; color: var(--color-text-tertiary); }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
