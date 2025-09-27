<template>
  <header class="header">
    <div class="container">
      <div class="header-content">
        <!-- Logo -->
        <router-link to="/" class="logo">
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
        </router-link>

        <!-- Desktop Navigation -->
        <nav class="nav-desktop">
          <div class="nav-links">
            <router-link to="/" class="nav-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9,22 9,12 15,12 15,22"/>
              </svg>
              首页
            </router-link>
            <router-link to="/category/技术" class="nav-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                <polyline points="2,17 12,22 22,17"/>
                <polyline points="2,12 12,17 22,12"/>
              </svg>
              技术
            </router-link>
            <router-link to="/category/生活" class="nav-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              生活
            </router-link>
            <router-link to="/inspirations" class="nav-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              灵感
            </router-link>
            <router-link to="/about" class="nav-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              关于
            </router-link>
          </div>

          <!-- Write Button (for authenticated users) -->
          <router-link 
            v-if="isAuthenticated" 
            to="/create" 
            class="write-btn"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            写文章
          </router-link>
        </nav>

        <!-- User Section -->
        <div class="user-section">
          <!-- Search -->
          <div class="search-container">
            <div class="search-input-wrapper">
              <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
              <input 
                v-model="searchQuery"
                @keyup.enter="handleSearch"
                type="text" 
                placeholder="搜索文章..."
                class="search-input"
              />
            </div>
          </div>

          <!-- User Menu -->
          <div v-if="isAuthenticated" class="user-menu">
            <button @click="toggleUserMenu" class="user-avatar">
              <img :src="getAvatarUrl(user.avatar, user.username)" :alt="user.username" />
              <div class="user-status"></div>
            </button>
            
            <transition name="dropdown">
              <div v-if="showUserMenu" class="user-dropdown">
                <div class="dropdown-header">
                  <img :src="getAvatarUrl(user.avatar, user.username)" :alt="user.username" />
                  <div class="user-info">
                    <div class="user-name">{{ user.username }}</div>
                    <div class="user-email">{{ user.email }}</div>
                  </div>
                </div>
                
                <div class="dropdown-divider"></div>
                
                <router-link to="/profile" @click="closeUserMenu" class="dropdown-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  个人设置
                </router-link>
                
                <router-link to="/my-posts" @click="closeUserMenu" class="dropdown-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                  </svg>
                  我的文章
                </router-link>
                
                <router-link to="/create" @click="closeUserMenu" class="dropdown-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  写新文章
                </router-link>
                
                <router-link to="/trash" @click="closeUserMenu" class="dropdown-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3,6 5,6 21,6"/>
                    <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2"/>
                    <line x1="10" y1="11" x2="10" y2="17"/>
                    <line x1="14" y1="11" x2="14" y2="17"/>
                  </svg>
                  回收站
                </router-link>
                
                <button @click="toggleTheme" class="dropdown-item">
                  <svg v-if="isDark" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="5"/>
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                  </svg>
                  <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                  {{ isDark ? '亮色模式' : '暗色模式' }}
                </button>
                
                <div class="dropdown-divider"></div>
                
                <router-link to="/admin" @click="closeUserMenu" class="dropdown-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                  </svg>
                  数据管理
                </router-link>
                
                <div class="dropdown-divider"></div>
                
                <button @click="handleLogout" class="dropdown-item logout-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16,17 21,12 16,7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  退出登录
                </button>
              </div>
            </transition>
          </div>

          <!-- Login Button -->
          <router-link v-else to="/login" class="login-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10,17 15,12 10,7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            登录
          </router-link>
        </div>

        <!-- Mobile Menu Button -->
        <button @click="toggleMobileMenu" class="mobile-menu-btn">
          <svg v-if="!isMobileMenuOpen" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
          <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile Menu -->
    <transition name="mobile-menu">
      <div v-if="isMobileMenuOpen" class="mobile-menu">
        <div class="mobile-nav">
          <router-link to="/" @click="closeMobileMenu" class="mobile-nav-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9,22 9,12 15,12 15,22"/>
            </svg>
            首页
          </router-link>
          <router-link to="/category/技术" @click="closeMobileMenu" class="mobile-nav-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2"/>
              <polyline points="2,17 12,22 22,17"/>
              <polyline points="2,12 12,17 22,12"/>
            </svg>
            技术
          </router-link>
          <router-link to="/category/生活" @click="closeMobileMenu" class="mobile-nav-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            生活
          </router-link>
          <router-link to="/about" @click="closeMobileMenu" class="mobile-nav-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            关于
          </router-link>
          
          <div v-if="isAuthenticated" class="mobile-divider"></div>
          
          <router-link v-if="isAuthenticated" to="/create" @click="closeMobileMenu" class="mobile-nav-link write-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            写文章
          </router-link>
          
          <router-link v-if="isAuthenticated" to="/my-posts" @click="closeMobileMenu" class="mobile-nav-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
            </svg>
            我的文章
          </router-link>
          
          <router-link v-if="isAuthenticated" to="/trash" @click="closeMobileMenu" class="mobile-nav-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3,6 5,6 21,6"/>
              <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
            回收站
          </router-link>
          
          <router-link v-if="!isAuthenticated" to="/login" @click="closeMobileMenu" class="mobile-nav-link login-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10,17 15,12 10,7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            登录
          </router-link>
        </div>
      </div>
    </transition>

    <!-- Backdrop -->
    <div v-if="showUserMenu || isMobileMenuOpen" @click="closeAllMenus" class="backdrop"></div>
  </header>
</template>

<script>
import { useAuthStore } from '../stores/auth.store'
import { useUIStore } from '../stores/ui.store'
import { getAvatarUrl } from '../utils/image-url'

export default {
  name: 'Header',

  setup() {
    const authStore = useAuthStore()
    const { user, isAuthenticated, logout, initAuth } = authStore
    const uiStore = useUIStore()
    const { isDark, toggleTheme } = uiStore
    
    // 确保认证状态已初始化
    if (!authStore.initialized.value) {

      initAuth()
    }
    
    return {
      user,
      isAuthenticated,
      logout,
      isDark,
      toggleTheme
    }
  },

  data() {
    return {
      searchQuery: '',
      showUserMenu: false,
      isMobileMenuOpen: false,
      avatarRefreshKey: Date.now() // 用于强制刷新头像
    }
  },

  mounted() {
    // 监听头像更新事件
    window.addEventListener('avatar-updated', this.handleAvatarUpdated)
  },

  beforeUnmount() {
    // 清理事件监听器
    window.removeEventListener('avatar-updated', this.handleAvatarUpdated)
  },

  methods: {
    handleSearch() {
      if (this.searchQuery.trim()) {
        this.$router.push(`/search?q=${encodeURIComponent(this.searchQuery)}`)
        this.searchQuery = ''
      }
    },
    
    toggleUserMenu() {
      this.showUserMenu = !this.showUserMenu
      this.isMobileMenuOpen = false
    },
    
    closeUserMenu() {
      this.showUserMenu = false
    },
    
    toggleMobileMenu() {
      this.isMobileMenuOpen = !this.isMobileMenuOpen
      this.showUserMenu = false
    },
    
    closeMobileMenu() {
      this.isMobileMenuOpen = false
    },
    
    closeAllMenus() {
      this.showUserMenu = false
      this.isMobileMenuOpen = false
    },
    
    handleLogout() {
      this.logout()
      this.closeUserMenu()
      this.$router.push('/')
    },
    
    getAvatarUrl(avatarPath, username) {
      // 在头像更新后强制刷新
      const forceRefresh = this.avatarRefreshKey > 0
      return getAvatarUrl(avatarPath, username, forceRefresh)
    },
    
    handleAvatarUpdated(event) {
      // 更新刷新键以强制重新渲染头像
      this.avatarRefreshKey = Date.now()

    }
  }
}
</script>

<style scoped>
.header {
  background: color-mix(in srgb, var(--bg-primary) 95%, transparent);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: all var(--transition-fast);
}

.header.scrolled {
  background: var(--bg-primary);
  box-shadow: var(--shadow-sm);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) 0;
  min-height: 72px;
}

/* Logo */
.logo {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-weight: var(--font-weight-bold);
  font-size: var(--text-xl);
  color: var(--text-primary);
  transition: all var(--transition-fast);
}

.logo:hover {
  transform: translateY(-1px);
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--color-accent) 0%, color-mix(in srgb, var(--color-accent) 80%, var(--color-primary)) 100%);
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-inverse);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
}

.logo:hover .logo-icon {
  box-shadow: var(--shadow-md);
  transform: scale(1.05);
}

/* Desktop Navigation */
.nav-desktop {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  background: var(--bg-secondary);
  border-radius: var(--radius-2xl);
  padding: var(--space-1);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-xl);
  font-weight: var(--font-weight-medium);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  transition: all var(--transition-fast);
  position: relative;
  white-space: nowrap;
}

.nav-link:hover {
  color: var(--text-primary);
  background: var(--bg-tertiary);
}

.nav-link.router-link-active {
  color: var(--text-primary);
  background: var(--bg-elevated);
  box-shadow: var(--shadow-sm);
}

.write-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-6);
  background: var(--color-accent);
  color: var(--text-inverse);
  border-radius: var(--radius-xl);
  font-weight: var(--font-weight-semibold);
  font-size: var(--text-sm);
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.write-btn:hover {
  background: color-mix(in srgb, var(--color-accent) 90%, black);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* User Section */
.user-section {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

/* Search */
.search-container {
  position: relative;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: var(--space-4);
  color: var(--text-tertiary);
  z-index: 1;
  transition: color var(--transition-fast);
}

.search-input {
  width: 280px;
  padding: var(--space-3) var(--space-4) var(--space-3) 2.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-2xl);
  font-size: var(--text-sm);
  background: var(--bg-secondary);
  color: var(--text-primary);
  transition: all var(--transition-fast);
  font-weight: var(--font-weight-medium);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-accent);
  background: var(--bg-elevated);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 15%, transparent);
}

.search-input:focus + .search-icon {
  color: var(--color-accent);
}

.search-input::placeholder {
  color: var(--text-tertiary);
  font-weight: var(--font-weight-normal);
}

/* User Menu */
.user-menu {
  position: relative;
}

.user-avatar {
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2px solid var(--border-color);
  overflow: hidden;
  cursor: pointer;
  transition: all var(--transition-fast);
  background: none;
  padding: 0;
  box-shadow: var(--shadow-sm);
}

.user-avatar:hover {
  border-color: var(--color-accent);
  transform: translateY(-1px) scale(1.05);
  box-shadow: var(--shadow-md);
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-status {
  position: absolute;
  bottom: -1px;
  right: -1px;
  width: 14px;
  height: 14px;
  background: var(--color-success);
  border: 3px solid var(--bg-primary);
  border-radius: 50%;
  box-shadow: var(--shadow-sm);
}

/* User Dropdown */
.user-dropdown {
  position: absolute;
  top: calc(100% + var(--space-3));
  right: 0;
  width: 320px;
  background: var(--bg-elevated);
  border-radius: var(--radius-3xl);
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--border-color);
  overflow: hidden;
  z-index: 1000;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.dropdown-header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-6);
  background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
  border-bottom: 1px solid var(--border-color);
}

.dropdown-header img {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}

.user-info {
  flex: 1;
}

.user-name {
  font-weight: var(--font-weight-semibold);
  font-size: var(--text-base);
  color: var(--text-primary);
  margin-bottom: var(--space-1);
}

.user-email {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  font-weight: var(--font-weight-medium);
}

.dropdown-divider {
  height: 1px;
  background: var(--border-color);
  margin: var(--space-2) 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-4) var(--space-6);
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
  font-size: var(--text-sm);
  transition: all var(--transition-fast);
  border: none;
  background: none;
  cursor: pointer;
  text-decoration: none;
  border-radius: 0;
}

.dropdown-item:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.logout-btn:hover {
  background: var(--color-error);
  color: var(--text-inverse);
}

/* Login Button */
.login-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-6);
  background: var(--color-primary);
  color: var(--text-inverse);
  border-radius: var(--radius-xl);
  font-weight: var(--font-weight-semibold);
  font-size: var(--text-sm);
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.login-btn:hover {
  background: color-mix(in srgb, var(--color-primary) 90%, black);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* Mobile Menu Button */
.mobile-menu-btn {
  display: none;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: var(--radius-xl);
  transition: all var(--transition-fast);
}

.mobile-menu-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border-color: var(--border-hover);
  transform: translateY(-1px);
}

/* Mobile Menu */
.mobile-menu {
  position: absolute;
  top: 100%;
  left: var(--space-4);
  right: var(--space-4);
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-3xl);
  box-shadow: var(--shadow-xl);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 999;
  margin-top: var(--space-2);
  overflow: hidden;
}

.mobile-nav {
  padding: var(--space-6);
}

.mobile-nav-link {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
  font-size: var(--text-base);
  border-radius: var(--radius-xl);
  transition: all var(--transition-fast);
  margin-bottom: var(--space-1);
}

.mobile-nav-link:hover,
.mobile-nav-link.router-link-active {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.mobile-nav-link.router-link-active {
  font-weight: var(--font-weight-semibold);
}

.write-link {
  background: var(--color-accent);
  color: var(--text-inverse);
  margin-top: var(--space-4);
}

.write-link:hover {
  background: color-mix(in srgb, var(--color-accent) 90%, black);
}

.login-link {
  background: var(--color-primary);
  color: var(--text-inverse);
  margin-top: var(--space-4);
}

.login-link:hover {
  background: color-mix(in srgb, var(--color-primary) 90%, black);
}

.mobile-divider {
  height: 1px;
  background: var(--border-color);
  margin: var(--space-4) 0;
}

/* Backdrop */
.backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: color-mix(in srgb, var(--color-overlay) 20%, transparent);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  z-index: 99;
}

/* Transitions */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all var(--duration-200) var(--ease-out);
  transform-origin: top right;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-8px);
}

.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: all var(--duration-200) var(--ease-out);
}

.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
  transform: translateY(-12px) scale(0.98);
}

/* 现代响应式设计 */
@media (max-width: 1279px) {
  .search-input {
    width: 240px;
  }
}

@media (max-width: 1023px) {
  .search-input {
    width: 200px;
  }
  
  .nav-links {
    gap: var(--space-0_5);
  }
  
  .nav-link {
    padding: var(--space-2_5) var(--space-4);
    font-size: var(--text-xs);
  }
}

@media (max-width: 767px) {
  .nav-desktop {
    display: none;
  }
  
  .search-container {
    display: none;
  }
  
  .mobile-menu-btn {
    display: flex;
  }
  
  .user-dropdown {
    width: 280px;
  }
  
  .header-content {
    min-height: 64px;
  }
}

@media (max-width: 639px) {
  .header-content {
    padding: var(--space-3) 0;
  }
  
  .logo {
    font-size: var(--text-lg);
  }
  
  .logo-icon {
    width: 36px;
    height: 36px;
  }
  
  .user-dropdown {
    width: 260px;
    right: -var(--space-4);
  }
  
  .mobile-menu {
    left: var(--space-3);
    right: var(--space-3);
  }
}

@media (max-width: 479px) {
  .logo-text {
    display: none;
  }
  
  .user-dropdown {
    width: 240px;
    right: -var(--space-6);
  }
  
  .user-avatar {
    width: 40px;
    height: 40px;
  }
}

/* 减少动画偏好支持 */
@media (prefers-reduced-motion: reduce) {
  .dropdown-enter-active,
  .dropdown-leave-active,
  .mobile-menu-enter-active,
  .mobile-menu-leave-active {
    transition: none;
  }
  
  .logo,
  .logo-icon,
  .nav-link,
  .write-btn,
  .login-btn,
  .user-avatar,
  .mobile-menu-btn {
    transition: none;
  }
  
  .logo:hover,
  .logo:hover .logo-icon,
  .write-btn:hover,
  .login-btn:hover,
  .user-avatar:hover,
  .mobile-menu-btn:hover {
    transform: none;
  }
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .header {
    border-bottom-width: 2px;
  }
  
  .nav-link,
  .dropdown-item,
  .mobile-nav-link {
    border: 1px solid transparent;
  }
  
  .nav-link:hover,
  .nav-link.router-link-active,
  .dropdown-item:hover,
  .mobile-nav-link:hover,
  .mobile-nav-link.router-link-active {
    border-color: currentColor;
  }
}
</style>