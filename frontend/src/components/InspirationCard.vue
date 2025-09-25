<template>
  <div class="inspiration-card">
    <!-- 用户信息 -->
    <div class="card-header">
      <div class="user-info">
        <img 
          :src="getAvatarUrl(inspiration.author.avatar, inspiration.author.username)" 
          :alt="inspiration.author.username"
          class="user-avatar"
        >
        <div class="user-details">
          <h4 class="username">{{ inspiration.author.username }}</h4>
          <span class="time">{{ formatTime(inspiration.created_at) }}</span>
        </div>
      </div>
      
      <!-- 操作菜单 -->
      <div class="card-actions" v-if="canDelete">
        <button @click="showMenu = !showMenu" class="menu-btn">
          <i class="fas fa-ellipsis-h"></i>
        </button>
        <div v-if="showMenu" class="action-menu">
          <button @click="handleDelete" class="delete-btn">
            <i class="fas fa-trash"></i>
            删除
          </button>
        </div>
      </div>
    </div>

    <!-- 内容 -->
    <div class="card-content">
      <p class="content-text" v-html="formatContent(inspiration.content)"></p>
      
      <!-- 图片网格 -->
      <div v-if="inspiration.images && inspiration.images.length > 0" class="images-grid">
        <div 
          v-for="(image, index) in inspiration.images" 
          :key="index"
          :class="getImageClass(inspiration.images.length, index)"
          class="image-item"
          @click="previewImage(image, index)"
        >
          <img :src="image" :alt="`图片 ${index + 1}`" />
        </div>
      </div>

      <!-- 标签 -->
      <div v-if="inspiration.tags && inspiration.tags.length > 0" class="tags">
        <span 
          v-for="tag in inspiration.tags" 
          :key="tag"
          class="tag"
          @click="searchTag(tag)"
        >
          #{{ tag }}
        </span>
      </div>

      <!-- 位置 -->
      <div v-if="inspiration.location" class="location">
        <i class="fas fa-map-marker-alt"></i>
        {{ inspiration.location }}
      </div>
    </div>

    <!-- 互动区域 -->
    <div class="card-footer">
      <div class="interactions">
        <button 
          @click="handleLike" 
          :class="{ liked: inspiration.isLiked }"
          class="interaction-btn like-btn"
        >
          <i :class="inspiration.isLiked ? 'fas fa-heart' : 'far fa-heart'"></i>
          <span>{{ inspiration.likes_count || 0 }}</span>
        </button>
        
        <button @click="showComments = !showComments" class="interaction-btn comment-btn">
          <i class="far fa-comment"></i>
          <span>{{ inspiration.comments_count || 0 }}</span>
        </button>
        
        <button @click="handleShare" class="interaction-btn share-btn">
          <i class="fas fa-share"></i>
          <span>分享</span>
        </button>
      </div>
    </div>

    <!-- 评论区域 -->
    <div v-if="showComments" class="comments-section">
      <div class="comment-input">
        <input 
          v-model="newComment"
          @keyup.enter="submitComment"
          placeholder="写下你的想法..."
          class="comment-field"
        >
        <button @click="submitComment" :disabled="!newComment.trim()" class="submit-btn">
          发送
        </button>
      </div>
      
      <!-- 评论列表 -->
      <div class="comments-list">
        <div class="comment-placeholder">
          <i class="fas fa-comments"></i>
          <span>评论功能即将上线</span>
        </div>
      </div>
    </div>

    <!-- 图片预览弹窗 -->
    <div v-if="showImagePreview" class="image-preview-modal" @click="closeImagePreview">
      <div class="preview-content" @click.stop>
        <button @click="closeImagePreview" class="close-btn">
          <i class="fas fa-times"></i>
        </button>
        <img :src="previewImageSrc" alt="预览图片" />
        <div v-if="inspiration.images.length > 1" class="preview-nav">
          <button @click="prevImage" :disabled="currentImageIndex === 0">
            <i class="fas fa-chevron-left"></i>
          </button>
          <span>{{ currentImageIndex + 1 }} / {{ inspiration.images.length }}</span>
          <button @click="nextImage" :disabled="currentImageIndex === inspiration.images.length - 1">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import { getAvatarUrl } from '../utils/image-url'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

export default {
  name: 'InspirationCard',
  props: {
    inspiration: {
      type: Object,
      required: true
    }
  },
  emits: ['like', 'delete'],
  data() {
    return {
      showMenu: false,
      showComments: false,
      newComment: '',
      showImagePreview: false,
      previewImageSrc: '',
      currentImageIndex: 0
    }
  },
  computed: {
    canDelete() {
      const currentUser = this.getCurrentUser()
      return currentUser && currentUser.id === this.inspiration.author.id
    }
  },
  methods: {
    getCurrentUser() {
      const userStr = localStorage.getItem('blog_user')
      return userStr ? JSON.parse(userStr) : null
    },

    getAvatarUrl(avatarPath, username) {
      return getAvatarUrl(avatarPath, username)
    },

    formatTime(time) {
      return dayjs(time).fromNow()
    },

    formatContent(content) {
      // 处理话题标签
      return content.replace(/#([^#\s]+)#/g, '<span class="topic-tag">#$1#</span>')
    },

    getImageClass(totalImages, index) {
      if (totalImages === 1) return 'single'
      if (totalImages === 2) return 'double'
      if (totalImages === 3) {
        return index === 0 ? 'triple-main' : 'triple-sub'
      }
      if (totalImages === 4) return 'quad'
      return 'grid'
    },

    previewImage(imageSrc, index) {
      this.previewImageSrc = imageSrc
      this.currentImageIndex = index
      this.showImagePreview = true
    },

    closeImagePreview() {
      this.showImagePreview = false
    },

    prevImage() {
      if (this.currentImageIndex > 0) {
        this.currentImageIndex--
        this.previewImageSrc = this.inspiration.images[this.currentImageIndex]
      }
    },

    nextImage() {
      if (this.currentImageIndex < this.inspiration.images.length - 1) {
        this.currentImageIndex++
        this.previewImageSrc = this.inspiration.images[this.currentImageIndex]
      }
    },

    handleLike() {
      this.$emit('like', this.inspiration.id)
    },

    handleDelete() {
      this.showMenu = false
      this.$emit('delete', this.inspiration.id)
    },

    handleShare() {
      if (navigator.share) {
        navigator.share({
          title: '分享灵感',
          text: this.inspiration.content,
          url: window.location.href
        })
      } else {
        // 复制链接
        navigator.clipboard.writeText(window.location.href)
        this.$message?.success('链接已复制到剪贴板')
      }
    },

    searchTag(tag) {
      // TODO: 实现标签搜索
      console.log('搜索标签:', tag)
    },

    submitComment() {
      if (!this.newComment.trim()) return
      
      // TODO: 实现评论功能
      console.log('提交评论:', this.newComment)
      this.newComment = ''
    }
  },
  mounted() {
    // 点击外部关闭菜单
    document.addEventListener('click', (e) => {
      if (!this.$el.contains(e.target)) {
        this.showMenu = false
      }
    })
  }
}
</script>

<style scoped>
.inspiration-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
}

.inspiration-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.card-header {
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.username {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0;
  color: #333;
}

.time {
  font-size: 0.8rem;
  color: #666;
}

.card-actions {
  position: relative;
}

.menu-btn {
  background: none;
  border: none;
  padding: 0.5rem;
  border-radius: 50%;
  cursor: pointer;
  color: #666;
  transition: all 0.3s ease;
}

.menu-btn:hover {
  background: #f0f0f0;
}

.action-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10;
  min-width: 100px;
}

.delete-btn {
  width: 100%;
  padding: 0.75rem;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  color: #e74c3c;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.delete-btn:hover {
  background: #f8f9fa;
}

.card-content {
  padding: 0 1rem 1rem;
}

.content-text {
  line-height: 1.6;
  margin-bottom: 1rem;
  color: #333;
}

.content-text :deep(.topic-tag) {
  color: #667eea;
  font-weight: 600;
  cursor: pointer;
}

.content-text :deep(.topic-tag):hover {
  text-decoration: underline;
}

.images-grid {
  display: grid;
  gap: 4px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.images-grid.single {
  grid-template-columns: 1fr;
}

.images-grid.double {
  grid-template-columns: 1fr 1fr;
}

.images-grid.triple {
  grid-template-columns: 2fr 1fr;
  grid-template-rows: 1fr 1fr;
}

.images-grid.quad {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
}

.image-item {
  cursor: pointer;
  overflow: hidden;
  position: relative;
}

.image-item.triple-main {
  grid-row: 1 / 3;
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.image-item:hover img {
  transform: scale(1.05);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.tag {
  background: #f0f2ff;
  color: #667eea;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tag:hover {
  background: #667eea;
  color: white;
}

.location {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
}

.card-footer {
  padding: 0.75rem 1rem;
  border-top: 1px solid #f0f0f0;
}

.interactions {
  display: flex;
  gap: 1rem;
}

.interaction-btn {
  background: none;
  border: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #666;
  font-size: 0.9rem;
}

.interaction-btn:hover {
  background: #f0f0f0;
}

.like-btn.liked {
  color: #e74c3c;
}

.like-btn.liked:hover {
  background: #ffeaea;
}

.comments-section {
  border-top: 1px solid #f0f0f0;
  padding: 1rem;
}

.comment-input {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.comment-field {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 20px;
  outline: none;
}

.comment-field:focus {
  border-color: #667eea;
}

.submit-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.comment-placeholder {
  text-align: center;
  color: #999;
  padding: 1rem;
}

.image-preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.preview-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
}

.preview-content img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.close-btn {
  position: absolute;
  top: -40px;
  right: 0;
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
}

.preview-nav {
  position: absolute;
  bottom: -50px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 1rem;
  color: white;
}

.preview-nav button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 0.5rem;
  border-radius: 50%;
  cursor: pointer;
}

.preview-nav button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .inspiration-card {
    margin: 0 -0.5rem;
    border-radius: 0;
  }
  
  .images-grid.triple,
  .images-grid.quad {
    grid-template-columns: 1fr 1fr;
  }
  
  .interactions {
    justify-content: space-around;
  }
}
</style>