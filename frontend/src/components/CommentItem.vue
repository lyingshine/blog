<template>
  <div class="comment-item">
    <div class="comment-header">
      <img 
        :src="getAvatarUrl(comment.author.avatar, comment.author.username)" 
        :alt="comment.author.username"
        class="user-avatar"
      >
      <div class="comment-info">
        <div class="user-details">
          <span class="username">{{ comment.author.username }}</span>
          <span class="time">{{ formatTime(comment.created_at) }}</span>
          <span v-if="comment.updated_at !== comment.created_at" class="edited">
            (已编辑)
          </span>
        </div>
      </div>
      
      <!-- 操作菜单 -->
      <div class="comment-actions" v-if="canEdit || canDelete">
        <button @click="showMenu = !showMenu" class="menu-btn">
          <i class="fas fa-ellipsis-h"></i>
        </button>
        <div v-if="showMenu" class="action-menu">
          <button v-if="canEdit" @click="startEdit" class="edit-btn">
            <i class="fas fa-edit"></i>
            编辑
          </button>
          <button v-if="canDelete" @click="handleDelete" class="delete-btn">
            <i class="fas fa-trash"></i>
            删除
          </button>
        </div>
      </div>
    </div>

    <div class="comment-content">
      <!-- 编辑模式 -->
      <div v-if="isEditing" class="edit-mode">
        <textarea 
          v-model="editContent"
          class="edit-field"
          rows="3"
          @keydown.ctrl.enter="saveEdit"
        ></textarea>
        <div class="edit-actions">
          <span class="char-count" :class="{ warning: editContent.length > 450 }">
            {{ editContent.length }}/500
          </span>
          <div class="edit-buttons">
            <button @click="cancelEdit" class="cancel-btn">取消</button>
            <button 
              @click="saveEdit" 
              :disabled="!editContent.trim() || editContent.length > 500 || saving"
              class="save-btn"
            >
              <i v-if="saving" class="fas fa-spinner fa-spin"></i>
              <span>{{ saving ? '保存中...' : '保存' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 显示模式 -->
      <div v-else class="content-text" v-html="formatContent(comment.content)"></div>
    </div>

    <!-- 互动区域 -->
    <div class="comment-footer">
      <div class="interactions">
        <button 
          @click="handleLike" 
          :class="{ liked: comment.isLiked }"
          class="interaction-btn like-btn"
        >
          <i :class="comment.isLiked ? 'fas fa-heart' : 'far fa-heart'"></i>
          <span v-if="comment.likes_count > 0">{{ comment.likes_count }}</span>
        </button>
        
        <button @click="handleReply" class="interaction-btn reply-btn">
          <i class="fas fa-reply"></i>
          <span>回复</span>
        </button>
        
        <button 
          v-if="comment.reply_count > 0"
          @click="toggleReplies" 
          class="interaction-btn replies-btn"
        >
          <i class="fas fa-comments"></i>
          <span>{{ comment.reply_count }} 条回复</span>
        </button>
      </div>
    </div>

    <!-- 回复列表 -->
    <div v-if="showReplies && comment.reply_count > 0" class="replies-section">
      <div v-if="loadingReplies" class="loading-replies">
        <i class="fas fa-spinner fa-spin"></i>
        <span>加载回复中...</span>
      </div>
      
      <div v-else class="replies-list">
        <CommentItem
          v-for="reply in replies"
          :key="reply.id"
          :comment="reply"
          :inspiration-id="inspirationId"
          :is-reply="true"
          @like="$emit('like', $event)"
          @delete="handleReplyDelete"
          @update="$emit('update', $event, arguments[1])"
        />
        
        <!-- 加载更多回复 -->
        <div v-if="hasMoreReplies" class="load-more-replies">
          <button 
            @click="loadMoreReplies" 
            :disabled="loadingReplies"
            class="load-more-btn"
          >
            <i v-if="loadingReplies" class="fas fa-spinner fa-spin"></i>
            <span>{{ loadingReplies ? '加载中...' : '加载更多回复' }}</span>
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
import { commentsAPI } from '../utils/inspirations-api'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

export default {
  name: 'CommentItem',
  props: {
    comment: {
      type: Object,
      required: true
    },
    inspirationId: {
      type: [String, Number],
      required: true
    },
    isReply: {
      type: Boolean,
      default: false
    }
  },
  emits: ['like', 'delete', 'reply', 'update'],
  data() {
    return {
      showMenu: false,
      showReplies: false,
      replies: [],
      loadingReplies: false,
      currentReplyPage: 1,
      hasMoreReplies: true,
      isEditing: false,
      editContent: '',
      saving: false
    }
  },
  computed: {
    currentUser() {
      const userStr = localStorage.getItem('blog_user')
      return userStr ? JSON.parse(userStr) : null
    },
    canEdit() {
      if (!this.currentUser) return false
      if (this.currentUser.id !== this.comment.author.id) return false
      
      // 检查是否在15分钟内
      const createdAt = new Date(this.comment.created_at)
      const now = new Date()
      const diffMinutes = (now - createdAt) / (1000 * 60)
      
      return diffMinutes <= 15
    },
    canDelete() {
      return this.currentUser && this.currentUser.id === this.comment.author.id
    }
  },
  methods: {
    getAvatarUrl(avatarPath, username) {
      return getAvatarUrl(avatarPath, username)
    },

    formatTime(time) {
      return dayjs(time).fromNow()
    },

    formatContent(content) {
      // 处理@用户和话题标签
      return content
        .replace(/@([^\s@]+)/g, '<span class="mention">@$1</span>')
        .replace(/#([^#\s]+)#/g, '<span class="topic-tag">#$1#</span>')
    },

    handleLike() {
      this.$emit('like', this.comment.id)
    },

    handleDelete() {
      this.showMenu = false
      this.$emit('delete', this.comment.id)
    },

    handleReply() {
      this.$emit('reply', this.comment)
    },

    startEdit() {
      this.showMenu = false
      this.isEditing = true
      this.editContent = this.comment.content
    },

    cancelEdit() {
      this.isEditing = false
      this.editContent = ''
    },

    async saveEdit() {
      if (!this.editContent.trim() || this.editContent.length > 500) return

      this.saving = true
      try {
        this.$emit('update', this.comment.id, this.editContent.trim())
        this.isEditing = false
        this.editContent = ''
      } catch (error) {
        console.error('保存编辑失败:', error)
      } finally {
        this.saving = false
      }
    },

    async toggleReplies() {
      this.showReplies = !this.showReplies
      
      if (this.showReplies && this.replies.length === 0) {
        await this.loadReplies()
      }
    },

    async loadReplies(reset = true) {
      if (this.loadingReplies) return

      this.loadingReplies = true
      
      try {
        if (reset) {
          this.currentReplyPage = 1
          this.replies = []
        }

        const response = await commentsAPI.getReplies(this.comment.id, {
          page: this.currentReplyPage,
          limit: 10
        })
        
        if (reset) {
          this.replies = response.data.replies
        } else {
          this.replies.push(...response.data.replies)
        }

        this.hasMoreReplies = this.currentReplyPage < response.data.totalPages
        
      } catch (error) {
        console.error('加载回复失败:', error)
        this.$message?.error('加载回复失败')
      } finally {
        this.loadingReplies = false
      }
    },

    async loadMoreReplies() {
      if (!this.hasMoreReplies || this.loadingReplies) return
      
      this.currentReplyPage++
      await this.loadReplies(false)
    },

    handleReplyDelete(replyId) {
      this.replies = this.replies.filter(r => r.id !== replyId)
      // 更新回复数量
      if (this.comment.reply_count > 0) {
        this.comment.reply_count--
      }
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
.comment-item {
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.3s ease;
}

.comment-item:hover {
  background-color: #fafafa;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.comment-info {
  flex: 1;
}

.user-details {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.username {
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
}

.time {
  color: #666;
  font-size: 0.8rem;
}

.edited {
  color: #999;
  font-size: 0.75rem;
  font-style: italic;
}

.comment-actions {
  position: relative;
}

.menu-btn {
  background: none;
  border: none;
  padding: 0.25rem;
  border-radius: 4px;
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
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10;
  min-width: 100px;
  overflow: hidden;
}

.edit-btn, .delete-btn {
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  transition: background-color 0.3s ease;
}

.edit-btn {
  color: #667eea;
}

.delete-btn {
  color: #e74c3c;
}

.edit-btn:hover, .delete-btn:hover {
  background: #f8f9fa;
}

.comment-content {
  margin-left: 2.5rem;
  margin-bottom: 0.5rem;
}

.content-text {
  line-height: 1.5;
  color: #333;
  font-size: 0.9rem;
}

.content-text :deep(.mention) {
  color: #667eea;
  font-weight: 600;
}

.content-text :deep(.topic-tag) {
  color: #667eea;
  font-weight: 600;
  cursor: pointer;
}

.edit-mode {
  background: #f8f9fa;
  padding: 0.75rem;
  border-radius: 6px;
}

.edit-field {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  font-family: inherit;
  font-size: 0.9rem;
  line-height: 1.5;
  outline: none;
}

.edit-field:focus {
  border-color: #667eea;
}

.edit-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
}

.char-count {
  font-size: 0.75rem;
  color: #666;
}

.char-count.warning {
  color: #e74c3c;
}

.edit-buttons {
  display: flex;
  gap: 0.5rem;
}

.cancel-btn, .save-btn {
  padding: 0.25rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.3s ease;
}

.cancel-btn {
  background: white;
  color: #666;
}

.save-btn {
  background: #667eea;
  color: white;
  border-color: #667eea;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.cancel-btn:hover {
  background: #f8f9fa;
}

.save-btn:hover:not(:disabled) {
  background: #5a6fd8;
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.comment-footer {
  margin-left: 2.5rem;
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
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #666;
  font-size: 0.8rem;
}

.interaction-btn:hover {
  background: #f0f0f0;
}

.like-btn.liked {
  color: #e74c3c;
}

.replies-section {
  margin-left: 2.5rem;
  margin-top: 0.75rem;
  padding-left: 1rem;
  border-left: 2px solid #f0f0f0;
}

.loading-replies {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
  font-size: 0.85rem;
  padding: 0.5rem 0;
}

.replies-list .comment-item {
  padding: 0.75rem 0;
  background: none;
}

.load-more-replies {
  text-align: center;
  padding: 0.5rem 0;
}

.load-more-btn {
  background: #f8f9fa;
  border: 1px solid #ddd;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: #666;
  font-size: 0.8rem;
}

.load-more-btn:hover:not(:disabled) {
  background: #e9ecef;
}

.load-more-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .comment-content, .comment-footer, .replies-section {
    margin-left: 0;
  }
  
  .comment-header {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .user-details {
    margin-left: 2.5rem;
  }
  
  .interactions {
    justify-content: space-around;
  }
}
</style>