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
import { useAuthStore } from '../stores/auth.store'

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
    const { isAuthenticated } = useAuthStore()
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
  background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
  color: var(--text-primary);
  position: relative;
  overflow: hidden;
  margin-top: auto;
  border-top: 1px solid var(--border-color);
}

.footer-content {
  display: grid;
  grid-template-columns: 2fr 3fr 1.5fr;
  gap: var(--space-20);
  padding: var(--space-20) 0;
  position: relative;
  z-index: 2;
}

.footer-nav {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-12);
}

/* Brand Section */
.footer-brand {
  max-width: 420px;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.logo-icon {
  width: 52px;
  height: 52px;
  background: linear-gradient(135deg, var(--color-accent) 0%, color-mix(in srgb, var(--color-accent) 80%, var(--color-primary)) 100%);
  border-radius: var(--radius-2xl);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-inverse);
  box-shadow: var(--shadow-md);
}

.brand-name {
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.brand-description {
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
  margin-bottom: var(--space-8);
  font-size: var(--text-base);
  font-weight: var(--font-weight-medium);
}

.social-links {
  display: flex;
  gap: var(--space-3);
}

.social-link {
  width: 48px;
  height: 48px;
  background: var(--bg-elevated);
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}

.social-link:hover {
  background: var(--color-accent);
  color: var(--text-inverse);
  transform: translateY(-2px) scale(1.05);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-accent);
}

/* Navigation */
.nav-section {
  margin-bottom: var(--space-10);
}

.nav-title {
  font-size: var(--text-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-6);
  position: relative;
}

.nav-title::after {
  content: '';
  position: absolute;
  bottom: -var(--space-2);
  left: 0;
  width: 24px;
  height: 2px;
  background: linear-gradient(90deg, var(--color-accent) 0%, transparent 100%);
  border-radius: var(--radius-full);
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.nav-link {
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
  font-size: var(--text-sm);
  transition: all var(--transition-fast);
  display: inline-block;
  position: relative;
  padding: var(--space-2) 0;
  border-radius: var(--radius-md);
}

.nav-link:hover {
  color: var(--color-accent);
  transform: translateX(var(--space-2));
}

.nav-link::before {
  content: '';
  position: absolute;
  left: -var(--space-4);
  top: 50%;
  transform: translateY(-50%);
  width: 6px;
  height: 6px;
  background: var(--color-accent);
  border-radius: 50%;
  opacity: 0;
  transition: all var(--transition-fast);
}

.nav-link:hover::before {
  opacity: 1;
  transform: translateY(-50%) scale(1.2);
}

/* Newsletter */
.newsletter {
  background: var(--bg-elevated);
  padding: var(--space-8);
  border-radius: var(--radius-3xl);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-md);
  position: relative;
  overflow: hidden;
}

.newsletter::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, var(--color-accent) 50%, transparent 100%);
}

.newsletter-title {
  font-size: var(--text-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-4);
}

.newsletter-description {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: var(--line-height-relaxed);
  margin-bottom: var(--space-6);
  font-weight: var(--font-weight-medium);
}

.newsletter-form {
  width: 100%;
}

.input-group {
  display: flex;
  border-radius: var(--radius-2xl);
  overflow: hidden;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  transition: all var(--transition-fast);
}

.input-group:focus-within {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 15%, transparent);
}

.newsletter-input {
  flex: 1;
  padding: var(--space-4) var(--space-5);
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
}

.newsletter-input:focus {
  outline: none;
}

.newsletter-input::placeholder {
  color: var(--text-tertiary);
  font-weight: var(--font-weight-normal);
}

.newsletter-btn {
  padding: var(--space-4) var(--space-5);
  background: var(--color-accent);
  color: var(--text-inverse);
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 52px;
}

.newsletter-btn:hover {
  background: color-mix(in srgb, var(--color-accent) 90%, black);
  transform: scale(1.05);
}

/* Footer Bottom */
.footer-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-8) 0;
  border-top: 1px solid var(--border-color);
  position: relative;
  z-index: 2;
}

.footer-info {
  flex: 1;
}

.copyright {
  color: var(--text-tertiary);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  margin-bottom: var(--space-2);
}

.powered-by {
  color: var(--text-tertiary);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
}

.tech-link {
  color: var(--color-accent);
  font-weight: var(--font-weight-semibold);
  transition: all var(--transition-fast);
  position: relative;
}

.tech-link:hover {
  color: var(--color-primary);
}

.tech-link::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 0;
  height: 1px;
  background: currentColor;
  transition: width var(--transition-fast);
}

.tech-link:hover::after {
  width: 100%;
}

.footer-stats {
  display: flex;
  gap: var(--space-8);
}

.stat-item {
  text-align: center;
  padding: var(--space-4) var(--space-6);
  background: var(--bg-elevated);
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.stat-number {
  display: block;
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-accent);
  margin-bottom: var(--space-1);
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-primary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: var(--font-weight-semibold);
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
  overflow: hidden;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-accent) 0%, color-mix(in srgb, var(--color-accent) 60%, var(--color-primary)) 100%);
  opacity: 0.08;
  animation: float var(--duration-slow) ease-in-out infinite;
  backdrop-filter: blur(1px);
  -webkit-backdrop-filter: blur(1px);
}

.circle-1 {
  width: 240px;
  height: 240px;
  top: -120px;
  right: -120px;
  animation-delay: 0s;
}

.circle-2 {
  width: 180px;
  height: 180px;
  bottom: -90px;
  left: -90px;
  animation-delay: 2s;
}

.circle-3 {
  width: 120px;
  height: 120px;
  top: 40%;
  left: 15%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% { 
    transform: translateY(0px) rotate(0deg) scale(1); 
    opacity: 0.08;
  }
  50% { 
    transform: translateY(-24px) rotate(180deg) scale(1.1); 
    opacity: 0.12;
  }
}

/* 现代响应式设计 */
@media (max-width: 1279px) {
  .footer-content {
    gap: var(--space-16);
  }
  
  .footer-nav {
    gap: var(--space-10);
  }
}

@media (max-width: 1023px) {
  .footer-content {
    grid-template-columns: 1fr 1fr;
    gap: var(--space-12);
    padding: var(--space-16) 0;
  }
  
  .newsletter {
    grid-column: 1 / -1;
    margin-top: var(--space-8);
  }
  
  .footer-nav {
    gap: var(--space-8);
  }
}

@media (max-width: 767px) {
  .footer-content {
    grid-template-columns: 1fr;
    gap: var(--space-10);
    padding: var(--space-12) 0;
  }
  
  .footer-bottom {
    flex-direction: column;
    gap: var(--space-6);
    text-align: center;
    padding: var(--space-6) 0;
  }
  
  .footer-stats {
    justify-content: center;
    gap: var(--space-6);
  }
  
  .social-links {
    justify-content: center;
  }
  
  .footer-nav {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-8);
  }
}

@media (max-width: 639px) {
  .footer-content {
    padding: var(--space-10) 0;
    gap: var(--space-8);
  }
  
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
    padding: var(--space-6);
  }
  
  .footer-nav {
    grid-template-columns: 1fr;
    gap: var(--space-6);
  }
  
  .footer-stats {
    gap: var(--space-4);
  }
  
  .stat-item {
    padding: var(--space-3) var(--space-4);
  }
}

@media (max-width: 479px) {
  .input-group {
    flex-direction: column;
    border-radius: var(--radius-2xl);
  }
  
  .newsletter-input {
    border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
  }
  
  .newsletter-btn {
    border-radius: 0 0 var(--radius-2xl) var(--radius-2xl);
    padding: var(--space-4);
  }
  
  .social-links {
    gap: var(--space-2);
  }
  
  .social-link {
    width: 44px;
    height: 44px;
  }
  
  .logo-icon {
    width: 48px;
    height: 48px;
  }
  
  .brand-name {
    font-size: var(--text-xl);
  }
}

/* 减少动画偏好支持 */
@media (prefers-reduced-motion: reduce) {
  .decoration-circle {
    animation: none;
  }
  
  .social-link,
  .nav-link,
  .newsletter-btn,
  .tech-link {
    transition: none;
  }
  
  .social-link:hover,
  .nav-link:hover,
  .newsletter-btn:hover {
    transform: none;
  }
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .footer {
    border-top-width: 2px;
  }
  
  .social-link,
  .nav-link,
  .newsletter-btn {
    border: 1px solid transparent;
  }
  
  .social-link:hover,
  .nav-link:hover,
  .newsletter-btn:hover {
    border-color: currentColor;
  }
  
  .decoration-circle {
    display: none;
  }
}

/* 打印样式 */
@media print {
  .footer-decoration,
  .social-links,
  .newsletter {
    display: none;
  }
  
  .footer {
    background: white !important;
    color: black !important;
    border-top: 1px solid #000;
  }
  
  .footer-content {
    padding: var(--space-8) 0;
  }
}
</style>