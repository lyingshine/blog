<script setup>
import { onMounted, watch } from 'vue'
import NavBar from './components/NavBar.vue'
import SiteFooter from './components/SiteFooter.vue'
import MobileTabBar from './components/MobileTabBar.vue'
import { useAuthStore } from './stores/auth'
import { useNotificationsStore } from './stores/notifications'

const authStore = useAuthStore()
const notificationsStore = useNotificationsStore()

onMounted(() => {
  notificationsStore.init()
})

watch(
  () => authStore.isLoggedIn,
  () => {
    notificationsStore.init()
  }
)
</script>

<template>
  <div id="app">
    <NavBar />
    <main>
      <router-view v-slot="{ Component, route }">
        <Transition name="route-fade" mode="out-in">
          <div class="route-page" :key="route.path">
            <component :is="Component" />
          </div>
        </Transition>
      </router-view>
    </main>
    <MobileTabBar />
    <SiteFooter />
  </div>
</template>

<style scoped>
#app {
  min-height: 100dvh;
  background: var(--color-bg);
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
}

.route-fade-enter-active,
.route-fade-leave-active {
  transition: opacity 180ms var(--motion-smooth);
}

.route-fade-enter-from,
.route-fade-leave-to {
  opacity: 0;
}

.route-page {
  will-change: opacity;
  transform: translateZ(0);
  backface-visibility: hidden;
}

@media (max-width: 768px) {
  main {
    padding-bottom: calc(10dvh + var(--safe-bottom));
  }
}
</style>
