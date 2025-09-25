<template>
  <div class="auth-page">
    <div class="auth-container">
      <!-- Background Elements -->
      <div class="auth-background">
        <div class="bg-shape shape-1"></div>
        <div class="bg-shape shape-2"></div>
        <div class="bg-shape shape-3"></div>
        <div class="bg-particles">
          <div class="particle" v-for="i in 20" :key="i"></div>
        </div>
      </div>

      <!-- Auth Card -->
      <div class="auth-card">
        <!-- Header -->
        <div class="auth-header">
          <div class="auth-logo">
            <div class="logo-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
              </svg>
            </div>
            <span class="logo-text">Vue Blog</span>
          </div>
          
          <div class="auth-title">
            <h1>{{ isLogin ? '欢迎回来' : '加入我们' }}</h1>
            <p>{{ isLogin ? '登录到你的账户继续创作' : '创建账户开始你的创作之旅' }}</p>
          </div>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="auth-form">
          <!-- Username Field -->
          <div class="form-group">
            <label for="username" class="form-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              用户名
            </label>
            <div class="input-wrapper">
              <input
                id="username"
                v-model="form.username"
                type="text"
                class="form-input"
                :class="{ 'error': errors.username }"
                placeholder="输入你的用户名"
                required
              />
              <div v-if="form.username" class="input-status">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20,6 9,17 4,12"/>
                </svg>
              </div>
            </div>
            <div v-if="errors.username" class="error-message">{{ errors.username }}</div>
          </div>

          <!-- Email Field (Register only) -->
          <div v-if="!isLogin" class="form-group">
            <label for="email" class="form-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              邮箱地址
            </label>
            <div class="input-wrapper">
              <input
                id="email"
                v-model="form.email"
                type="email"
                class="form-input"
                :class="{ 'error': errors.email }"
                placeholder="输入你的邮箱地址"
                required
              />
              <div v-if="form.email && isValidEmail(form.email)" class="input-status">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20,6 9,17 4,12"/>
                </svg>
              </div>
            </div>
            <div v-if="errors.email" class="error-message">{{ errors.email }}</div>
          </div>

          <!-- Password Field -->
          <div class="form-group">
            <label for="password" class="form-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <circle cx="12" cy="16" r="1"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              密码
            </label>
            <div class="input-wrapper">
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                class="form-input"
                :class="{ 'error': errors.password }"
                :placeholder="isLogin ? '输入你的密码' : '创建一个安全的密码'"
                required
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="password-toggle"
              >
                <svg v-if="showPassword" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
            <div v-if="errors.password" class="error-message">{{ errors.password }}</div>
            <div v-if="!isLogin && form.password" class="password-strength">
              <div class="strength-bar">
                <div class="strength-fill" :class="passwordStrength.class" :style="{ width: passwordStrength.width }"></div>
              </div>
              <span class="strength-text">{{ passwordStrength.text }}</span>
            </div>
          </div>

          <!-- Confirm Password (Register only) -->
          <div v-if="!isLogin" class="form-group">
            <label for="confirmPassword" class="form-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <circle cx="12" cy="16" r="1"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              确认密码
            </label>
            <div class="input-wrapper">
              <input
                id="confirmPassword"
                v-model="form.confirmPassword"
                type="password"
                class="form-input"
                :class="{ 'error': errors.confirmPassword }"
                placeholder="再次输入密码"
                required
              />
              <div v-if="form.confirmPassword && form.password === form.confirmPassword" class="input-status">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20,6 9,17 4,12"/>
                </svg>
              </div>
            </div>
            <div v-if="errors.confirmPassword" class="error-message">{{ errors.confirmPassword }}</div>
          </div>

          <!-- Submit Button -->
          <button type="submit" class="submit-btn" :disabled="loading">
            <div v-if="loading" class="btn-spinner"></div>
            <svg v-else-if="isLogin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10,17 15,12 10,7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
              <line x1="20" y1="8" x2="20" y2="14"/>
              <line x1="23" y1="11" x2="17" y2="11"/>
            </svg>
            {{ loading ? '处理中...' : (isLogin ? '登录' : '注册') }}
          </button>
        </form>

        <!-- Toggle Mode -->
        <div class="auth-toggle">
          <p>
            {{ isLogin ? '还没有账户？' : '已经有账户了？' }}
            <button @click="toggleMode" class="toggle-btn">
              {{ isLogin ? '立即注册' : '立即登录' }}
            </button>
          </p>
        </div>

        <!-- Features -->
        <div class="auth-features">
          <div class="feature-item">
            <div class="feature-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </div>
            <span>自由创作</span>
          </div>
          <div class="feature-item">
            <div class="feature-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <span>社区互动</span>
          </div>
          <div class="feature-item">
            <div class="feature-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <span>数据安全</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useAuth } from '../composables/useAuth'

export default {
  name: 'Login',
  data() {
    return {
      isLogin: true,
      loading: false,
      showPassword: false,
      form: {
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      },
      errors: {}
    }
  },
  setup() {
    const { login } = useAuth()
    return {
      login
    }
  },
  computed: {
    passwordStrength() {
      const password = this.form.password
      if (!password) return { width: '0%', class: '', text: '' }
      
      let score = 0
      if (password.length >= 8) score++
      if (/[a-z]/.test(password)) score++
      if (/[A-Z]/.test(password)) score++
      if (/[0-9]/.test(password)) score++
      if (/[^A-Za-z0-9]/.test(password)) score++
      
      const levels = [
        { width: '20%', class: 'weak', text: '很弱' },
        { width: '40%', class: 'weak', text: '较弱' },
        { width: '60%', class: 'medium', text: '中等' },
        { width: '80%', class: 'strong', text: '较强' },
        { width: '100%', class: 'strong', text: '很强' }
      ]
      
      return levels[score - 1] || levels[0]
    }
  },
  methods: {
    toggleMode() {
      this.isLogin = !this.isLogin
      this.clearForm()
      this.errors = {}
    },
    
    clearForm() {
      this.form = {
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      }
    },
    
    validateForm() {
      this.errors = {}
      
      if (!this.form.username.trim()) {
        this.errors.username = '请输入用户名'
      } else if (this.form.username.length < 3) {
        this.errors.username = '用户名至少需要3个字符'
      }
      
      if (!this.isLogin) {
        if (!this.form.email.trim()) {
          this.errors.email = '请输入邮箱地址'
        } else if (!this.isValidEmail(this.form.email)) {
          this.errors.email = '请输入有效的邮箱地址'
        }
      }
      
      if (!this.form.password) {
        this.errors.password = '请输入密码'
      } else if (!this.isLogin && this.form.password.length < 6) {
        this.errors.password = '密码至少需要6个字符'
      }
      
      if (!this.isLogin) {
        if (!this.form.confirmPassword) {
          this.errors.confirmPassword = '请确认密码'
        } else if (this.form.password !== this.form.confirmPassword) {
          this.errors.confirmPassword = '两次输入的密码不一致'
        }
      }
      
      return Object.keys(this.errors).length === 0
    },
    
    isValidEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(email)
    },
    
    async handleSubmit() {
      if (!this.validateForm()) return
      
      this.loading = true
      
      try {
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        if (this.isLogin) {
          // 登录逻辑
          const users = JSON.parse(localStorage.getItem('blog_users') || '[]')
          const user = users.find(u => u.username === this.form.username && u.password === this.form.password)
          
          if (user) {
            this.login(user)
            this.$router.push('/')
          } else {
            this.errors.password = '用户名或密码错误'
          }
        } else {
          // 注册逻辑
          const users = JSON.parse(localStorage.getItem('blog_users') || '[]')
          
          if (users.find(u => u.username === this.form.username)) {
            this.errors.username = '用户名已存在'
            return
          }
          
          if (users.find(u => u.email === this.form.email)) {
            this.errors.email = '邮箱已被注册'
            return
          }
          
          const newUser = {
            id: Date.now(),
            username: this.form.username,
            email: this.form.email,
            password: this.form.password,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.form.username}`,
            createdAt: new Date().toISOString()
          }
          
          users.push(newUser)
          localStorage.setItem('blog_users', JSON.stringify(users))
          
          this.login(newUser)
          this.$router.push('/')
        }
      } catch (error) {
        console.error('认证失败:', error)
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

.auth-container {
  width: 100%;
  max-width: 480px;
  margin: var(--space-xl);
  position: relative;
  z-index: 10;
}

/* Background Elements */
.auth-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.bg-shape {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  animation: float 8s ease-in-out infinite;
}

.shape-1 {
  width: 300px;
  height: 300px;
  top: -150px;
  right: -150px;
  animation-delay: 0s;
}

.shape-2 {
  width: 200px;
  height: 200px;
  bottom: -100px;
  left: -100px;
  animation-delay: 2s;
}

.shape-3 {
  width: 150px;
  height: 150px;
  top: 50%;
  left: -75px;
  animation-delay: 4s;
}

.bg-particles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  animation: particle 6s linear infinite;
}

.particle:nth-child(odd) {
  animation-duration: 8s;
}

.particle:nth-child(even) {
  animation-duration: 10s;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-30px) rotate(180deg); }
}

@keyframes particle {
  0% {
    transform: translateY(100vh) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100px) rotate(360deg);
    opacity: 0;
  }
}

/* Auth Card */
.auth-card {
  background: var(--color-white);
  border-radius: var(--radius-2xl);
  padding: var(--space-3xl);
  box-shadow: var(--shadow-xl);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
}

.auth-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-accent) 100%);
}

/* Header */
.auth-header {
  text-align: center;
  margin-bottom: var(--space-3xl);
}

.auth-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
}

.logo-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%);
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-white);
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-gray-900);
}

.auth-title h1 {
  font-size: 2rem;
  font-weight: 800;
  color: var(--color-gray-900);
  margin-bottom: var(--space-sm);
}

.auth-title p {
  color: var(--color-gray-600);
  font-size: 1rem;
  margin: 0;
}

/* Form */
.auth-form {
  margin-bottom: var(--space-xl);
}

.form-group {
  margin-bottom: var(--space-xl);
}

.form-label {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-weight: 600;
  color: var(--color-gray-700);
  margin-bottom: var(--space-sm);
  font-size: 0.875rem;
}

.input-wrapper {
  position: relative;
}

.form-input {
  width: 100%;
  padding: var(--space-md) var(--space-lg);
  border: 2px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  font-size: 1rem;
  transition: var(--transition-fast);
  background: var(--color-gray-50);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  background: var(--color-white);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.form-input.error {
  border-color: var(--color-error);
  background: #fef2f2;
}

.input-status {
  position: absolute;
  right: var(--space-md);
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-success);
}

.password-toggle {
  position: absolute;
  right: var(--space-md);
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--color-gray-400);
  cursor: pointer;
  padding: var(--space-xs);
  border-radius: var(--radius-md);
  transition: var(--transition-fast);
}

.password-toggle:hover {
  color: var(--color-primary);
  background: var(--color-gray-100);
}

.error-message {
  color: var(--color-error);
  font-size: 0.875rem;
  margin-top: var(--space-xs);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.error-message::before {
  content: '⚠';
  font-size: 0.75rem;
}

/* Password Strength */
.password-strength {
  margin-top: var(--space-sm);
}

.strength-bar {
  height: 4px;
  background: var(--color-gray-200);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: var(--space-xs);
}

.strength-fill {
  height: 100%;
  transition: var(--transition-normal);
  border-radius: 2px;
}

.strength-fill.weak {
  background: var(--color-error);
}

.strength-fill.medium {
  background: var(--color-warning);
}

.strength-fill.strong {
  background: var(--color-success);
}

.strength-text {
  font-size: 0.75rem;
  color: var(--color-gray-500);
}

/* Submit Button */
.submit-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-lg);
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%);
  color: var(--color-white);
  border: none;
  border-radius: var(--radius-lg);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);
  position: relative;
  overflow: hidden;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid var(--color-white);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Toggle Mode */
.auth-toggle {
  text-align: center;
  margin-bottom: var(--space-xl);
}

.auth-toggle p {
  color: var(--color-gray-600);
  margin: 0;
}

.toggle-btn {
  background: none;
  border: none;
  color: var(--color-primary);
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.toggle-btn:hover {
  color: var(--color-primary-hover);
}

/* Features */
.auth-features {
  display: flex;
  justify-content: space-around;
  padding-top: var(--space-xl);
  border-top: 1px solid var(--color-gray-200);
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  text-align: center;
}

.feature-icon {
  width: 40px;
  height: 40px;
  background: var(--color-primary-light);
  color: var(--color-primary);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.feature-item span {
  font-size: 0.875rem;
  color: var(--color-gray-600);
  font-weight: 500;
}

/* Responsive */
@media (max-width: 768px) {
  .auth-container {
    margin: var(--space-lg);
  }
  
  .auth-card {
    padding: var(--space-2xl);
  }
  
  .auth-title h1 {
    font-size: 1.75rem;
  }
  
  .auth-features {
    flex-direction: column;
    gap: var(--space-lg);
  }
  
  .feature-item {
    flex-direction: row;
    justify-content: flex-start;
    text-align: left;
  }
}

@media (max-width: 480px) {
  .auth-container {
    margin: var(--space-md);
  }
  
  .auth-card {
    padding: var(--space-xl);
  }
  
  .logo-text {
    display: none;
  }
}

/* Particle positioning */
.particle:nth-child(1) { left: 10%; animation-delay: 0s; }
.particle:nth-child(2) { left: 20%; animation-delay: 1s; }
.particle:nth-child(3) { left: 30%; animation-delay: 2s; }
.particle:nth-child(4) { left: 40%; animation-delay: 3s; }
.particle:nth-child(5) { left: 50%; animation-delay: 4s; }
.particle:nth-child(6) { left: 60%; animation-delay: 5s; }
.particle:nth-child(7) { left: 70%; animation-delay: 6s; }
.particle:nth-child(8) { left: 80%; animation-delay: 7s; }
.particle:nth-child(9) { left: 90%; animation-delay: 8s; }
.particle:nth-child(10) { left: 15%; animation-delay: 9s; }
.particle:nth-child(11) { left: 25%; animation-delay: 10s; }
.particle:nth-child(12) { left: 35%; animation-delay: 11s; }
.particle:nth-child(13) { left: 45%; animation-delay: 12s; }
.particle:nth-child(14) { left: 55%; animation-delay: 13s; }
.particle:nth-child(15) { left: 65%; animation-delay: 14s; }
.particle:nth-child(16) { left: 75%; animation-delay: 15s; }
.particle:nth-child(17) { left: 85%; animation-delay: 16s; }
.particle:nth-child(18) { left: 95%; animation-delay: 17s; }
.particle:nth-child(19) { left: 5%; animation-delay: 18s; }
.particle:nth-child(20) { left: 95%; animation-delay: 19s; }
</style>