import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'

// Ensure theme variables are always available before the app renders.
const availableThemes = new Set(['classic', 'dark', 'midnight', 'sand', 'mist'])
const savedTheme = localStorage.getItem('blog-theme')
const initialTheme = availableThemes.has(savedTheme) ? savedTheme : 'classic'
document.documentElement.setAttribute('data-theme', initialTheme)

const getThemeColor = (theme) => {
  if (theme === 'dark') return '#000000'
  if (theme === 'midnight') return '#0d1b2a'
  if (theme === 'mist') return '#f2f2f7'
  if (theme === 'sand') return '#faf8f5'
  return '#fbfbfd'
}

const syncSystemUiTheme = () => {
  const theme = document.documentElement.getAttribute('data-theme') || 'classic'
  const isDarkLike = theme === 'dark' || theme === 'midnight'
  const themeColorMeta = document.querySelector('meta[name="theme-color"]')
  const appleStatusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')

  if (themeColorMeta) {
    themeColorMeta.setAttribute('content', getThemeColor(theme))
  }
  if (appleStatusBarMeta) {
    appleStatusBarMeta.setAttribute('content', isDarkLike ? 'black' : 'black-translucent')
  }
}

const syncStandaloneFlag = () => {
  const standalone =
    window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
  document.documentElement.classList.toggle('is-standalone', !!standalone)
}

syncSystemUiTheme()
syncStandaloneFlag()

const themeObserver = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
      syncSystemUiTheme()
      break
    }
  }
})

themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
window.matchMedia?.('(display-mode: standalone)')?.addEventListener('change', syncStandaloneFlag)

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.mount('#app')

const canRegisterSw =
  'serviceWorker' in navigator &&
  (import.meta.env.PROD ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1')

if (canRegisterSw) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Service worker registration failed:', error)
    })
  })
}
