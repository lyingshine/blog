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
