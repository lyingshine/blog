<script setup>
import NavBar from './components/NavBar.vue'
import SiteFooter from './components/SiteFooter.vue'
</script>

<template>
  <div id="app">
    <NavBar />
    <main>
      <router-view />
    </main>
    <SiteFooter />
  </div>
</template>

<style scoped>
#app {
  min-height: 100vh;
  background: var(--color-bg);
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
}
</style>
