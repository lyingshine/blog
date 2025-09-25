import { ref, watch } from 'vue'

// 暗黑模式状态
const isDark = ref(false)

// 初始化暗黑模式
const initDarkMode = () => {
  // 从 localStorage 获取用户偏好
  const savedTheme = localStorage.getItem('blog_theme')
  
  if (savedTheme) {
    isDark.value = savedTheme === 'dark'
  } else {
    // 如果没有保存的偏好，检查系统偏好
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  
  // 应用主题
  applyTheme()
  
  // 监听系统主题变化
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('blog_theme')) {
      isDark.value = e.matches
    }
  })
}

// 应用主题
const applyTheme = () => {
  if (isDark.value) {
    document.documentElement.classList.add('dark')
    document.documentElement.classList.remove('light')
  } else {
    document.documentElement.classList.add('light')
    document.documentElement.classList.remove('dark')
  }
}

// 切换暗黑模式
const toggleDarkMode = () => {
  isDark.value = !isDark.value
  localStorage.setItem('blog_theme', isDark.value ? 'dark' : 'light')
  applyTheme()
}

// 设置主题
const setTheme = (theme) => {
  isDark.value = theme === 'dark'
  localStorage.setItem('blog_theme', theme)
  applyTheme()
}

// 监听 isDark 变化
watch(isDark, applyTheme)

export function useDarkMode() {
  return {
    isDark,
    initDarkMode,
    toggleDarkMode,
    setTheme
  }
}