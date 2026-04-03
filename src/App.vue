<script setup>
import { onMounted, ref, watch } from 'vue'
import NavBar from './components/NavBar.vue'
import SiteFooter from './components/SiteFooter.vue'
import MobileTabBar from './components/MobileTabBar.vue'
import { useAuthStore } from './stores/auth'
import { useNotificationsStore } from './stores/notifications'

const authStore = useAuthStore()
const notificationsStore = useNotificationsStore()
const showLaunchSplash = ref(false)

const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true

onMounted(() => {
  notificationsStore.init()
  showLaunchSplash.value = isStandalone()
  if (showLaunchSplash.value) {
    window.setTimeout(() => {
      showLaunchSplash.value = false
    }, 420)
  }
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
    <Transition name="launch-splash">
      <div v-if="showLaunchSplash" class="launch-splash" aria-hidden="true">
        <div class="launch-brand">
          <div class="launch-dot"></div>
          <span>MySelf</span>
        </div>
      </div>
    </Transition>
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
  --nav-height: 48px;
}

main {
  flex: 1;
  padding-top: var(--nav-height);
}

.route-fade-enter-active,
.route-fade-leave-active {
  transition:
    opacity 180ms var(--motion-smooth),
    transform 220ms var(--motion-smooth);
}

.route-fade-enter-from,
.route-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

.route-page {
  will-change: opacity, transform;
  transform: translateZ(0);
  backface-visibility: hidden;
}

.launch-splash {
  position: fixed;
  inset: 0;
  z-index: 2500;
  background: linear-gradient(155deg, var(--color-bg) 0%, color-mix(in srgb, var(--color-accent-subtle) 36%, var(--color-bg)) 100%);
  display: grid;
  place-items: center;
}

.launch-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 24px;
  font-weight: 680;
  letter-spacing: -0.02em;
  color: var(--color-text-primary);
}

.launch-dot {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: var(--color-accent);
  box-shadow: 0 0 0 8px color-mix(in srgb, var(--color-accent) 16%, transparent);
}

.launch-splash-enter-active,
.launch-splash-leave-active {
  transition: opacity 220ms var(--motion-smooth);
}

.launch-splash-enter-from,
.launch-splash-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  main {
    padding-bottom: calc(clamp(60px, 7.6dvh, 70px) + max(8px, calc(var(--safe-bottom) * 0.45)));
  }
}
</style>
