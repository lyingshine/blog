<template>
  <div class="comment-item">
    <div class="comment-main">
      <div class="comment-avatar">
        <img :src="comment.author.avatar" :alt="comment.author.name" />
      </div>
      
      <div class="comment-content">
        <div class="comment-header">
          <span class="comment-author">{{ comment.author.name }}</span>
          <span class="comment-time">{{ formatTime(comment.created_at) }}</span>
          <span v-if="comment.updated_at !== comment.created_at" class="comment-edited">
            (已编辑)
          </span>
        </div>
        
        <div v-if="!editing" class="comment-text">
          {{ comment.content }}
        </div>
        
        <!-- 编辑模式 -->
        <div v-else class="comment-edit">
          <textarea
            v-model="editContent"
            rows="3"
            maxlength="1000"
            @keydown.ctrl.enter="saveEdit"
            @keydown.esc="cancelEdit"
          ></textarea>
          <div class="edit-actions">
            <span class="char-count">{{ editContent.length }}/1000</span>
            <div class="edit-buttons">
              <button @click="cancelEdit" class="btn btn-sm btn-outline">取消</button>
              <button 
                @click="saveEdit" 
                :disabled="!editContent.trim() || editContent === comment.content"
                class="btn btn-sm btn-primary"
              >
                保存
              </button>
            </div>
          </div>
        </div>
        
        <div class="comment-actions">
          <button 
            @click="toggleLike" 
            :class="{ liked: comment.isLiked }"
            class="action-btn like-btn"
            :disabled="!isLoggedIn"
          >
            <span class="like-icon">{{ comment.isLiked ? '❤️' : '🤍' }}</span>
            <span>{{ comment.likes || 0 }}</span>
          </button>
          
          <button 
            @click="toggleReply" 
            class="action-btn reply-btn"
            :disabled="!isLoggedIn"
          >
            💬 回复
          </button>
          
          <button 
            v-if="canEdit"
            @click="startEdit" 
            class="action-btn edit-btn"
          >
            ✏️ 编辑
          </button>
          
          <button 
            v-if="canDelete"
            @click="deleteComment" 
            class="action-btn delete-btn"
          >
            🗑️ 删除
          </button>
        </div>
      </div>
    </div>

    <!-- 回复输入框 -->
    <div v-if="showReplyForm" class="reply-form">
      <div class="user-avatar">
        <img :src="currentUser?.avatar || '/default-avatar.png'" :alt="currentUser?.username" />
      </div>
      <div class="reply-input-wrapper">
        <textarea
          v-model="replyContent"
          :placeholder="`回复 @${comment.author.name}...`"
          rows="2"
          maxlength="1000"
          @keydown.ctrl.enter="submitReply"
          @keydown.esc="cancelReply"
        ></textarea>
        <div class="reply-actions">
          <span class="char-count">{{ replyContent.length }}/1000</span>
          <div class="reply-buttons">
            <button @click="cancelReply" class="btn btn-sm btn-outline">取消</button>
            <button 
              @click="submitReply" 
              :disabled="!replyContent.trim() || submittingReply"
              class="btn btn-sm btn-primary"
            >
              {{ submittingReply ? '发布中...' : '发布回复' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 回复列表 -->
    <div v-if="comment.reply_count > 0" class="replies-section">
      <button 
        v-if="!showReplies" 
        @click="loadReplies" 
        class="show-replies-btn"
        :disabled="loadingReplies"
      >
        {{ loadingReplies ? '加载中...' : `查看 ${comment.reply_count} 条回复` }}
      </button>
      
      <div v-else class="replies-list">
        <button @click="hideReplies" class="hide-replies-btn">
          隐藏回复
        </button>
        
        <CommentItem
          v-for="reply in replies"
          :key="reply.id"
          :comment="reply"
          :article-id="articleId"
          :current-user="currentUser"
          :is-logged-in="isLoggedIn"
          :is-reply="true"
          @like="$emit('like', $event)"
          @delete="handleReplyDelete"
          @update="$emit('update', $event, arguments[1])"
        />
        
        <div v-if="hasMoreReplies" class="load-more-replies">
          <button @click="loadMoreReplies" :disabled="loadingMoreReplies" class="btn btn-sm btn-outline">
            {{ loadingMoreReplies ? '加载中...' : '加载更多回复' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { commentsAPI } from '../utils/api'
import message from '../utils/message'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

export default {
  name: 'CommentItem',
  props: {
    comment: {
      type: Object,
      required: true
    },
    articleId: {
      type: [String, Number],
      required: true
    },
    currentUser: {
      type: Object,
      default: null
    },
    isLoggedIn: {
      type: Boolean,
      default: false
    },
    isReply: {
      type: Boolean,
      default: false
    }
  },
  emits: ['reply', 'like', 'delete', 'update'],
  data() {
    return {
      showReplyForm: false,
      replyContent: '',
      submittingReply: false,
      editing: false,
      editContent: '',
      showReplies: false,
      replies: [],
      loadingReplies: false,
      loadingMoreReplies: false,
      repliesPage: 1,
      hasMoreReplies: false
    }
  },
  computed: {
    canEdit() {
      if (!this.isLoggedIn || !this.currentUser) return false
      
      // 只有评论作者可以编辑
      if (this.currentUser.username !== this.comment.author.name) return false
      
      // 检查是否在15分钟内
      const createdAt = dayjs(this.comment.created_at)
      const now = dayjs()
      const diffMinutes = now.diff(createdAt, 'minute')
      
      return diffMinutes <= 15
    },
    
    canDelete() {
      if (!this.isLoggedIn || !this.currentUser) return false
      return this.currentUser.username === this.comment.author.name
    }
  },
  methods: {
    formatTime(time) {
      return dayjs(time).fromNow()
    },
    
    toggleLike() {
      if (!this.isLoggedIn) return
      this.$emit('like', this.comment.id)
    },
    
    toggleReply() {
      if (!this.isLoggedIn) return
      this.showReplyForm = !this.showReplyForm
      if (this.showReplyForm) {
        this.replyContent = ''
        this.$nextTick(() => {
          const textarea = this.$el.querySelector('.reply-form textarea')
          if (textarea) textarea.focus()
        })
      }
    },
    
    cancelReply() {
      this.showReplyForm = false
      this.replyContent = ''
    },
    
    async submitReply() {
      if (!this.replyContent.trim() || this.submittingReply) return
      
      this.submittingReply = true
      try {
        await this.$emit('reply', this.comment.id, this.replyContent)
        this.showReplyForm = false
        this.replyContent = ''
        
        // 如果回复列表已展开，重新加载
        if (this.showReplies) {
          await this.loadReplies()
        }
      } catch (error) {
        console.error('发布回复失败:', error)
      } finally {
        this.submittingReply = false
      }
    },
    
    startEdit() {
      this.editing = true
      this.editContent = this.comment.content
      this.$nextTick(() => {
        const textarea = this.$el.querySelector('.comment-edit textarea')
        if (textarea) {
          textarea.focus()
          textarea.setSelectionRange(textarea.value.length, textarea.value.length)
        }
      })
    },
    
    cancelEdit() {
      this.editing = false
      this.editContent = ''
    },
    
    async saveEdit() {
      if (!this.editContent.trim() || this.editContent === this.comment.content) return
      
      try {
        await this.$emit('update', this.comment.id, this.editContent)
        this.editing = false
        this.editContent = ''
      } catch (error) {
        console.error('更新评论失败:', error)
      }
    },
    
    deleteComment() {
      this.$emit('delete', this.comment.id)
    },
    
    async loadReplies() {
      if (this.loadingReplies) return
      
      this.loadingReplies = true
      this.repliesPage = 1
      
      try {
        const response = await commentsAPI.getReplies(this.comment.id, {
          page: 1,
          limit: 10
        })
        
        this.replies = response.replies
        this.showReplies = true
        this.hasMoreReplies = response.pagination.page < response.pagination.pages
      } catch (error) {
        console.error('加载回复失败:', error)
        message.error('加载回复失败')
      } finally {
        this.loadingReplies = false
      }
    },
    
    async loadMoreReplies() {
      if (this.loadingMoreReplies || !this.hasMoreReplies) return
      
      this.loadingMoreReplies = true
      
      try {
        const response = await commentsAPI.getReplies(this.comment.id, {
          page: this.repliesPage + 1,
          limit: 10
        })
        
        this.replies.push(...response.replies)
        this.repliesPage++
        this.hasMoreReplies = response.pagination.page < response.pagination.pages
      } catch (error) {
        console.error('加载更多回复失败:', error)
        message.error('加载更多回复失败')
      } finally {
        this.loadingMoreReplies = false
      }
    },
    
    hideReplies() {
      this.showReplies = false
      this.replies = []
    },
    
    handleReplyDelete(replyId) {
      // 从回复列表中移除
      const index = this.replies.findIndex(r => r.id === replyId)
      if (index > -1) {
        this.replies.splice(index, 1)
        this.comment.reply_count = Math.max(0, (this.comment.reply_count || 1) - 1)
      }
      
      // 如果没有回复了，隐藏回复区域
      if (this.comment.reply_count === 0) {
        this.hideReplies()
      }
      
      this.$emit('delete', replyId)
    }
  }
}
</script>

<style scoped>
.comment-item {
  margin-bottom: 1.5rem;
}

.comment-main {
  display: flex;
  gap: 0.75rem;
}

.comment-avatar img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.comment-content {
  flex: 1;
  min-width: 0;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.comment-author {
  font-weight: 600;
  color: #1f2937;
}

.comment-time {
  font-size: 0.75rem;
  color: #6b7280;
}

.comment-edited {
  font-size: 0.75rem;
  color: #9ca3af;
  font-style: italic;
}

.comment-text {
  color: #374151;
  line-height: 1.6;
  margin-bottom: 0.75rem;
  word-wrap: break-word;
}

.comment-edit textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  resize: vertical;
  font-family: inherit;
  font-size: 0.875rem;
  line-height: 1.5;
}

.comment-edit textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.edit-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
}

.edit-buttons {
  display: flex;
  gap: 0.5rem;
}

.char-count {
  font-size: 0.75rem;
  color: #6b7280;
}

.comment-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border: none;
  background: none;
  color: #6b7280;
  font-size: 0.75rem;
  cursor: pointer;
  border-radius: 0.25rem;
  transition: all 0.2s;
}

.action-btn:hover:not(:disabled) {
  background: #f3f4f6;
  color: #374151;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.like-btn.liked {
  color: #ef4444;
}

.like-icon {
  font-size: 0.875rem;
}

.reply-form {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
}

.reply-form .user-avatar img {
  width: 32px;
  height: 32px;
}

.reply-input-wrapper {
  flex: 1;
}

.reply-input-wrapper textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  resize: vertical;
  font-family: inherit;
  font-size: 0.875rem;
  line-height: 1.5;
}

.reply-input-wrapper textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.reply-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
}

.reply-buttons {
  display: flex;
  gap: 0.5rem;
}

.replies-section {
  margin-top: 1rem;
  margin-left: 3rem;
}

.show-replies-btn,
.hide-replies-btn {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s;
}

.show-replies-btn:hover,
.hide-replies-btn:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.hide-replies-btn {
  margin-bottom: 1rem;
}

.replies-list {
  border-left: 2px solid #e5e7eb;
  padding-left: 1rem;
}

.replies-list .comment-item {
  margin-bottom: 1rem;
}

.replies-list .comment-avatar img {
  width: 28px;
  height: 28px;
}

.load-more-replies {
  margin-top: 1rem;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 0.75rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-outline {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-outline:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

@media (max-width: 768px) {
  .comment-main {
    gap: 0.5rem;
  }
  
  .comment-avatar img {
    width: 32px;
    height: 32px;
  }
  
  .comment-actions {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .reply-form {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .replies-section {
    margin-left: 1.5rem;
  }
}
</style>