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
      <InspirationComments
        :inspiration-id="inspiration.id"
        :visible="showComments"
        @comment-added="handleCommentAdded"
        @comment-deleted="handleCommentDeleted"
      />
    </div>

    <!-- 转发弹窗 -->
    <div v-if="showShareModal" class="share-modal" @click="closeShareModal">
      <div class="share-content" @click.stop>
        <div class="share-header">
          <h3>转发灵感</h3>
          <button @click="closeShareModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="original-inspiration">
          <div class="original-header">
            <img 
              :src="getAvatarUrl(inspiration.author.avatar, inspiration.author.username)" 
              :alt="inspiration.author.username"
              class="user-avatar small"
            >
            <span class="username">{{ inspiration.author.username }}</span>
            <span class="time">{{ formatTime(inspiration.created_at) }}</span>
          </div>
          <div class="original-content">
            {{ inspiration.content }}
          </div>
        </div>

        <div class="share-input">
          <textarea 
            v-model="shareContent"
            placeholder="说点什么..."
            class="share-field"
            rows="3"
          ></textarea>
          <div class="char-count" :class="{ warning: shareContent.length > 450 }">
            {{ shareContent.length }}/500
          </div>
        </div>

        <div class="share-actions">
          <button @click="closeShareModal" class="cancel-btn">取消</button>
          <button 
            @click="confirmShare" 
            :disabled="shareContent.length > 500 || sharing"
            class="confirm-btn"
          >
            <i v-if="sharing" class="fas fa-spinner fa-spin"></i>
            <span>{{ sharing ? '转发中...' : '转发' }}</span>
          </button>
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
        <div v-if="inspiration.images && inspiration.images.length > 1" class="preview-nav">
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
import { inspirationsAPI } from '../utils/inspirations-api'
import InspirationComments from './InspirationComments.vue'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

export default {
  name: 'InspirationCard',
  components: {
    InspirationComments
  },
  props: {
    inspiration: {
      type: Object,
      required: true
    }
  },
  emits: ['like', 'delete', 'share', 'comment-count-change', 'search-tag'],
  data() {
    return {
      showMenu: false,
      showComments: false,
      showImagePreview: false,
      previewImageSrc: '',
      currentImageIndex: 0,
      showShareModal: false,
      shareContent: '',
      sharing: false,
      likeTimeout: null,
      likeRetryCount: 0,
      originalLikeState: null,
      originalLikeCount: null
    }
  },
  computed: {
    canDelete() {
      const user = JSON.parse(localStorage.getItem('blog_user') || '{}')
      return user.id === this.inspiration.user_id
    }
  },
  methods: {
    getAvatarUrl,
    
    formatTime(time) {
      return dayjs(time).fromNow()
    },
    
    formatContent(content) {
      if (!content) return ''
      
      // 处理换行
      let formatted = content.replace(/\n/g, '<br>')
      
      // 处理话题标签
      formatted = formatted.replace(/#([^#\s]+)#/g, '<span class="topic-tag">#$1#</span>')
      
      // 处理@用户
      formatted = formatted.replace(/@([a-zA-Z0-9_\u4e00-\u9fa5]+)/g, '<span class="mention">@$1</span>')
      
      return formatted
    },
    
    getImageClass(total, index) {
      if (total === 1) return 'single'
      if (total === 2) return 'double'
      if (total === 3) return index === 0 ? 'triple-main' : 'triple-sub'
      if (total === 4) return 'quad'
      return 'multiple'
    },
    
    previewImage(src, index) {
      this.previewImageSrc = src
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
    
    searchTag(tag) {
      this.$emit('search-tag', tag)
    },
    
    handleLike() {
      // 第一次点击时保存原始状态
      if (this.originalLikeState === null) {
        this.originalLikeState = this.inspiration.isLiked
        this.originalLikeCount = this.inspiration.likes_count || 0
      }
      
      // 防抖：如果正在等待发送请求，取消之前的定时器
      if (this.likeTimeout) {
        clearTimeout(this.likeTimeout)
      }
      
      // 立即更新UI状态 - 实时响应用户点击
      this.inspiration.isLiked = !this.inspiration.isLiked
      
      // 实时更新点赞数显示
      if (this.inspiration.isLiked) {
        this.inspiration.likes_count = (this.inspiration.likes_count || 0) + 1
      } else {
        this.inspiration.likes_count = Math.max(0, (this.inspiration.likes_count || 0) - 1)
      }
      
      // 延迟发送请求到服务器 - 用户停止点击后再同步
      this.likeTimeout = setTimeout(async () => {
        await this.syncLikeToServer()
      }, 800) // 增加到800ms，给用户更多时间完成连续点击
    },
    
    async syncLikeToServer() {
      try {
        // 记录当前UI状态，这是用户最终想要的状态
        const currentLikeState = this.inspiration.isLiked
        const currentLikeCount = this.inspiration.likes_count
        
        // 发送当前状态到服务器
        const response = await inspirationsAPI.toggleLike(this.inspiration.id)
        if (response.success) {
          // 使用服务器返回的准确数据，但保持UI的即时响应感
          this.inspiration.isLiked = response.data.isLiked
          this.inspiration.likes_count = response.data.likes_count
          this.likeRetryCount = 0
          
          // 重置原始状态
          this.originalLikeState = null
          this.originalLikeCount = null
          
          // 更新UI状态
          this.$emit('update-inspiration', {
            id: this.inspiration.id,
            isLiked: response.data.isLiked,
            likes_count: response.data.likes_count
          })
        }
      } catch (error) {
        console.error('点赞同步失败:', error)
        
        // 网络错误时，保持用户的UI状态，稍后重试
        if (this.likeRetryCount < 3) {
          this.likeRetryCount++
          
          // 2秒后重试
          setTimeout(() => {
            this.syncLikeToServer()
          }, 2000)
        } else {
          // 重试次数用完，回滚到原始状态
          if (this.originalLikeState !== null) {
            this.inspiration.isLiked = this.originalLikeState
            this.inspiration.likes_count = this.originalLikeCount
            this.originalLikeState = null
            this.originalLikeCount = null
          }
          this.likeRetryCount = 0
          this.$message?.error('点赞失败，请检查网络连接')
        }
      }
    },
    
    handleShare() {
      this.showShareModal = true
      this.shareContent = ''
    },
    
    closeShareModal() {
      this.showShareModal = false
      this.shareContent = ''
      this.sharing = false
    },
    
    async confirmShare() {
      if (this.shareContent.length > 500) return
      
      this.sharing = true
      try {
        const response = await inspirationsAPI.shareInspiration(this.inspiration.id, {
          content: this.shareContent
        })
        
        if (response.success) {
          this.$message?.success('转发成功！')
          this.closeShareModal()
          this.$emit('share', response.data)
        }
      } catch (error) {
        console.error('转发失败:', error)
        this.$message?.error('转发失败，请重试')
      } finally {
        this.sharing = false
      }
    },
    
    async handleDelete() {
      if (!confirm('确定要删除这条灵感吗？')) return
      
      try {
        const response = await inspirationsAPI.deleteInspiration(this.inspiration.id)
        if (response.success) {
          this.$emit('delete', this.inspiration.id)
          this.$message?.success('删除成功')
        }
      } catch (error) {
        console.error('删除失败:', error)
        this.$message?.error('删除失败，请重试')
      }
      
      this.showMenu = false
    },
    
    handleCommentAdded() {
      this.$emit('comment-count-change', {
        id: this.inspiration.id,
        change: 1
      })
    },
    
    handleCommentDeleted() {
      this.$emit('comment-count-change', {
        id: this.inspiration.id,
        change: -1
      })
    }
  }
}
</script>

<style scoped>
.inspiration-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
  overflow: hidden;
  transition: all 0.3s ease;
}

.inspiration-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
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

.user-avatar.small {
  width: 24px;
  height: 24px;
}

.user-details h4 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
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
  cursor: pointer;
  color: #666;
  border-radius: 50%;
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
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10;
  min-width: 120px;
}

.delete-btn {
  width: 100%;
  padding: 0.75rem;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  color: #e74c3c;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.delete-btn:hover {
  background: #f8f9fa;
}

.card-content {
  padding: 1rem;
}

.content-text {
  margin: 0 0 1rem 0;
  line-height: 1.6;
  color: #333;
  word-wrap: break-word;
}

.content-text :deep(.topic-tag) {
  color: #667eea;
  font-weight: 500;
  cursor: pointer;
}

.content-text :deep(.mention) {
  color: #667eea;
  font-weight: 500;
}

.images-grid {
  display: grid;
  gap: 0.5rem;
  margin-bottom: 1rem;
  border-radius: 8px;
  overflow: hidden;
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
  border-radius: 4px;
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
  margin-bottom: 1rem;
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
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.card-footer {
  padding: 0 1rem 1rem;
}

.interactions {
  display: flex;
  gap: 1rem;
}

.interaction-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  color: #666;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.interaction-btn:hover {
  color: #333;
}

.like-btn {
  position: relative;
  overflow: hidden;
}

.like-btn i {
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.like-btn.liked {
  color: #e74c3c;
}

.like-btn.liked i {
  animation: heartBeat 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.like-btn:active i {
  transform: scale(0.95);
}

@keyframes heartBeat {
  0% { transform: scale(1); }
  30% { transform: scale(1.25); }
  60% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.comments-section {
  border-top: 1px solid #f0f0f0;
}

.share-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.share-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.share-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
}

.share-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #333;
}

.share-header .close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #666;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.share-header .close-btn:hover {
  background: #f0f0f0;
}

.original-inspiration {
  padding: 1rem;
  background: #f8f9fa;
  margin: 1rem;
  border-radius: 8px;
  border-left: 3px solid #667eea;
}

.original-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.original-content {
  color: #555;
  line-height: 1.5;
  font-size: 0.9rem;
}

.share-input {
  padding: 0 1rem;
}

.share-field {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  resize: vertical;
  font-family: inherit;
  font-size: 0.9rem;
  line-height: 1.5;
  outline: none;
  transition: border-color 0.3s ease;
}

.share-field:focus {
  border-color: #667eea;
}

.char-count {
  text-align: right;
  font-size: 0.8rem;
  color: #666;
  margin-top: 0.5rem;
}

.char-count.warning {
  color: #e74c3c;
}

.share-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem;
  border-top: 1px solid #f0f0f0;
}

.cancel-btn, .confirm-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.cancel-btn {
  background: white;
  color: #666;
}

.confirm-btn {
  background: #667eea;
  color: white;
  border-color: #667eea;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cancel-btn:hover {
  background: #f8f9fa;
}

.confirm-btn:hover:not(:disabled) {
  background: #5a6fd8;
}

.confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  z-index: 2000;
  padding: 2rem;
}

.preview-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.preview-content img {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 8px;
}

.image-preview-modal .close-btn {
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
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
  color: white;
}

.preview-nav button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 0.5rem;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
}

.preview-nav button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
}

.preview-nav button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .inspiration-card {
    margin-bottom: 1rem;
    border-radius: 8px;
  }
  
  .card-header, .card-content, .card-footer {
    padding: 0.75rem;
  }
  
  .interactions {
    gap: 0.5rem;
  }
  
  .interaction-btn {
    padding: 0.4rem;
    font-size: 0.8rem;
  }
  
  .share-modal {
    padding: 0.5rem;
  }
  
  .share-content {
    max-width: 100%;
  }
}
</style>