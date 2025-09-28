<template>
  <div class="logo" :class="{ 'logo-small': size === 'small', 'logo-large': size === 'large' }">
    <div class="logo-icon">
      <div class="logo-container">
        <div class="logo-box">
          <span class="logo-text-inner">寻 我</span>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
export default {
  name: 'Logo',
  props: {
    size: {
      type: String,
      default: 'medium', // small, medium, large
      validator: (value) => ['small', 'medium', 'large'].includes(value)
    },
    showText: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    iconSize() {
      const sizes = {
        small: 32,
        medium: 48,
        large: 64
      }
      return sizes[this.size] || sizes.medium
    }
  }
}
</script>

<style scoped>
.logo {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  transition: all var(--transition-fast);
}

.logo:hover {
  transform: translateY(-1px);
}

.logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-box {
  border-radius: var(--radius-lg);
  padding: var(--space-2) var(--space-4);
  transition: all var(--transition-fast);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-box::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%);
  opacity: 0.03;
  border-radius: inherit;
}

.logo-text-inner {
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
  letter-spacing: 0.15em;
  position: relative;
  z-index: 1;
  white-space: nowrap;
  line-height: 1;
}

.logo:hover .logo-box {
  transform: translateY(-1px);
}

.logo:hover .logo-box::before {
  opacity: 0.06;
}

.logo:hover .logo-text-inner {
  color: var(--text-primary);
}

/* 尺寸变化 */
.logo-small .logo-box {
  padding: var(--space-1-5) var(--space-3);
  border-radius: var(--radius-md);
}

.logo-small .logo-text-inner {
  font-size: var(--text-sm);
  letter-spacing: 0.12em;
}

.logo-large .logo-box {
  padding: var(--space-2-5) var(--space-5);
  border-radius: var(--radius-xl);
}

.logo-large .logo-text-inner {
  font-size: var(--text-xl);
  letter-spacing: 0.18em;
}

.logo-small {
  gap: var(--space-2);
}

.logo-large {
  gap: var(--space-4);
}



/* 响应式 */
@media (max-width: 768px) {
  .logo-text-inner {
    font-size: var(--text-base);
  }
  
  .logo-large .logo-text-inner {
    font-size: var(--text-lg);
  }
}

/* 减少动画偏好支持 */
@media (prefers-reduced-motion: reduce) {
  .logo,
  .logo-box,
  .logo-text-inner {
    transition: none;
  }
  
  .logo:hover {
    transform: none;
  }
  
  .logo:hover .logo-box {
    transform: none;
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .logo-text-inner {
    -webkit-text-fill-color: var(--text-primary);
    background: none;
  }
}

/* 打印样式 */
@media print {
  .logo-text-inner {
    color: black !important;
    text-shadow: none;
  }
}
</style>