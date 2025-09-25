<template>
  <div v-if="visible" :class="messageClass" class="message">
    <div class="message-content">
      <span class="message-icon">{{ messageIcon }}</span>
      <span class="message-text">{{ message }}</span>
    </div>
    <button @click="close" class="message-close">×</button>
  </div>
</template>

<script>
export default {
  name: 'Message',
  props: {
    type: {
      type: String,
      default: 'info',
      validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
    },
    message: {
      type: String,
      required: true
    },
    duration: {
      type: Number,
      default: 3000
    },
    closable: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      visible: true,
      timer: null
    }
  },
  computed: {
    messageClass() {
      return `message-${this.type}`
    },
    messageIcon() {
      const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
      }
      return icons[this.type] || icons.info
    }
  },
  mounted() {
    if (this.duration > 0) {
      this.timer = setTimeout(() => {
        this.close()
      }, this.duration)
    }
  },
  beforeUnmount() {
    if (this.timer) {
      clearTimeout(this.timer)
    }
  },
  methods: {
    close() {
      this.visible = false
      this.$emit('close')
    }
  }
}
</script>

<style scoped>
.message {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 300px;
  max-width: 500px;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.message-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.message-icon {
  font-size: 16px;
}

.message-text {
  font-size: 14px;
  line-height: 1.4;
}

.message-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  margin-left: 12px;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.message-close:hover {
  opacity: 1;
}

.message-success {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  color: #0c4a6e;
}

.message-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

.message-warning {
  background: #fffbeb;
  border: 1px solid #fed7aa;
  color: #92400e;
}

.message-info {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  color: #0c4a6e;
}

@media (max-width: 768px) {
  .message {
    left: 20px;
    right: 20px;
    min-width: auto;
  }
}
</style>