<template>
  <div class="user-avatar" :class="{ 'avatar-loading': loading }">
    <img
      :src="currentAvatarUrl"
      :alt="`${username}的头像`"
      :class="avatarClass"
      @load="onLoad"
      @error="onError"
      :style="{ width: size, height: size }"
    />
    <div v-if="loading" class="avatar-loading-overlay">
      <div class="loading-spinner"></div>
    </div>
  </div>
</template>

<script>
import { getAvatarUrl, generateDefaultAvatar, handleImageError } from '../utils/image-url';

export default {
  name: 'UserAvatar',
  props: {
    // 头像URL
    avatar: {
      type: String,
      default: ''
    },
    // 用户名（用于生成默认头像）
    username: {
      type: String,
      required: true
    },
    // 头像大小
    size: {
      type: String,
      default: '40px'
    },
    // 头像样式类
    avatarClass: {
      type: String,
      default: 'rounded-full'
    },
    // 默认头像风格
    fallbackStyle: {
      type: String,
      default: 'initials',
      validator: (value) => ['initials', 'avataaars', 'personas', 'bottts', 'identicon'].includes(value)
    },
    // 是否显示加载状态
    showLoading: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      loading: false,
      hasError: false,
      currentAvatarUrl: ''
    };
  },
  computed: {
    safeAvatarUrl() {
      return getAvatarUrl(this.avatar, this.username);
    }
  },
  watch: {
    avatar: {
      immediate: true,
      handler(newAvatar) {
        this.loadAvatar();
      }
    },
    username: {
      immediate: true,
      handler() {
        this.loadAvatar();
      }
    }
  },
  methods: {
    loadAvatar() {
      this.hasError = false;
      this.currentAvatarUrl = this.safeAvatarUrl;
      
      if (this.showLoading) {
        this.loading = true;
      }
    },
    
    onLoad() {
      this.loading = false;
      this.hasError = false;
    },
    
    onError(event) {
      this.loading = false;
      
      // 使用工具函数处理错误
      handleImageError(event, this.username, this.fallbackStyle);
      this.currentAvatarUrl = event.target.src;
      this.hasError = true;
      
      // 发出错误事件，让父组件知道
      this.$emit('avatar-error', {
        originalUrl: this.avatar,
        fallbackUrl: this.currentAvatarUrl,
        username: this.username
      });
    },
    
    // 手动重新加载头像
    reload() {
      this.loadAvatar();
    }
  }
};
</script>

<style scoped>
.user-avatar {
  position: relative;
  display: inline-block;
}

.user-avatar img {
  display: block;
  object-fit: cover;
  transition: opacity 0.3s ease;
}

.avatar-loading img {
  opacity: 0.7;
}

.avatar-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: inherit;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 常用的头像样式 */
.rounded-full {
  border-radius: 50%;
}

.rounded {
  border-radius: 8px;
}

.square {
  border-radius: 0;
}
</style>