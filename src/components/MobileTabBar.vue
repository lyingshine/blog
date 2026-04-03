<template>
  <div class="mobile-tabbar-wrap">
    <Transition name="sheet-fade">
      <div v-if="isComposeOpen" class="compose-backdrop" @click="closeCompose"></div>
    </Transition>

    <Transition name="sheet-up">
      <div v-if="isComposeOpen" class="compose-sheet">
        <button class="compose-item" type="button" @click="goCreate('moments')">
          <span class="compose-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </span>
          发动态
        </button>
        <button class="compose-item" type="button" @click="goCreate('article')">
          <span class="compose-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          </span>
          写文章
        </button>
      </div>
    </Transition>

    <nav class="mobile-tabbar">
      <button class="tab-item" :class="{ active: isActive('/') }" type="button" @click="goTo('/')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span>首页</span>
      </button>

      <button class="tab-item" :class="{ active: isActive('/discovery') }" type="button" @click="goTo('/discovery')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
        </svg>
        <span>发现</span>
      </button>

      <button class="tab-item tab-compose" :class="{ active: isComposeOpen }" type="button" @click="toggleCompose">
        <span class="plus-icon" aria-hidden="true"></span>
      </button>

      <button class="tab-item" :class="{ active: isActive('/messages') }" type="button" @click="goTo('/messages')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <span>消息</span>
        <span v-if="notificationsStore.unreadCount > 0" class="tab-badge">
          {{ notificationsStore.unreadCount > 99 ? '99+' : notificationsStore.unreadCount }}
        </span>
      </button>

      <button class="tab-item" :class="{ active: isActive('/about') || isActive('/login') }" type="button" @click="goMine">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <circle cx="12" cy="10" r="3"/>
          <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/>
        </svg>
        <span>我的</span>
      </button>
    </nav>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useNotificationsStore } from '../stores/notifications'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const notificationsStore = useNotificationsStore()
const isComposeOpen = ref(false)

const closeCompose = () => {
  isComposeOpen.value = false
}

const toggleCompose = () => {
  isComposeOpen.value = !isComposeOpen.value
}

const isActive = (path) => {
  if (path === '/') return route.path === '/'
  return route.path === path || route.path.startsWith(`${path}/`)
}

const goTo = (path) => {
  closeCompose()
  if (route.path !== path) router.push(path)
}

const goMine = () => {
  goTo(authStore.isLoggedIn ? '/about' : '/login')
}

const goCreate = (type) => {
  closeCompose()
  if (!authStore.isLoggedIn) {
    router.push('/login')
    return
  }
  if (type === 'moments') router.push('/moments')
  if (type === 'article') router.push('/write')
}

watch(
  () => route.fullPath,
  () => closeCompose()
)

watch(isComposeOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})
</script>

<style scoped>
.mobile-tabbar-wrap {
  display: none;
}

@media (max-width: 768px) {
  .mobile-tabbar-wrap {
    display: block;
    --tabbar-core-height: clamp(60px, 7.6dvh, 70px);
    --tabbar-safe-bottom: max(8px, calc(var(--safe-bottom) * 0.45));
  }

  .mobile-tabbar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    height: calc(var(--tabbar-core-height) + var(--tabbar-safe-bottom));
    padding: 1px max(8px, var(--safe-right)) calc(1px + var(--tabbar-safe-bottom)) max(8px, var(--safe-left));
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    align-items: center;
    gap: clamp(0px, 0.7vw, 2px);
    border-top: 0.25px solid color-mix(in srgb, var(--color-border) 32%, var(--color-border-light));
    background: color-mix(in srgb, var(--color-surface) 96%, transparent);
    backdrop-filter: blur(10px) saturate(140%);
    -webkit-backdrop-filter: blur(10px) saturate(140%);
    box-shadow: 0 -6px 18px rgba(7, 13, 28, 0.12);
    z-index: 1200;
  }

  .tab-item {
    height: calc(var(--tabbar-core-height) - 8px);
    border: none;
    border-radius: clamp(10px, 3vw, 14px);
    background: transparent;
    color: var(--color-text-tertiary);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0;
    font-size: 11px;
    font-weight: 600;
    position: relative;
    transition:
      color var(--motion-base) var(--motion-smooth),
      transform var(--motion-fast) var(--motion-spring),
      opacity var(--motion-fast) var(--motion-smooth);
  }

  .tab-badge {
    position: absolute;
    top: 2px;
    right: 5px;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    border-radius: 999px;
    background: #ef4444;
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    line-height: 16px;
    text-align: center;
  }

  .tab-item svg {
    width: 17px;
    height: 17px;
  }

  .tab-item.active {
    color: var(--color-accent);
    background: transparent;
  }

  .tab-item:active {
    transform: translateY(1px) scale(0.98);
  }

  .tab-compose {
    position: relative;
    overflow: hidden;
    background: var(--color-surface-elevated);
    color: var(--color-accent);
    transform: none;
    border-radius: 12px;
    height: calc(var(--tabbar-core-height) - 18px);
    width: calc(var(--tabbar-core-height) - 18px);
    margin: 0 auto;
    align-self: center;
    border: none;
    box-shadow: 0 6px 14px rgba(7, 13, 28, 0.14);
    transition: transform var(--motion-fast) var(--motion-spring), box-shadow var(--motion-base) var(--motion-smooth), background-color var(--motion-base) var(--motion-smooth);
  }

  .tab-compose.active {
    transform: translateY(0) scale(0.97);
    background: color-mix(in srgb, var(--color-accent) 10%, var(--color-surface-elevated));
    box-shadow: 0 4px 10px rgba(7, 13, 28, 0.12);
  }

  .plus-icon {
    width: 21px;
    height: 21px;
    position: relative;
    display: block;
    filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.14));
  }

  .plus-icon::before,
  .plus-icon::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    background: currentColor;
    border-radius: 999px;
    transform: translate(-50%, -50%);
  }

  .plus-icon::before {
    width: 12px;
    height: 2.2px;
  }

  .plus-icon::after {
    width: 2.2px;
    height: 12px;
  }

  .compose-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.28);
    z-index: 1198;
  }

  .compose-sheet {
    position: fixed;
    left: max(12px, var(--safe-left));
    right: max(12px, var(--safe-right));
    bottom: calc(var(--tabbar-core-height) + 14px + var(--tabbar-safe-bottom));
    display: grid;
    gap: 10px;
    padding: 12px;
    border-radius: 16px;
    border: 1px solid color-mix(in srgb, var(--color-border) 76%, var(--color-border-light));
    background: color-mix(in srgb, var(--color-surface) 96%, transparent);
    box-shadow: 0 14px 32px rgba(9, 16, 33, 0.22);
    z-index: 1199;
  }

  .compose-item {
    min-height: 46px;
    border: 1px solid color-mix(in srgb, var(--color-border-light) 84%, var(--color-border));
    border-radius: 12px;
    background: color-mix(in srgb, var(--color-surface-elevated) 88%, transparent);
    color: var(--color-text-primary);
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
  }

  .compose-icon {
    width: 20px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--color-accent);
  }

  .sheet-fade-enter-active,
  .sheet-fade-leave-active,
  .sheet-up-enter-active,
  .sheet-up-leave-active {
    transition: all var(--motion-base) var(--motion-spring);
  }

  .sheet-fade-enter-from,
  .sheet-fade-leave-to {
    opacity: 0;
  }

  .sheet-up-enter-from,
  .sheet-up-leave-to {
    opacity: 0;
    transform: translateY(12px) scale(0.99);
  }

  @media (max-width: 360px) {
    .tab-item {
      font-size: 10px;
    }
  }
}
</style>
