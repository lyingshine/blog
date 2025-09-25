<template>
  <div class="comment-section">
    <div class="comment-header">
      <h3>评论 ({{ totalComments }})</h3>
      <div class="comment-sort">
        <select v-model="sortBy" @change="loadComments">
          <option value="newest">最新</option>
          <option value="oldest">最早</option>
          <option value="likes">最热</option>
        </select>
      </div>
    </div>

    <!-- 评论输入框 -->
    <div v-if="isLoggedIn" class="comment-form">
      <div class="user-avatar">
        <img :src="currentUser.avatar || '/default-avatar.png'" :alt="currentUser.username" />
      </div>
      <div class="comment-input-wrapper">
        <textarea
          v-model="newComment"
          placeholder="写下你的评论..."
          rows="3"
          maxlength="1000"
          @keydown.ctrl.enter="submitComment"
        ></textarea>
        <div class="comment-actions">
          <span class="char-count">{{ newComment.length }}/1000</span>
          <button 
            @click="submitComment" 
            :disabled="!newComment.trim() || submitting"
            class="btn btn-primary"
          >
            {{ submitting ? '发布中...' : '发布评论' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 未登录提示 -->
    <div v-else class="login-prompt">
      <p>请 <router-link to="/login">登录</router-link> 后发表评论</p>
    </div>

    <!-- 评论列表 -->
    <div class="comment-list">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>加载评论中...</p>
      </div>

      <div v-else-if="comments.length === 0" class="no-comments">
        <p>暂无评论，来发表第一条评论吧！</p>
      </div>

      <div v-else>
        <CommentItem
          v-for="comment in comments"
          :key="comment.id"
          :comment="comment"
          :article-id="articleId"
          :current-user="currentUser"
          :is-logged-in="isLoggedIn"
          @reply="handleReply"
          @like="handleCommentLike"
          @delete="handleCommentDelete"
          @update="handleCommentUpdate"
        />

        <!-- 加载更多 -->
        <div v-if="hasMore" class="load-more">
          <button @click="loadMoreComments" :disabled="loadingMore" class="btn btn-outline">
            {{ loadingMore ? '加载中...' : '加载更多评论' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import CommentItem from './CommentItem.vue'
import { commentsAPI } from '../utils/api'
import message from '../utils/message'

export default {
  name: 'CommentSection',
  components: {
    CommentItem
  },
  props: {
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
    }
  },
  data() {
    return {
      comments: [],
      newComment: '',
      loading: false,
      submitting: false,
      loadingMore: false,
      sortBy: 'newest',
      currentPage: 1,
      totalComments: 0,
      hasMore: false
    }
  },
  async created() {
    await this.loadComments()
  },
  methods: {
    async loadComments() {
      this.loading = true
      this.currentPage = 1
      try {
        const response = await commentsAPI.getComments(this.articleId, {
          page: 1,
          limit: 20,
          sort: this.sortBy
        })
        
        this.comments = response.comments
        this.totalComments = response.pagination.total
        this.hasMore = response.pagination.page < response.pagination.pages
      } catch (error) {
        console.error('加载评论失败:', error)
        message.error('加载评论失败')
      } finally {
        this.loading = false
      }
    },

    async loadMoreComments() {
      if (this.loadingMore || !this.hasMore) return
      
      this.loadingMore = true
      try {
        const response = await commentsAPI.getComments(this.articleId, {
          page: this.currentPage + 1,
          limit: 20,
          sort: this.sortBy
        })
        
        this.comments.push(...response.comments)
        this.currentPage++
        this.hasMore = response.pagination.page < response.pagination.pages
      } catch (error) {
        console.error('加载更多评论失败:', error)
        message.error('加载更多评论失败')
      } finally {
        this.loadingMore = false
      }
    },

    async submitComment() {
      if (!this.newComment.trim() || this.submitting) return

      this.submitting = true
      try {
        const response = await commentsAPI.createComment({
          articleId: this.articleId,
          content: this.newComment.trim()
        })

        // 将新评论添加到列表顶部
        this.comments.unshift(response.comment)
        this.totalComments++
        this.newComment = ''
        
        message.success('评论发布成功')
      } catch (error) {
        console.error('发布评论失败:', error)
        message.error(error.response?.data?.error || '发布评论失败')
      } finally {
        this.submitting = false
      }
    },

    async handleReply(commentId, content) {
      try {
        const response = await commentsAPI.createComment({
          articleId: this.articleId,
          content: content.trim(),
          parentId: commentId
        })

        // 找到父评论并添加回复
        const parentComment = this.comments.find(c => c.id === commentId)
        if (parentComment) {
          if (!parentComment.replies) {
            parentComment.replies = []
          }
          parentComment.replies.push(response.comment)
          parentComment.reply_count = (parentComment.reply_count || 0) + 1
        }

        this.totalComments++
        message.success('回复发布成功')
      } catch (error) {
        console.error('发布回复失败:', error)
        message.error(error.response?.data?.error || '发布回复失败')
      }
    },

    async handleCommentLike(commentId) {
      if (!this.isLoggedIn) {
        message.warning('请先登录')
        return
      }

      try {
        const response = await commentsAPI.toggleLike(commentId)
        
        // 更新评论点赞状态
        const updateComment = (comments) => {
          for (const comment of comments) {
            if (comment.id === commentId) {
              comment.isLiked = response.isLiked
              comment.likes = response.totalLikes
              return true
            }
            if (comment.replies && updateComment(comment.replies)) {
              return true
            }
          }
          return false
        }
        
        updateComment(this.comments)
      } catch (error) {
        console.error('点赞操作失败:', error)
        message.error('操作失败')
      }
    },

    async handleCommentDelete(commentId) {
      if (!confirm('确定要删除这条评论吗？')) return

      try {
        await commentsAPI.deleteComment(commentId)
        
        // 从列表中移除评论
        const removeComment = (comments) => {
          for (let i = 0; i < comments.length; i++) {
            if (comments[i].id === commentId) {
              comments.splice(i, 1)
              return true
            }
            if (comments[i].replies && removeComment(comments[i].replies)) {
              comments[i].reply_count = Math.max(0, (comments[i].reply_count || 1) - 1)
              return true
            }
          }
          return false
        }
        
        if (removeComment(this.comments)) {
          this.totalComments--
          message.success('评论删除成功')
        }
      } catch (error) {
        console.error('删除评论失败:', error)
        message.error(error.response?.data?.error || '删除评论失败')
      }
    },

    async handleCommentUpdate(commentId, newContent) {
      try {
        await commentsAPI.updateComment(commentId, { content: newContent })
        
        // 更新评论内容
        const updateComment = (comments) => {
          for (const comment of comments) {
            if (comment.id === commentId) {
              comment.content = newContent
              return true
            }
            if (comment.replies && updateComment(comment.replies)) {
              return true
            }
          }
          return false
        }
        
        updateComment(this.comments)
        message.success('评论更新成功')
      } catch (error) {
        console.error('更新评论失败:', error)
        message.error(error.response?.data?.error || '更新评论失败')
      }
    }
  }
}
</script>

<style scoped>
.comment-section {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.comment-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 1.5rem;
}

.comment-sort select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: white;
  font-size: 0.875rem;
}

.comment-form {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 0.75rem;
}

.user-avatar img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.comment-input-wrapper {
  flex: 1;
}

.comment-input-wrapper textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  resize: vertical;
  font-family: inherit;
  font-size: 0.875rem;
  line-height: 1.5;
}

.comment-input-wrapper textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.comment-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.75rem;
}

.char-count {
  font-size: 0.75rem;
  color: #6b7280;
}

.login-prompt {
  text-align: center;
  padding: 2rem;
  background: #f9fafb;
  border-radius: 0.75rem;
  margin-bottom: 2rem;
}

.login-prompt a {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
}

.login-prompt a:hover {
  text-decoration: underline;
}

.loading {
  text-align: center;
  padding: 2rem;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f4f6;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.no-comments {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}

.comment-list {
  space-y: 1.5rem;
}

.load-more {
  text-align: center;
  margin-top: 2rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 0.875rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  .comment-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .comment-form {
    flex-direction: column;
    gap: 1rem;
  }

  .user-avatar {
    align-self: flex-start;
  }
}
</style>