<template>
  <nav class="navbar">
    <div class="navbar-container">
      <router-link to="/" class="logo">
        <span class="logo-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </span>
        <span class="logo-text">Blog</span>
      </router-link>

      <div class="nav-right">
        <ul class="nav-links" :class="{ open: isMenuOpen }">
        <li>
          <router-link to="/" @click="closeMenu" class="nav-item">
            <span class="nav-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </span>
            首页
          </router-link>
        </li>
        <li>
          <router-link to="/discovery" @click="closeMenu" class="nav-item">
            <span class="nav-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
              </svg>
            </span>
            发现
          </router-link>
        </li>
        <li>
          <router-link to="/moments" @click="closeMenu" class="nav-item">
            <span class="nav-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </span>
            动态          </router-link>
        </li>
        <li>
          <router-link to="/write" @click="closeMenu" class="nav-item">
            <span class="nav-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
            </span>
            写文章          </router-link>
        </li>
        <li>
          <router-link to="/planner" @click="closeMenu" class="nav-item">
            <span class="nav-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14.7 6.3a1 1 0 0 1 1.4 0l1.6 1.6a1 1 0 0 1 0 1.4l-7.9 7.9-3.2.8.8-3.2 7.3-7.3z"/>
                <path d="M4 20h16"/>
              </svg>
            </span>
            工具
          </router-link>
        </li>
        <li v-if="authStore.isAdmin" class="mobile-admin">
          <router-link to="/admin" @click="closeMenu" class="nav-item">
            <span class="nav-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
              </svg>
            </span>
            后台
          </router-link>
        </li>
        <li class="mobile-theme">
          <ThemeSwitcher />
        </li>
        <li v-if="authStore.isLoggedIn" class="mobile-user">
          <div class="mobile-user-actions">
            <router-link to="/about" @click="closeMenu" class="mobile-login">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="10" r="3"/>
                <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/>
              </svg>
              个人资料
            </router-link>
            <button class="mobile-logout" @click="handleLogout">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              退出登录            </button>
          </div>
        </li>
        <li v-else class="mobile-user">
          <router-link to="/login" @click="closeMenu" class="mobile-login">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            登录
          </router-link>
        </li>
        </ul>

        <div class="nav-actions">
          <router-link v-if="authStore.isAdmin" to="/admin" class="admin-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
            </svg>
            后台
          </router-link>
          <ThemeSwitcher />

          <div v-if="authStore.isLoggedIn" class="user-menu" @click="toggleUserMenu">
            <div class="user-avatar">
              {{ authStore.user?.avatar || 'U' }}
            </div>
            <Transition name="dropdown">
              <div v-if="showUserMenu" class="user-dropdown">
                <div class="dropdown-header">
                  <div class="dropdown-avatar">
                    {{ authStore.user?.avatar || 'U' }}
                  </div>
                  <div class="dropdown-info">
                    <span class="dropdown-name">{{ authStore.user?.username }}</span>
                    <span class="dropdown-email">{{ authStore.user?.email }}</span>
                  </div>
                </div>
                <div class="dropdown-divider"></div>
                <router-link to="/about" class="dropdown-item" @click="closeUserMenu">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <circle cx="12" cy="10" r="3"/>
                    <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/>
                  </svg>
                  个人资料
                </router-link>
                <button class="dropdown-item" @click="handleLogout">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  退出登录                </button>
              </div>
            </Transition>
          </div>

          <router-link v-else to="/login" class="login-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            <span>登录</span>
          </router-link>

          <button class="menu-toggle" @click="toggleMenu" aria-label="菜单">
            <span class="menu-line" :class="{ open: isMenuOpen }"></span>
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import ThemeSwitcher from './ThemeSwitcher.vue'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const isMenuOpen = ref(false)
const showUserMenu = ref(false)

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const closeMenu = () => {
  isMenuOpen.value = false
}

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

const closeUserMenu = () => {
  showUserMenu.value = false
}

const handleLogout = () => {
  authStore.logout()
  closeUserMenu()
  closeMenu()
  router.push('/')
}

// 点击外部关闭用户菜单
const handleClickOutside = (e) => {
  if (!e.target.closest('.user-menu')) {
    showUserMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  authStore.initAuth()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: var(--color-nav-bg);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-bottom: 1px solid var(--color-border-light);
  transition: background-color var(--transition-normal);
}

.navbar-container {
  max-width: 980px;
  margin: 0 auto;
  padding: 0 22px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 48px;
  position: relative;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-primary);
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.022em;
  transition: opacity var(--transition-fast);
}

.logo:hover {
  opacity: 0.8;
}

.logo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: var(--color-accent);
  border-radius: 7px;
  color: white;
  transition: background-color var(--transition-normal);
}

.logo-icon svg {
  width: 16px;
  height: 16px;
}

.nav-right {
  display: flex;
  align-items: center;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 22px;
  padding-left: 8px;
}

.admin-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid var(--color-border-light);
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 600;
  transition: all var(--transition-fast);
}

.admin-btn:hover {
  color: var(--color-text-primary);
  border-color: var(--color-border);
  background: var(--color-surface-elevated);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 4px;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  color: var(--color-text-secondary);
  font-size: 14px;
  font-weight: 400;
  border-radius: 980px;
  transition: all var(--transition-fast);
}

.nav-item:hover {
  color: var(--color-text-primary);
  background: var(--color-surface-elevated);
}

.nav-item.router-link-active {
  color: var(--color-text-primary);
  background: var(--color-surface-elevated);
}

.nav-icon {
  display: flex;
  align-items: center;
  opacity: 0.7;
}

/* Login Button */
.login-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--color-accent);
  color: white;
  border-radius: 980px;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: all var(--transition-fast);
}

.login-btn:hover {
  background: var(--color-accent);
  transform: none;
}

/* User Menu */
.user-menu {
  position: relative;
}

.user-avatar {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface-elevated);
  color: var(--color-text-primary);
  border-radius: 50%;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform var(--transition-fast);
}

.user-avatar:hover {
  transform: none;
}

.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 240px;
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
  z-index: 100;
}

.dropdown-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
}

.dropdown-avatar {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface-elevated);
  color: var(--color-text-primary);
  border-radius: 50%;
  font-size: 16px;
  font-weight: 600;
  flex-shrink: 0;
}

.dropdown-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.dropdown-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.dropdown-email {
  font-size: 12px;
  color: var(--color-text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-divider {
  height: 1px;
  background: var(--color-border-light);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.dropdown-item:hover {
  background: var(--color-surface-elevated);
  color: var(--color-text-primary);
}

/* Dropdown Transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.96);
}

/* Menu Toggle */
.menu-toggle {
  display: none;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  background: transparent;
  border-radius: 50%;
  transition: background var(--transition-fast);
}

.menu-toggle:hover {
  background: var(--color-accent-subtle);
}

.menu-line {
  position: relative;
  width: 18px;
  height: 2px;
  background: var(--color-text-primary);
  border-radius: 1px;
  transition: all var(--transition-normal);
}

.menu-line::before,
.menu-line::after {
  content: '';
  position: absolute;
  left: 0;
  width: 18px;
  height: 2px;
  background: var(--color-text-primary);
  border-radius: 1px;
  transition: all var(--transition-normal);
}

.menu-line::before {
  top: -6px;
}

.menu-line::after {
  top: 6px;
}

.menu-line.open {
  background: transparent;
}

.menu-line.open::before {
  top: 0;
  transform: rotate(45deg);
}

.menu-line.open::after {
  top: 0;
  transform: rotate(-45deg);
}

.mobile-theme,
.mobile-user,
.mobile-admin {
  display: none;
}

@media (max-width: 768px) {
  .navbar-container {
    padding: 0 16px;
    height: 44px;
  }

  .nav-right {
    margin-left: auto;
  }

  .nav-actions .theme-switcher,
  .nav-actions .admin-btn,
  .nav-actions .login-btn,
  .nav-actions .user-menu {
    display: none;
  }

  .menu-toggle {
    display: flex;
  }

  .nav-links {
    position: absolute;
    top: 44px;
    left: 0;
    right: 0;
    flex-direction: column;
    gap: 0;
    padding: 8px;
    background: var(--color-nav-bg);
    backdrop-filter: saturate(180%) blur(20px);
    -webkit-backdrop-filter: saturate(180%) blur(20px);
    border-bottom: 1px solid var(--color-border-light);
    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px);
    transition: all var(--transition-normal);
  }

  .nav-links.open {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }

  .nav-item {
    width: 100%;
    padding: 12px 16px;
    border-radius: var(--radius-md);
    justify-content: flex-start;
  }

  .mobile-theme,
  .mobile-user,
  .mobile-admin {
    display: flex;
    padding: 12px 16px;
  }

  .mobile-theme :deep(.theme-toggle) {
    width: 100%;
    border-radius: var(--radius-md);
    justify-content: center;
    gap: 8px;
    color: var(--color-text-secondary);
    font-size: 14px;
  }

  .mobile-theme :deep(.theme-toggle)::after {
    content: '切换主题';
  }

  .mobile-logout,
  .mobile-login {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 12px 16px;
    background: var(--color-accent-subtle);
    border: none;
    border-radius: var(--radius-md);
    color: var(--color-accent);
    font-size: 14px;
    cursor: pointer;
    text-decoration: none;
  }

  .mobile-user-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }
}
</style>


