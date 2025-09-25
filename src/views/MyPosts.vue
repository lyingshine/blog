<template>
  <div class="my-posts-page">
    <div class="container">
      <div class="posts-header">
        <h1>我的文章</h1>
        <router-link to="/create" class="btn">
          ✏️ 写新文章
        </router-link>
      </div>

      <div class="posts-filters">
        <div class="filter-tabs">
          <button 
            @click="currentFilter = 'all'" 
            :class="{ active: currentFilter === 'all' }"
            class="filter-tab"
          >
            全部 ({{ allPosts.length }})
          </button>
          <button 
            @click="currentFilter = 'published'" 
            :class="{ active: currentFilter === 'published' }"
            class="filter-tab"
          >
            已发布 ({{ publishedPosts.length }})
          </button>
          <button 
            @click="currentFilter = 'draft'" 
            :class="{ active: currentFilter === 'draft' }"
            class="filter-tab"
          >
            草稿 ({{ draftPosts.length }})
          </button>
        </div>
      </div>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="filteredPosts.length === 0" class="empty-state">
        <h3>{{ getEmptyMessage() }}</h3>
        <p>{{ getEmptyDescription() }}</p>
        <router-link to="/create" class="btn">写第一篇文章</router-link>
      </div>

      <div v-else class="posts-list">
        <div 
          v-for="post in filteredPosts" 
          :key="post.id"
          class="post-item"
        >
          <div v-if="post.image" class="post-image">
            <img :src="post.image" :alt="post.title" />
          </div>
          
          <div class="post-content">
            <div class="post-meta">
              <span class="post-status" :class="post.status">
                {{ post.status === 'published' ? '已发布' : '草稿' }}
              </span>
              <span class="post-date">{{ formatDate(post.date) }}</span>
              <span v-if="post.featured" class="featured-badge">精选</span>
            </div>
            
            <h3 class="post-title">{{ post.title }}</h3>
            <p class="post-excerpt">{{ post.excerpt }}</p>
            
            <div class="post-stats">
              <span class="stat">👁️ {{ post.views || 0 }}</span>
              <span class="stat">❤️ {{ post.likes || 0 }}</span>
              <span class="stat">📖 {{ post.readingTime || 1 }}分钟</span>
            </div>
            
            <div class="post-tags">
              <span v-for="tag in post.tags" :key="tag" class="tag">
                {{ tag }}
              </span>
            </div>
          </div>
          
          <div class="post-actions">
            <router-link :to="`/article/${post.id}`" class="action-btn view-btn">
              预览
            </router-link>
            <router-link :to="`/edit/${post.id}`" class="action-btn edit-btn">
              编辑
            </router-link>
            <button @click="deletePost(post.id)" class="action-btn delete-btn">
              删除
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import dayjs from 'dayjs'
import { useAuth } from '../composables/useAuth'

export default {
  name: 'MyPosts',
  data() {
    return {
      loading: true,
      currentFilter: 'all',
      allPosts: []
    }
  },
  setup() {
    const { user } = useAuth()
    return {
      currentUser: user
    }
  },
  computed: {
    publishedPosts() {
      return this.allPosts.filter(post => post.status === 'published')
    },
    
    draftPosts() {
      return this.allPosts.filter(post => post.status === 'draft')
    },
    
    filteredPosts() {
      switch (this.currentFilter) {
        case 'published':
          return this.publishedPosts
        case 'draft':
          return this.draftPosts
        default:
          return this.allPosts
      }
    }
  },
  async created() {
    await this.fetchMyPosts()
  },
  methods: {
    async fetchMyPosts() {
      this.loading = true
      try {
        await new Promise(resolve => setTimeout(resolve, 300))
        
        const articles = JSON.parse(localStorage.getItem('blog_articles') || '[]')
        
        // 只显示当前用户的文章
        this.allPosts = articles
          .filter(article => article.author?.name === this.currentUser.username)
          .sort((a, b) => new Date(b.updatedAt || b.date) - new Date(a.updatedAt || a.date))
          
      } catch (error) {
        console.error('获取文章失败:', error)
      } finally {
        this.loading = false
      }
    },
    
    async deletePost(postId) {
      if (!confirm('确定要删除这篇文章吗？此操作不可恢复。')) {
        return
      }
      
      try {
        const articles = JSON.parse(localStorage.getItem('blog_articles') || '[]')
        const updatedArticles = articles.filter(article => article.id !== postId)
        localStorage.setItem('blog_articles', JSON.stringify(updatedArticles))
        
        // 更新本地数据
        this.allPosts = this.allPosts.filter(post => post.id !== postId)
        
        alert('文章已删除')
      } catch (error) {
        console.error('删除文章失败:', error)
        alert('删除失败')
      }
    },
    
    formatDate(date) {
      return dayjs(date).format('YYYY年MM月DD日')
    },
    
    getEmptyMessage() {
      switch (this.currentFilter) {
        case 'published':
          return '还没有发布的文章'
        case 'draft':
          return '还没有草稿'
        default:
          return '还没有文章'
      }
    },
    
    getEmptyDescription() {
      switch (this.currentFilter) {
        case 'published':
          return '发布你的第一篇文章，与读者分享你的想法'
        case 'draft':
          return '创建草稿，随时保存你的创作进度'
        default:
          return '开始你的创作之旅，写下第一篇文章'
      }
    }
  }
}
</script>

<style scoped>
.my-posts-page {
  padding: 2rem 0;
  min-height: 100vh;
  background: #f8fafc;
}

.posts-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.posts-header h1 {
  color: #1f2937;
  margin: 0;
}

.posts-filters {
  margin-bottom: 2rem;
}

.filter-tabs {
  display: flex;
  gap: 0.5rem;
  background: white;
  padding: 0.5rem;
  border-radius: 0.75rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.filter-tab {
  padding: 0.75rem 1.5rem;
  border: none;
  background: transparent;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  color: #6b7280;
  transition: all 0.3s ease;
}

.filter-tab.active {
  background: #3b82f6;
  color: white;
}

.filter-tab:hover:not(.active) {
  background: #f3f4f6;
  color: #374151;
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

.empty-state {
  text-align: center;
  padding: 4rem 0;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.empty-state h3 {
  color: #1f2937;
  margin-bottom: 1rem;
}

.empty-state p {
  color: #6b7280;
  margin-bottom: 2rem;
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.post-item {
  display: flex;
  background: white;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.post-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.post-image {
  width: 200px;
  height: 150px;
  flex-shrink: 0;
  overflow: hidden;
}

.post-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.post-content {
  flex: 1;
  padding: 1.5rem;
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
}

.post-status {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-weight: 500;
  font-size: 0.75rem;
}

.post-status.published {
  background: #dcfce7;
  color: #166534;
}

.post-status.draft {
  background: #fef3c7;
  color: #92400e;
}

.post-date {
  color: #6b7280;
}

.featured-badge {
  background: #3b82f6;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.post-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.post-excerpt {
  color: #4b5563;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.post-stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.post-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tag {
  background: #f3f4f6;
  color: #374151;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.post-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.5rem;
  border-left: 1px solid #e5e7eb;
}

.action-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  text-align: center;
  transition: all 0.3s ease;
}

.view-btn {
  background: #f3f4f6;
  color: #374151;
}

.view-btn:hover {
  background: #e5e7eb;
}

.edit-btn {
  background: #3b82f6;
  color: white;
}

.edit-btn:hover {
  background: #1d4ed8;
}

.delete-btn {
  background: #ef4444;
  color: white;
}

.delete-btn:hover {
  background: #dc2626;
}

@media (max-width: 768px) {
  .posts-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .filter-tabs {
    flex-direction: column;
  }

  .post-item {
    flex-direction: column;
  }

  .post-image {
    width: 100%;
    height: 200px;
  }

  .post-actions {
    flex-direction: row;
    border-left: none;
    border-top: 1px solid #e5e7eb;
  }
}
</style>