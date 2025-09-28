<template>
  <ThemeProvider>
    <div id="app">
      <Header />
      <main class="main-content">
        <router-view />
      </main>
      <Footer />
    </div>
  </ThemeProvider>
</template>

<script>
import Header from './components/Header.vue'
import Footer from './components/Footer.vue'
import ThemeProvider from './components/ThemeProvider.vue'

export default {
  name: 'App',
  components: {
    Header,
    Footer,
    ThemeProvider
  }
}
</script>

<style>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.3s ease, color 0.3s ease;
}

.main-content {
  flex: 1;
  background: var(--bg-primary);
  width: 100%;
}

/* 确保所有页面都有统一的背景 */
.main-content > * {
  background: inherit;
}
</style>