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
              <img :src="user.avatar" :alt="user.username" />
              <div class="user-status"></div>
            </button>
            
            <transition name="dropdown">
              <div v-if="showUserMenu" class="user-dropdown">
                <div class="dropdown-header">
                  <img :src="user.avatar" :alt="user.username" />
                  <div class="user-info">
                    <div class="user-name">{{ user.username }}</div>
                    <div class="user-email">{{ user.email }}</div>
                  </div>
                </div>
                
                <div class="dropdown-divider"></div>
                
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
import { useAuth } from '../composables/useAuth'

export default {
  name: 'Header',
  data() {
    return {
      searchQuery: '',
      showUserMenu: false,
      isMobileMenuOpen: false
    }
  },
  setup() {
    const { user, isAuthenticated, logout } = useAuth()
    return {
      user,
      isAuthenticated,
      logout
    }
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
    }
  }
}
</script>

<style scoped>
.header {
  background: var(--color-white);
  border-bottom: 1px solid var(--color-gray-200);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-lg) 0;
}

/* Logo */
.logo {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-weight: 800;
  font-size: 1.25rem;
  color: var(--color-gray-900);
  transition: var(--transition-fast);
}

.logo:hover {
  color: var(--color-primary);
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-white);
}

/* Desktop Navigation */
.nav-desktop {
  display: flex;
  align-items: center;
  gap: var(--space-xl);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-lg);
  font-weight: 500;
  color: var(--color-gray-600);
  transition: var(--transition-fast);
  position: relative;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: var(--color-primary);
  background: var(--color-primary-light);
}

.write-btn {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-lg);
  background: var(--color-accent);
  color: var(--color-white);
  border-radius: var(--radius-lg);
  font-weight: 600;
  font-size: 0.875rem;
  transition: var(--transition-fast);
}

.write-btn:hover {
  background: var(--color-accent-hover);
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
  left: var(--space-md);
  color: var(--color-gray-400);
  z-index: 1;
}

.search-input {
  width: 240px;
  padding: var(--space-sm) var(--space-md) var(--space-sm) 2.5rem;
  border: 2px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  font-size: 0.875rem;
  background: var(--color-gray-50);
  transition: var(--transition-fast);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  background: var(--color-white);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

/* User Menu */
.user-menu {
  position: relative;
}

.user-avatar {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid var(--color-gray-200);
  overflow: hidden;
  cursor: pointer;
  transition: var(--transition-fast);
  background: none;
  padding: 0;
}

.user-avatar:hover {
  border-color: var(--color-primary);
  transform: scale(1.05);
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-status {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  background: var(--color-success);
  border: 2px solid var(--color-white);
  border-radius: 50%;
}

/* User Dropdown */
.user-dropdown {
  position: absolute;
  top: calc(100% + var(--space-sm));
  right: 0;
  width: 280px;
  background: var(--color-white);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--color-gray-200);
  overflow: hidden;
  z-index: 1000;
}

.dropdown-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-lg);
  background: var(--color-gray-50);
}

.dropdown-header img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.user-info {
  flex: 1;
}

.user-name {
  font-weight: 600;
  color: var(--color-gray-900);
  margin-bottom: 2px;
}

.user-email {
  font-size: 0.875rem;
  color: var(--color-gray-500);
}

.dropdown-divider {
  height: 1px;
  background: var(--color-gray-200);
  margin: var(--space-xs) 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  width: 100%;
  padding: var(--space-md) var(--space-lg);
  color: var(--color-gray-700);
  font-weight: 500;
  transition: var(--transition-fast);
  border: none;
  background: none;
  cursor: pointer;
  text-decoration: none;
}

.dropdown-item:hover {
  background: var(--color-gray-50);
  color: var(--color-primary);
}

.logout-btn:hover {
  background: var(--color-error);
  color: var(--color-white);
}

/* Login Button */
.login-btn {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-lg);
  background: var(--color-primary);
  color: var(--color-white);
  border-radius: var(--radius-lg);
  font-weight: 600;
  font-size: 0.875rem;
  transition: var(--transition-fast);
}

.login-btn:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* Mobile Menu Button */
.mobile-menu-btn {
  display: none;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  color: var(--color-gray-600);
  cursor: pointer;
  border-radius: var(--radius-lg);
  transition: var(--transition-fast);
}

.mobile-menu-btn:hover {
  background: var(--color-gray-100);
  color: var(--color-primary);
}

/* Mobile Menu */
.mobile-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--color-white);
  border-bottom: 1px solid var(--color-gray-200);
  box-shadow: var(--shadow-lg);
  z-index: 999;
}

.mobile-nav {
  padding: var(--space-lg);
}

.mobile-nav-link {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  color: var(--color-gray-700);
  font-weight: 500;
  border-radius: var(--radius-lg);
  transition: var(--transition-fast);
  margin-bottom: var(--space-xs);
}

.mobile-nav-link:hover,
.mobile-nav-link.router-link-active {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.write-link {
  background: var(--color-accent);
  color: var(--color-white);
}

.write-link:hover {
  background: var(--color-accent-hover);
}

.login-link {
  background: var(--color-primary);
  color: var(--color-white);
}

.login-link:hover {
  background: var(--color-primary-hover);
}

.mobile-divider {
  height: 1px;
  background: var(--color-gray-200);
  margin: var(--space-lg) 0;
}

/* Backdrop */
.backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.1);
  z-index: 99;
}

/* Transitions */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all var(--transition-fast);
  transform-origin: top right;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}

.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: all var(--transition-fast);
}

.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Responsive */
@media (max-width: 1024px) {
  .search-input {
    width: 200px;
  }
}

@media (max-width: 768px) {
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
    width: 260px;
  }
}

@media (max-width: 480px) {
  .header-content {
    padding: var(--space-md) 0;
  }
  
  .logo-text {
    display: none;
  }
  
  .user-dropdown {
    width: 240px;
    right: -20px;
  }
}
</style>