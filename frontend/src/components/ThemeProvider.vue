<template>
  <div class="theme-provider" :class="themeClass">
    <slot />
  </div>
</template>

<script>
import { useUIStore } from '../stores/ui.store'

export default {
  name: 'ThemeProvider',
  setup() {
    const uiStore = useUIStore()
    const { isDark } = uiStore
    
    return {
      isDark
    }
  },
  computed: {
    themeClass() {
      return this.isDark ? 'dark' : 'light'
    }
  },
  watch: {
    isDark: {
      immediate: true,
      handler(newValue) {
        // 更新根元素的类名
        const root = document.documentElement
        if (newValue) {
          root.classList.remove('light')
          root.classList.add('dark')
        } else {
          root.classList.remove('dark')
          root.classList.add('light')
        }
      }
    }
  }
}
</script>

<style scoped>
.theme-provider {
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.3s ease, color 0.3s ease;
}
</style>