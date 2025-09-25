<template>
  <div class="inspiration-comments">
    <!-- 评论输入框 -->
    <div class="comment-input-section">
      <div class="comment-input">
        <img 
          :src="getAvatarUrl(currentUser?.avatar, currentUser?.username)" 
          :alt="currentUser?.username"
          class="user-avatar"
        >
        <div class="input-wrapper">
          <textarea 
            v-model="newComment"
            @keydown.ctrl.enter="submitComment"
            placeholder="写下你的想法..."
            class="comment-field"
            rows="3"
          ></textarea>
          <div class="input-actions">
            <span class="char-count" :class="{ warning: newComment.length > 450 }">
              {{ newComment.length }}/500
            </span>
            <button 
              @click="submitComment" 
              :disabled="!newComment.trim() || newComment.length > 500 || submitting"
              class="submit-btn"
            >
              <i v-if="submitting" class="fas fa-spinner fa-spin"></i>
              <span>{{ submitting ? '发送中...' : '发送' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 评论列表 -->
    <div class="comments-list">
      <div v-if="loading && comments.length === 0" class="loading">
        <i class="fas fa-spinner fa-spin"></i>
        <span>加载评论中...</span>
      </div>

      <div v-else-if="comments.length === 0" class="empty-comments">
        <i class="far fa-comments"></i>
        <p>还没有评论，来发表第一条评论吧！</p>
      </div>

      <div v-else>
        <CommentItem
          v-for="comment in comments"
          :key="comment.id"
          :comment="comment"
          :inspiration-id="inspirationId"
          @like="handleCommentLike"
          @delete="handleCommentDelete"
          @reply="handleReply"
          @update="handleCommentUpdate"
        />

        <!-- 加载更多评论 -->
        <div v-if="hasMore" class="load-more">
          <button 
            @click="loadMoreComments" 
            :disabled="loading"
            class="load-more-btn"
          >
            <i v-if="loading" class="fas fa-spinner fa-spin"></i>
            <span>{{ loading ? '加载中...' : '加载更多评论' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { commentsAPI } from '../utils/inspirations-api'
import { getAvatarUrl } from '../utils/image-url'
import CommentItem from './CommentItem.vue'

export default {
  name: 'InspirationComments',
  components: {
    CommentItem
  },
  props: {
    inspirationId: {
      type: [String, Number],
      required: true
    },
    visible: {
      type: Boolean,
      default: true
    }
  },
  emits: ['comment-added', 'comment-deleted'],
  data() {
    return {
      comments: [],
      newComment: '',
      loading: false,
      submitting: false,
      currentPage: 1,
      hasMore: true,
      replyingTo: null
    }
  },
  computed: {
    currentUser() {
      const userStr = localStorage.getItem('blog_user')
      return userStr ? JSON.parse(userStr) : null
    },
    isLoggedIn() {
      return !!this.currentUser
    }
  },
  watch: {
    visible: {
      immediate: true,
      handler(newVal) {
        if (newVal && this.comments.length === 0) {
          this.loadComments()
        }
      }
    }
  },
  methods: {
    getAvatarUrl(avatarPath, username) {
      return getAvatarUrl(avatarPath, username)
    },

    async loadComments(reset = true) {
      if (this.loading) return

      this.loading = true
      
      try {
        if (reset) {
          this.currentPage = 1
          this.comments = []
        }

        const response = await commentsAPI.getComments(this.inspirationId, {
          page: this.currentPage,
          limit: 20,
          sort: 'newest'
        })
        
        if (reset) {
          this.comments = response.data.comments
        } else {
          this.comments.push(...response.data.comments)
        }

        this.hasMore = this.currentPage < response.data.totalPages
        
      } catch (error) {
        console.error('加载评论失败:', error)
        this.$message?.error('加载评论失败')
      } finally {
        this.loading = false
      }
    },

    async loadMoreComments() {
      if (!this.hasMore || this.loading) return
      
      this.currentPage++
      await this.loadComments(false)
    },

    async submitComment() {
      if (!this.isLoggedIn) {
        this.$message?.warning('请先登录')
        return
      }

      if (!this.newComment.trim()) {
        this.$message?.warning('评论内容不能为空')
        return
      }

      if (this.newComment.length > 500) {
        this.$message?.warning('评论内容不能超过500字符')
        return
      }

      this.submitting = true

      try {
        const response = await commentsAPI.createComment({
          inspiration_id: this.inspirationId,
          content: this.newComment.trim(),
          parent_id: this.replyingTo
        })

        // 添加新评论到列表顶部
        this.comments.unshift(response.data)
        this.newComment = ''
        this.replyingTo = null

        this.$emit('comment-added', response.data)
        this.$message?.success('评论发布成功')
        
      } catch (error) {
        console.error('发布评论失败:', error)
        this.$message?.error('发布评论失败')
      } finally {
        this.submitting = false
      }
    },

    async handleCommentLike(commentId) {
      if (!this.isLoggedIn) {
        this.$message?.warning('请先登录')
        return
      }

      try {
        const response = await commentsAPI.toggleCommentLike(commentId)
        
        // 更新本地数据
        const comment = this.comments.find(c => c.id === commentId)
        if (comment) {
          comment.isLiked = response.data.isLiked
          comment.likes_count = response.data.likes_count
        }
        
      } catch (error) {
        console.error('评论点赞失败:', error)
        this.$message?.error('操作失败')
      }
    },

    async handleCommentDelete(commentId) {
      if (!confirm('确定要删除这条评论吗？')) return

      try {
        await commentsAPI.deleteComment(commentId)
        
        // 从列表中移除
        this.comments = this.comments.filter(c => c.id !== commentId)
        this.$emit('comment-deleted', commentId)
        this.$message?.success('评论删除成功')
        
      } catch (error) {
        console.error('删除评论失败:', error)
        this.$message?.error('删除评论失败')
      }
    },

    handleReply(comment) {
      this.replyingTo = comment.id
      this.newComment = `@${comment.author.username} `
      // 聚焦到输入框
      this.$nextTick(() => {
        const textarea = this.$el.querySelector('.comment-field')
        if (textarea) {
          textarea.focus()
          textarea.setSelectionRange(textarea.value.length, textarea.value.length)
        }
      })
    },

    async handleCommentUpdate(commentId, newContent) {
      try {
        await commentsAPI.updateComment(commentId, newContent)
        
        // 更新本地数据
        const comment = this.comments.find(c => c.id === commentId)
        if (comment) {
          comment.content = newContent
          comment.updated_at = new Date().toISOString()
        }
        
        this.$message?.success('评论更新成功')
        
      } catch (error) {
        console.error('更新评论失败:', error)
        this.$message?.error('更新评论失败')
      }
    }
  }
}
</script>

<style scoped>
.inspiration-comments {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.comment-input-section {
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
}

.comment-input {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.input-wrapper {
  flex: 1;
}

.comment-field {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
  font-size: 0.9rem;
  line-height: 1.5;
  outline: none;
  transition: border-color 0.3s ease;
}

.comment-field:focus {
  border-color: #667eea;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
}

.char-count {
  font-size: 0.8rem;
  color: #666;
}

.char-count.warning {
  color: #e74c3c;
}

.submit-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.submit-btn:hover:not(:disabled) {
  background: #5a6fd8;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.comments-list {
  max-height: 600px;
  overflow-y: auto;
}

.loading, .empty-comments {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.empty-comments i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  opacity: 0.5;
}

.load-more {
  text-align: center;
  padding: 1rem;
  border-top: 1px solid #f0f0f0;
}

.load-more-btn {
  background: #f8f9fa;
  border: 1px solid #ddd;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
}

.load-more-btn:hover:not(:disabled) {
  background: #e9ecef;
}

.load-more-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .comment-input-section {
    padding: 0.75rem;
  }
  
  .comment-field {
    min-height: 60px;
  }
  
  .input-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
  
  .submit-btn {
    align-self: flex-end;
  }
}
</style>