<template>
  <footer class="site-footer">
    <div class="footer-container">
      <div class="footer-top">
        <div class="footer-brand">
          <router-link to="/" class="footer-logo">
            <span class="logo-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </span>
            <span>Blog</span>
          </router-link>
          <p class="footer-tagline">记录想法、生活片段与长期项目，让表达被长期看见。</p>
        </div>

        <div class="footer-links">
          <div class="footer-section">
            <h4>导航</h4>
            <ul>
              <li><router-link to="/">首页</router-link></li>
              <li><router-link to="/about">关于</router-link></li>
            </ul>
          </div>

          <div class="footer-section">
            <h4>社交媒体</h4>
            <ul>
              <li><a href="https://github.com" target="_blank" rel="noopener">GitHub</a></li>
              <li><a href="https://twitter.com" target="_blank" rel="noopener">Twitter</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <p class="copyright">© {{ currentYear }} Blog. 持续记录，持续生长</p>
        <p class="tech-stack">Designed for everyday sharing</p>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue'

const currentYear = computed(() => new Date().getFullYear())
</script>

<style scoped>
.site-footer {
  border-top: 1px solid var(--color-border-light);
  background: var(--color-surface);
  margin-top: auto;
}

.footer-container {
  max-width: 980px;
  margin: 0 auto;
  padding: 32px 22px 24px;
}

.footer-top {
  display: flex;
  justify-content: space-between;
  gap: 48px;
  margin-bottom: 24px;
}

.footer-brand {
  max-width: 280px;
}

.footer-logo {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 17px;
  font-weight: 600;
  color: var(--color-text-primary);
  text-decoration: none;
  margin-bottom: 8px;
}

.logo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: var(--color-surface-elevated);
  border-radius: 7px;
  color: var(--color-text-primary);
}

.footer-tagline {
  font-size: 13px;
  color: var(--color-text-tertiary);
  line-height: 1.5;
}

.footer-links {
  display: flex;
  gap: 64px;
}

.footer-section h4 {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 16px;
}

.footer-section ul {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.footer-section a {
  font-size: 14px;
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.footer-section a:hover {
  color: var(--color-text-primary);
}

.footer-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 24px;
  border-top: 1px solid var(--color-border-light);
}

.copyright,
.tech-stack {
  font-size: 13px;
  color: var(--color-text-tertiary);
}

@media (max-width: 768px) {
  .footer-container {
    padding: 32px 16px 24px;
  }

  .footer-top {
    flex-direction: column;
    gap: 32px;
  }

  .footer-links {
    gap: 48px;
  }

  .footer-bottom {
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }
}
</style>
