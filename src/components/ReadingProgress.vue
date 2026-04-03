<template>
  <div class="reading-progress" v-if="show">
    <div class="progress-bar" :style="{ width: `${progress}%` }"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'

const props = defineProps({
  target: {
    type: String,
    default: '.article-body'
  }
})

const progress = ref(0)
const show = ref(false)

const calculateProgress = () => {
  const targetEl = document.querySelector(props.target)
  if (!targetEl) return

  const rect = targetEl.getBoundingClientRect()
  const windowHeight = window.innerHeight
  const docHeight = document.documentElement.scrollHeight - windowHeight

  const scrolled = window.scrollY
  const targetStart = targetEl.offsetTop
  const targetHeight = targetEl.offsetHeight

  if (scrolled < targetStart - windowHeight) {
    progress.value = 0
    show.value = false
  } else if (scrolled > targetStart + targetHeight) {
    progress.value = 100
    show.value = true
  } else {
    const relativeScroll = scrolled - targetStart + windowHeight
    const totalHeight = targetHeight + windowHeight
    progress.value = Math.min(100, Math.max(0, (relativeScroll / totalHeight) * 100))
    show.value = scrolled > 200
  }
}

onMounted(() => {
  window.addEventListener('scroll', calculateProgress, { passive: true })
  calculateProgress()
})

onUnmounted(() => {
  window.removeEventListener('scroll', calculateProgress)
})
</script>

<style scoped>
.reading-progress {
  position: fixed;
  top: var(--safe-top);
  left: 0;
  right: 0;
  height: 3px;
  background: var(--color-border-light);
  z-index: 1001;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(
    90deg,
    var(--color-accent) 0%,
    color-mix(in srgb, var(--color-accent) 62%, #66b0ff) 100%
  );
  transition: width 0.1s ease-out;
  border-radius: 0 2px 2px 0;
}
</style>
