import { computed, ref } from 'vue'

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const getScrollTop = () => window.scrollY || document.documentElement.scrollTop || 0

export function usePullToRefresh(onRefresh, options = {}) {
  const threshold = options.threshold ?? 72
  const maxPull = options.maxPull ?? 110
  const holdHeight = options.holdHeight ?? 54
  const maxRefreshMs = options.maxRefreshMs ?? 8000
  const triggerCooldownMs = options.triggerCooldownMs ?? 1200

  const pullDistance = ref(0)
  const refreshing = ref(false)
  const tracking = ref(false)
  const blocking = ref(false)
  let startY = 0
  let lastTriggerAt = 0

  const ready = computed(() => tracking.value && pullDistance.value >= threshold)
  const visible = computed(() => (tracking.value && pullDistance.value > 6) || refreshing.value)

  const damp = (delta) => {
    if (delta <= 0) return 0
    const softened = delta * 0.55
    return Math.min(maxPull, softened)
  }

  const resetPull = () => {
    pullDistance.value = 0
    tracking.value = false
    blocking.value = false
    startY = 0
  }

  const onTouchStart = (event) => {
    if (!event.touches || event.touches.length !== 1) return
    if (getScrollTop() > 2) {
      resetPull()
      return
    }
    const target = event.target
    if (
      target instanceof Element &&
      (target.closest('.navbar') || target.closest('input, textarea, select, [contenteditable="true"]'))
    ) {
      return
    }
    const now = Date.now()
    if (refreshing.value || now - lastTriggerAt < triggerCooldownMs) {
      pullDistance.value = 0
      startY = event.touches[0].clientY
      tracking.value = false
      blocking.value = true
      return
    }
    pullDistance.value = 0
    startY = event.touches[0].clientY
    tracking.value = true
    blocking.value = false
  }

  const onTouchMove = (event) => {
    if (!event.touches || event.touches.length !== 1) return
    if (getScrollTop() > 2) {
      resetPull()
      return
    }
    const delta = event.touches[0].clientY - startY

    if (blocking.value) {
      if (delta > 0 && event.cancelable) {
        event.preventDefault()
      }
      return
    }

    if (!tracking.value || refreshing.value) return
    if (delta <= 0) {
      pullDistance.value = 0
      return
    }
    if (event.cancelable) {
      event.preventDefault()
    }
    pullDistance.value = damp(delta)
  }

  const onTouchCancel = () => {
    if (refreshing.value) return
    resetPull()
  }

  const onTouchEnd = async () => {
    if (!tracking.value || refreshing.value) {
      resetPull()
      return
    }

    if (!ready.value) {
      resetPull()
      return
    }

    refreshing.value = true
    pullDistance.value = holdHeight
    tracking.value = false
    lastTriggerAt = Date.now()
    try {
      await Promise.all([
        Promise.race([Promise.resolve(onRefresh?.()), wait(maxRefreshMs)]),
        wait(280)
      ])
    } finally {
      refreshing.value = false
      resetPull()
    }
  }

  return {
    offset: pullDistance,
    visible,
    ready,
    refreshing,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel
  }
}
