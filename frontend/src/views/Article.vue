<template>
  <div class="article-page">
    <div class="container">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>
      
      <div v-else-if="article" class="article-content">
        <!-- Article Header -->
        <header class="article-header">
          <div class="article-meta">
            <span class="category">{{ article.category }}</span>
            <span class="date">{{ formatDate(article.date) }}</span>
            <span class="reading-time">{{ article.readingTime }}分钟阅读</span>
          </div>
          <h1 class="article-title">{{ article.title }}</h1>
          <p class="article-summary">{{ article.summary }}</p>
          <div class="article-tags">
            <span v-for="tag in article.tags" :key="tag" class="tag">
              {{ tag }}
            </span>
          </div>
        </header>

        <!-- Article Image -->
        <div v-if="article.image" class="article-image">
          <img :src="article.image" :alt="article.title" />
        </div>

        <!-- Article Body -->
        <div class="article-body" v-html="article.content"></div>

        <!-- Article Footer -->
        <footer class="article-footer">
          <div class="author-info">
            <div class="author-avatar">
              <img :src="getAvatarUrl(article.author.avatar, article.author.name)" :alt="article.author.name" />
            </div>
            <div class="author-details">
              <h4>{{ article.author.name }}</h4>
              <p>{{ article.author.bio }}</p>
            </div>
          </div>
          
          <div class="article-actions">
            <button @click="toggleLike" class="action-btn" :class="{ liked: isLiked }">
              ❤️ {{ article.likes + (isLiked ? 1 : 0) }}
            </button>
            <button @click="shareArticle" class="action-btn">
              🔗 分享
            </button>
          </div>
        </footer>

        <!-- Comment Section -->
        <CommentSection
          :article-id="id"
          :current-user="currentUser"
          :is-logged-in="isLoggedIn"
        />

        <!-- Related Articles -->
        <section class="related-articles">
          <h3>相关文章</h3>
          <div class="grid grid-3">
            <article 
              v-for="related in relatedArticles" 
              :key="related.id"
              class="card article-card-small"
              @click="goToArticle(related.id)"
            >
              <div class="article-meta">
                <span class="category">{{ related.category }}</span>
                <span class="date">{{ formatDate(related.date) }}</span>
              </div>
              <h4 class="article-title">{{ related.title }}</h4>
              <p class="article-excerpt">{{ related.excerpt }}</p>
            </article>
          </div>
        </section>
      </div>

      <div v-else class="error">
        <h2>文章未找到</h2>
        <p>抱歉，您访问的文章不存在或已被删除。</p>
        <router-link to="/" class="btn">返回首页</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import dayjs from 'dayjs'
import { articlesAPI } from '../utils/api'
import { getAvatarUrl } from '../utils/image-url'
import CommentSection from '../components/CommentSection.vue'

export default {
  name: 'Article',
  components: {
    CommentSection
  },
  props: {
    id: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      loading: true,
      article: null,
      isLiked: false,
      relatedArticles: [],
      currentUser: null,
      isLoggedIn: false
    }
  },
  async created() {
    this.checkLoginStatus()
    await this.fetchArticle()
    await this.fetchRelatedArticles()
  },
  watch: {
    id: {
      handler() {
        this.fetchArticle()
        this.fetchRelatedArticles()
      }
    }
  },
  methods: {
    async fetchArticle() {
      this.loading = true
      try {
        console.log('正在获取文章，ID:', this.id)
        console.log('API基础URL:', import.meta.env.VITE_API_BASE_URL || '/api')
        
        const response = await articlesAPI.getArticle(this.id)
        console.log('API响应:', response)
        
        this.article = {
          ...response.article,
          // 适配前端数据结构
          date: response.article.created_at,
          summary: response.article.excerpt,
          readingTime: response.article.reading_time,
          content: response.article.content,
          author: response.article.author || {
            name: response.article.author_name,
            avatar: response.article.author_avatar || '/default-avatar.png',
            bio: '博客作者'
          }
        }
        this.isLiked = response.article.isLiked || false
        
      } catch (error) {
        console.error('获取文章失败:', error)
        console.error('错误详情:', error.response?.data || error.message)
        this.article = null
      } finally {
        this.loading = false
      }
    },
    
    async fetchRelatedArticles() {
      try {
        if (!this.article) return
        
        const response = await articlesAPI.getArticles({ 
          category: this.article.category,
          limit: 4 
        })
        
        // 过滤掉当前文章，最多显示3篇
        this.relatedArticles = response.articles
          .filter(article => article.id !== parseInt(this.id))
          .slice(0, 3)
          .map(article => ({
            ...article,
            date: article.created_at,
            excerpt: article.excerpt
          }))
          
      } catch (error) {
        console.error('获取相关文章失败:', error)
        this.relatedArticles = []
      }
    },
    
    formatDate(date) {
      return dayjs(date).format('YYYY年MM月DD日')
    },
    
    getAvatarUrl(avatarPath, username) {
      return getAvatarUrl(avatarPath, username)
    },
    
    async toggleLike() {
      try {
        await articlesAPI.toggleLike(this.id)
        if (this.isLiked) {
          this.article.likes = Math.max(0, this.article.likes - 1)
        } else {
          this.article.likes = (this.article.likes || 0) + 1
        }
        this.isLiked = !this.isLiked
      } catch (error) {
        console.error('点赞操作失败:', error)
        alert('操作失败，请稍后重试')
      }
    },
    
    shareArticle() {
      if (navigator.share) {
        navigator.share({
          title: this.article.title,
          text: this.article.summary,
          url: window.location.href
        })
      } else {
        // 复制链接到剪贴板
        navigator.clipboard.writeText(window.location.href)
        alert('链接已复制到剪贴板')
      }
    },
    
    goToArticle(id) {
      this.$router.push(`/article/${id}`)
    },

    checkLoginStatus() {
      const token = localStorage.getItem('blog_token')
      const user = localStorage.getItem('blog_user')
      
      if (token && user) {
        try {
          this.currentUser = JSON.parse(user)
          this.isLoggedIn = true
        } catch (error) {
          console.error('解析用户信息失败:', error)
          this.isLoggedIn = false
          this.currentUser = null
        }
      } else {
        this.isLoggedIn = false
        this.currentUser = null
      }
    }
  }
}
</script>

<style scoped>
.article-page {
  padding: 2rem 0;
}

.loading {
  text-align: center;
  padding: 4rem 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.article-header {
  text-align: center;
  margin-bottom: 3rem;
}

.article-meta {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.category {
  background: #3b82f6;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-weight: 500;
}

.date, .reading-time {
  color: #6b7280;
}

.article-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #1f2937;
}

.article-summary {
  font-size: 1.25rem;
  color: #4b5563;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.article-tags {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tag {
  background: #f3f4f6;
  color: #374151;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.article-image {
  margin-bottom: 3rem;
  border-radius: 1rem;
  overflow: hidden;
}

.article-image img {
  width: 100%;
  height: 400px;
  object-fit: cover;
}

.article-body {
  max-width: 800px;
  margin: 0 auto 3rem;
  line-height: 1.8;
  font-size: 1.1rem;
}

.article-body h2 {
  margin-top: 2rem;
  margin-bottom: 1rem;
  color: #1f2937;
}

.article-body h3 {
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  color: #374151;
}

.article-body p {
  margin-bottom: 1.5rem;
  color: #4b5563;
}

.article-body ul, .article-body ol {
  margin-bottom: 1.5rem;
  padding-left: 2rem;
}

.article-body li {
  margin-bottom: 0.5rem;
  color: #4b5563;
}

.article-body pre {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1rem;
  overflow-x: auto;
  margin-bottom: 1.5rem;
}

.article-body code {
  font-family: 'Fira Code', monospace;
  font-size: 0.9rem;
}

.article-footer {
  border-top: 1px solid #e5e7eb;
  padding-top: 2rem;
  margin-bottom: 3rem;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.author-avatar img {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
}

.author-details h4 {
  margin-bottom: 0.25rem;
  color: #1f2937;
}

.author-details p {
  color: #6b7280;
  margin: 0;
}

.article-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.action-btn {
  padding: 0.75rem 1.5rem;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.875rem;
  font-weight: 500;
}

.action-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.action-btn.liked {
  border-color: #ef4444;
  color: #ef4444;
}

.related-articles {
  border-top: 1px solid #e5e7eb;
  padding-top: 3rem;
}

.related-articles h3 {
  text-align: center;
  margin-bottom: 2rem;
  font-size: 1.5rem;
  color: #1f2937;
}

.article-card-small {
  cursor: pointer;
}

.article-card-small .article-title {
  font-size: 1.125rem;
  margin-bottom: 0.5rem;
}

.article-card-small .article-excerpt {
  color: #6b7280;
  font-size: 0.875rem;
}

.error {
  text-align: center;
  padding: 4rem 0;
}

.error h2 {
  margin-bottom: 1rem;
  color: #1f2937;
}

.error p {
  color: #6b7280;
  margin-bottom: 2rem;
}

@media (max-width: 768px) {
  .article-title {
    font-size: 2rem;
  }
  
  .article-summary {
    font-size: 1.125rem;
  }
  
  .article-meta {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .article-body {
    font-size: 1rem;
  }
  
  .author-info {
    flex-direction: column;
    text-align: center;
  }
  
  .article-actions {
    flex-direction: column;
  }
}
</style>