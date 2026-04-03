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
