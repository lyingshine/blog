<template>
  <div class="theme-switcher">
    <button class="theme-toggle" @click="togglePanel" :aria-label="'切换主题'">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="5"/>
        <line x1="12" y1="1" x2="12" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/>
        <line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>
    </button>

    <Transition name="panel">
      <div v-if="isOpen" class="theme-panel" @click.stop>
        <div class="panel-header">
          <span class="panel-title">外观</span>
          <button class="panel-close" @click="closePanel">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="themes-grid">
          <button
            v-for="theme in themes"
            :key="theme.id"
            class="theme-option"
            :class="{ active: currentTheme === theme.id }"
            @click="selectTheme(theme.id)"
          >
            <div class="theme-preview" :style="theme.preview">
              <div class="preview-nav"></div>
              <div class="preview-content">
                <div class="preview-card"></div>
                <div class="preview-card"></div>
              </div>
              <div class="preview-accent" :style="{ background: theme.accent }"></div>
            </div>
            <span class="theme-name">{{ theme.name }}</span>
            <div v-if="currentTheme === theme.id" class="theme-check">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
          </button>
        </div>
      </div>
    </Transition>

    <div v-if="isOpen" class="panel-backdrop" @click="closePanel"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const isOpen = ref(false)
const currentTheme = ref('classic')

const themes = [
  {
    id: 'classic',
    name: '经典白',
    accent: '#0071e3',
    preview: {
      background: '#ffffff',
      '--preview-text': '#1d1d1f',
      '--preview-card': '#f5f5f7',
      '--preview-border': '#e8e8ed'
    }
  },
  {
    id: 'dark',
    name: '深夜黑',
    accent: '#0a84ff',
    preview: {
      background: '#1c1c1e',
      '--preview-text': '#f5f5f7',
      '--preview-card': '#2c2c2e',
      '--preview-border': '#38383a'
    }
  },
  {
    id: 'midnight',
    name: '午夜蓝',
    accent: '#4da6ff',
    preview: {
      background: '#1b2838',
      '--preview-text': '#e0e8f0',
      '--preview-card': '#243447',
      '--preview-border': '#2d3e50'
    }
  },
  {
    id: 'sand',
    name: '暖沙金',
    accent: '#b45309',
    preview: {
      background: '#faf8f5',
      '--preview-text': '#3d3225',
      '--preview-card': '#f0ebe4',
      '--preview-border': '#e5ddd4'
    }
  },
  {
    id: 'mist',
    name: '薄雾灰',
    accent: '#5856d6',
    preview: {
      background: '#f2f2f7',
      '--preview-text': '#1c1c1e',
      '--preview-card': '#e5e5ea',
      '--preview-border': '#c6c6c8'
    }
  }
]

const togglePanel = () => {
  isOpen.value = !isOpen.value
}

const closePanel = () => {
  isOpen.value = false
}

const selectTheme = (themeId) => {
  currentTheme.value = themeId
  document.documentElement.setAttribute('data-theme', themeId)
  localStorage.setItem('blog-theme', themeId)
}

onMounted(() => {
  const savedTheme = localStorage.getItem('blog-theme')
  if (savedTheme && themes.find(t => t.id === savedTheme)) {
    currentTheme.value = savedTheme
    document.documentElement.setAttribute('data-theme', savedTheme)
  } else {
    document.documentElement.setAttribute('data-theme', 'classic')
  }
})

watch(currentTheme, (newTheme) => {
  document.documentElement.setAttribute('data-theme', newTheme)
})
</script>

<style scoped>
.theme-switcher {
  position: relative;
}

.theme-toggle {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border-radius: 50%;
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
}

.theme-toggle:hover {
  background: var(--color-accent-subtle);
  color: var(--color-accent);
}

.panel-backdrop {
  position: fixed;
  inset: 0;
  z-index: 99;
}

.theme-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 320px;
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  z-index: 100;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border-light);
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.panel-close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border-radius: 50%;
  color: var(--color-text-tertiary);
  transition: all var(--transition-fast);
}

.panel-close:hover {
  background: var(--color-accent-subtle);
  color: var(--color-text-primary);
}

.themes-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 20px;
}

.theme-option {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: transparent;
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.theme-option:hover {
  background: var(--color-accent-subtle);
}

.theme-option.active {
  border-color: var(--color-accent);
}

.theme-preview {
  width: 100%;
  height: 80px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 1px solid var(--preview-border);
  position: relative;
}

.preview-nav {
  height: 16px;
  background: var(--preview-card);
  border-bottom: 1px solid var(--preview-border);
}

.preview-content {
  display: flex;
  gap: 6px;
  padding: 8px;
}

.preview-card {
  flex: 1;
  height: 40px;
  background: var(--preview-card);
  border-radius: 4px;
}

.preview-accent {
  position: absolute;
  right: 6px;
  bottom: 6px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  opacity: 0.9;
}

.theme-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.theme-option.active .theme-name {
  color: var(--color-accent);
}

.theme-check {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--color-accent);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.panel-enter-active,
.panel-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.panel-enter-from,
.panel-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.96);
}

@media (max-width: 768px) {
  .theme-panel {
    position: fixed;
    top: auto;
    right: 0;
    left: 0;
    bottom: 0;
    width: 100%;
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  }

  .themes-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
