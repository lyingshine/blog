<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-content">
        <!-- Brand Section -->
        <div class="footer-brand">
          <div class="brand-logo">
            <div class="logo-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
              </svg>
            </div>
            <span class="brand-name">Vue Blog</span>
          </div>
          <p class="brand-description">
            现代化的博客平台，让每个人都能分享自己的故事和见解。
          </p>
          <div class="social-links">
            <a href="#" class="social-link" aria-label="GitHub">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
              </svg>
            </a>
            <a href="#" class="social-link" aria-label="Twitter">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
              </svg>
            </a>
            <a href="#" class="social-link" aria-label="LinkedIn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                <rect x="2" y="9" width="4" height="12"/>
                <circle cx="4" cy="4" r="2"/>
              </svg>
            </a>
            <a href="#" class="social-link" aria-label="Email">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </a>
          </div>
        </div>

        <!-- Navigation Links -->
        <div class="footer-nav">
          <div class="nav-section">
            <h4 class="nav-title">导航</h4>
            <ul class="nav-list">
              <li><router-link to="/" class="nav-link">首页</router-link></li>
              <li><router-link to="/category/技术" class="nav-link">技术</router-link></li>
              <li><router-link to="/category/生活" class="nav-link">生活</router-link></li>
              <li><router-link to="/about" class="nav-link">关于</router-link></li>
            </ul>
          </div>

          <div class="nav-section">
            <h4 class="nav-title">功能</h4>
            <ul class="nav-list">
              <li><router-link v-if="isAuthenticated" to="/create" class="nav-link">写文章</router-link></li>
              <li><router-link v-if="isAuthenticated" to="/my-posts" class="nav-link">我的文章</router-link></li>
              <li><router-link v-if="!isAuthenticated" to="/login" class="nav-link">登录</router-link></li>
              <li><a href="#" class="nav-link">RSS订阅</a></li>
            </ul>
          </div>

          <div class="nav-section">
            <h4 class="nav-title">支持</h4>
            <ul class="nav-list">
              <li><a href="#" class="nav-link">帮助中心</a></li>
              <li><a href="#" class="nav-link">隐私政策</a></li>
              <li><a href="#" class="nav-link">服务条款</a></li>
              <li><a href="#" class="nav-link">联系我们</a></li>
            </ul>
          </div>
        </div>

        <!-- Newsletter -->
        <div class="newsletter">
          <h4 class="newsletter-title">订阅更新</h4>
          <p class="newsletter-description">
            订阅我们的邮件列表，获取最新文章和更新通知。
          </p>
          <form @submit.prevent="handleSubscribe" class="newsletter-form">
            <div class="input-group">
              <input 
                v-model="email"
                type="email" 
                placeholder="输入你的邮箱"
                class="newsletter-input"
                required
              />
              <button type="submit" class="newsletter-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22,2 15,22 11,13 2,9 22,2"/>
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Footer Bottom -->
      <div class="footer-bottom">
        <div class="footer-info">
          <p class="copyright">
            © {{ currentYear }} Vue Blog. 保留所有权利。
          </p>
          <p class="powered-by">
            由 
            <a href="https://vuejs.org" target="_blank" rel="noopener" class="tech-link">Vue.js</a>
            和
            <a href="https://vitejs.dev" target="_blank" rel="noopener" class="tech-link">Vite</a>
            强力驱动
          </p>
        </div>
        
        <div class="footer-stats">
          <div class="stat-item">
            <span class="stat-number">{{ articleCount }}</span>
            <span class="stat-label">篇文章</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ userCount }}</span>
            <span class="stat-label">位作者</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Decorative Elements -->
    <div class="footer-decoration">
      <div class="decoration-circle circle-1"></div>
      <div class="decoration-circle circle-2"></div>
      <div class="decoration-circle circle-3"></div>
    </div>
  </footer>
</template>

<script>
import { useAuth } from '../composables/useAuth'

export default {
  name: 'Footer',
  data() {
    return {
      email: '',
      currentYear: new Date().getFullYear(),
      articleCount: 0,
      userCount: 0
    }
  },
  setup() {
    const { isAuthenticated } = useAuth()
    return {
      isAuthenticated
    }
  },
  created() {
    this.updateStats()
  },
  methods: {
    handleSubscribe() {
      if (this.email) {
        // 这里可以添加订阅逻辑
        alert('感谢订阅！我们会及时向您发送最新内容。')
        this.email = ''
      }
    },
    
    updateStats() {
      // 获取文章数量
      const articles = JSON.parse(localStorage.getItem('blog_articles') || '[]')
      this.articleCount = articles.length
      
      // 获取用户数量（简化处理）
      const users = JSON.parse(localStorage.getItem('blog_users') || '[]')
      this.userCount = users.length || (this.isAuthenticated ? 1 : 0)
    }
  }
}
</script>

<style scoped>
.footer {
  background: linear-gradient(135deg, var(--color-gray-900) 0%, var(--color-gray-800) 100%);
  color: var(--color-white);
  position: relative;
  overflow: hidden;
  margin-top: auto;
}

.footer-content {
  display: grid;
  grid-template-columns: 2fr 3fr 1.5fr;
  gap: var(--space-3xl);
  padding: var(--space-3xl) 0;
  position: relative;
  z-index: 2;
}

.footer-nav {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-xl);
}

/* Brand Section */
.footer-brand {
  max-width: 400px;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
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

.brand-name {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-white);
}

.brand-description {
  color: var(--color-gray-300);
  line-height: 1.6;
  margin-bottom: var(--space-xl);
}

.social-links {
  display: flex;
  gap: var(--space-md);
}

.social-link {
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-gray-300);
  transition: var(--transition-fast);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.social-link:hover {
  background: var(--color-primary);
  color: var(--color-white);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* Navigation */
.nav-section {
  margin-bottom: var(--space-xl);
}

.nav-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-white);
  margin-bottom: var(--space-lg);
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-list li {
  margin-bottom: var(--space-sm);
}

.nav-link {
  color: var(--color-gray-300);
  font-weight: 500;
  transition: var(--transition-fast);
  display: inline-block;
  position: relative;
}

.nav-link:hover {
  color: var(--color-primary);
  transform: translateX(4px);
}

.nav-link::before {
  content: '';
  position: absolute;
  left: -12px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 4px;
  background: var(--color-primary);
  border-radius: 50%;
  opacity: 0;
  transition: var(--transition-fast);
}

.nav-link:hover::before {
  opacity: 1;
}

/* Newsletter */
.newsletter {
  background: rgba(255, 255, 255, 0.05);
  padding: var(--space-xl);
  border-radius: var(--radius-2xl);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.newsletter-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-white);
  margin-bottom: var(--space-md);
}

.newsletter-description {
  color: var(--color-gray-300);
  font-size: 0.875rem;
  line-height: 1.5;
  margin-bottom: var(--space-lg);
}

.newsletter-form {
  width: 100%;
}

.input-group {
  display: flex;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--color-white);
}

.newsletter-input {
  flex: 1;
  padding: var(--space-md);
  border: none;
  background: transparent;
  color: var(--color-gray-800);
  font-size: 0.875rem;
}

.newsletter-input:focus {
  outline: none;
}

.newsletter-input::placeholder {
  color: var(--color-gray-400);
}

.newsletter-btn {
  padding: var(--space-md);
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  cursor: pointer;
  transition: var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.newsletter-btn:hover {
  background: var(--color-primary-hover);
}

/* Footer Bottom */
.footer-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-xl) 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  z-index: 2;
}

.footer-info {
  flex: 1;
}

.copyright {
  color: var(--color-gray-400);
  font-size: 0.875rem;
  margin-bottom: var(--space-xs);
}

.powered-by {
  color: var(--color-gray-500);
  font-size: 0.75rem;
}

.tech-link {
  color: var(--color-primary);
  font-weight: 600;
  transition: var(--transition-fast);
}

.tech-link:hover {
  color: var(--color-accent);
}

.footer-stats {
  display: flex;
  gap: var(--space-xl);
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-primary);
  margin-bottom: 2px;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--color-gray-400);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Decorative Elements */
.footer-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%);
  opacity: 0.1;
  animation: float 8s ease-in-out infinite;
}

.circle-1 {
  width: 200px;
  height: 200px;
  top: -100px;
  right: -100px;
  animation-delay: 0s;
}

.circle-2 {
  width: 150px;
  height: 150px;
  bottom: -75px;
  left: -75px;
  animation-delay: 2s;
}

.circle-3 {
  width: 100px;
  height: 100px;
  top: 50%;
  left: 20%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
}

/* Responsive */
@media (max-width: 1024px) {
  .footer-content {
    grid-template-columns: 1fr 1fr;
    gap: var(--space-2xl);
  }
  
  .newsletter {
    grid-column: 1 / -1;
  }
}

@media (max-width: 768px) {
  .footer-content {
    grid-template-columns: 1fr;
    gap: var(--space-xl);
    padding: var(--space-2xl) 0;
  }
  
  .footer-bottom {
    flex-direction: column;
    gap: var(--space-lg);
    text-align: center;
  }
  
  .footer-stats {
    justify-content: center;
  }
  
  .social-links {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .brand-logo {
    justify-content: center;
  }
  
  .footer-brand {
    text-align: center;
  }
  
  .nav-section {
    text-align: center;
  }
  
  .newsletter {
    padding: var(--space-lg);
  }
  
  .input-group {
    flex-direction: column;
  }
  
  .newsletter-btn {
    border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  }
}
</style>