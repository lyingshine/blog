<template>
  <div class="admin-page">
    <div class="container">
      <div class="admin-header">
        <h1>管理后台</h1>
        <p>博客系统管理控制台</p>
      </div>

      <!-- 统计概览 -->
      <div class="stats-overview">
        <div class="stat-card">
          <div class="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
            </svg>
          </div>
          <div class="stat-content">
            <h3>{{ stats.articles }}</h3>
            <p>文章总数</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div class="stat-content">
            <h3>{{ stats.users }}</h3>
            <p>注册用户</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div class="stat-content">
            <h3>{{ stats.comments }}</h3>
            <p>评论总数</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
            </svg>
          </div>
          <div class="stat-content">
            <h3>{{ stats.views }}</h3>
            <p>总浏览量</p>
          </div>
        </div>
      </div>

      <!-- 管理功能区 -->
      <div class="admin-content">
        <!-- 文章管理 -->
        <div class="admin-section">
          <div class="section-header">
            <h2>文章管理</h2>
            <div class="section-actions">
              <button @click="refreshArticles" class="btn btn-secondary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="23 4 23 10 17 10"></polyline>
                  <polyline points="1 20 1 14 7 14"></polyline>
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
                </svg>
                刷新
              </button>
              <router-link to="/create" class="btn btn-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                新建文章
              </router-link>
            </div>
          </div>

          <div class="table-container">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>标题</th>
                  <th>作者</th>
                  <th>状态</th>
                  <th>浏览量</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="article in articles" :key="article.id">
                  <td>
                    <div class="article-title">
                      <router-link :to="`/article/${article.id}`" class="title-link">
                        {{ article.title }}
                      </router-link>
                      <span v-if="article.featured" class="featured-badge">精选</span>
                    </div>
                  </td>
                  <td>{{ article.author?.name || '未知' }}</td>
                  <td>
                    <span :class="['status-badge', article.status]">
                      {{ article.status === 'published' ? '已发布' : '草稿' }}
                    </span>
                  </td>
                  <td>{{ article.views || 0 }}</td>
                  <td>{{ formatDate(article.created_at) }}</td>
                  <td>
                    <div class="action-buttons">
                      <router-link :to="`/edit/${article.id}`" class="btn-icon" title="编辑">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </router-link>
                      <button @click="toggleArticleStatus(article)" class="btn-icon" :title="article.status === 'published' ? '设为草稿' : '发布'">
                        <svg v-if="article.status === 'published'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      </button>
                      <button @click="deleteArticle(article)" class="btn-icon btn-danger" title="删除">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="3,6 5,6 21,6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            
            <div v-if="articles.length === 0" class="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
              </svg>
              <p>暂无文章</p>
            </div>
          </div>
        </div>

        <!-- 用户管理 -->
        <div class="admin-section">
          <div class="section-header">
            <h2>用户管理</h2>
            <button @click="refreshUsers" class="btn btn-secondary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 4 23 10 17 10"></polyline>
                <polyline points="1 20 1 14 7 14"></polyline>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
              </svg>
              刷新
            </button>
          </div>

          <div class="table-container">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>用户</th>
                  <th>邮箱</th>
                  <th>文章数</th>
                  <th>注册时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in users" :key="user.id">
                  <td>
                    <div class="user-info">
                      <img :src="user.avatar" :alt="user.username" class="user-avatar">
                      <div>
                        <div class="username">{{ user.username }}</div>
                        <div class="user-bio">{{ user.bio || '暂无简介' }}</div>
                      </div>
                    </div>
                  </td>
                  <td>{{ user.email }}</td>
                  <td>{{ user.article_count || 0 }}</td>
                  <td>{{ formatDate(user.created_at) }}</td>
                  <td>
                    <div class="action-buttons">
                      <button @click="viewUserProfile(user)" class="btn-icon" title="查看详情">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <div v-if="users.length === 0" class="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <p>暂无用户</p>
            </div>
          </div>
        </div>

        <!-- 系统工具 -->
        <div class="admin-section">
          <div class="section-header">
            <h2>系统工具</h2>
          </div>

          <div class="tools-grid">
            <div class="tool-card">
              <h3>数据库管理</h3>
              <p>管理数据库结构和数据</p>
              <div class="tool-actions">
                <button @click="initDatabase" class="btn btn-outline">初始化数据库</button>
                <button @click="createSampleData" class="btn btn-outline">创建示例数据</button>
              </div>
            </div>

            <div class="tool-card">
              <h3>缓存管理</h3>
              <p>清理系统缓存和临时文件</p>
              <div class="tool-actions">
                <button @click="clearCache" class="btn btn-outline">清理缓存</button>
              </div>
            </div>

            <div class="tool-card">
              <h3>系统信息</h3>
              <p>查看系统运行状态</p>
              <div class="system-info">
                <div class="info-item">
                  <span>服务器状态:</span>
                  <span :class="['status-dot', serverStatus]"></span>
                  <span>{{ serverStatus === 'online' ? '在线' : '离线' }}</span>
                </div>
                <div class="info-item">
                  <span>数据库状态:</span>
                  <span :class="['status-dot', dbStatus]"></span>
                  <span>{{ dbStatus === 'connected' ? '已连接' : '未连接' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '../stores/auth.store'
import message from '../utils/message.js'

export default {
  name: 'Admin',
  setup() {
    const { user } = useAuthStore()
    return { currentUser: user }
  },
  data() {
    return {
      loading: false,
      stats: {
        articles: 0,
        users: 0,
        comments: 0,
        views: 0
      },
      articles: [],
      users: [],
      serverStatus: 'online',
      dbStatus: 'connected'
    }
  },
  async mounted() {
    await this.loadData()
  },
  methods: {
    async loadData() {
      this.loading = true
      try {
        await Promise.all([
          this.loadStats(),
          this.loadArticles(),
          this.loadUsers()
        ])
      } catch (error) {
        console.error('加载数据失败:', error)
        message.error('加载数据失败')
      } finally {
        this.loading = false
      }
    },

    async loadStats() {
      try {
        const response = await fetch('/api/admin/stats', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('blog_token')}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          this.stats = data.stats
        }
      } catch (error) {
        console.error('获取统计数据失败:', error)
      }
    },

    async loadArticles() {
      try {
        const response = await fetch('/api/articles?limit=50', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('blog_token')}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          this.articles = data.articles
        }
      } catch (error) {
        console.error('获取文章列表失败:', error)
      }
    },

    async loadUsers() {
      try {
        const response = await fetch('/api/users', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('blog_token')}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          this.users = data.users
        }
      } catch (error) {
        console.error('获取用户列表失败:', error)
      }
    },

    async refreshArticles() {
      await this.loadArticles()
      message.success('文章列表已刷新')
    },

    async refreshUsers() {
      await this.loadUsers()
      message.success('用户列表已刷新')
    },

    async toggleArticleStatus(article) {
      try {
        const newStatus = article.status === 'published' ? 'draft' : 'published'
        const response = await fetch(`/api/articles/${article.id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('blog_token')}`
          },
          body: JSON.stringify({ status: newStatus })
        })

        if (response.ok) {
          article.status = newStatus
          message.success(`文章已${newStatus === 'published' ? '发布' : '设为草稿'}`)
        } else {
          throw new Error('操作失败')
        }
      } catch (error) {
        console.error('切换文章状态失败:', error)
        message.error('操作失败')
      }
    },

    async deleteArticle(article) {
      if (!confirm(`确定要删除文章"${article.title}"吗？此操作不可恢复。`)) {
        return
      }

      try {
        const response = await fetch(`/api/articles/${article.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('blog_token')}`
          }
        })

        if (response.ok) {
          this.articles = this.articles.filter(a => a.id !== article.id)
          message.success('文章已删除')
        } else {
          throw new Error('删除失败')
        }
      } catch (error) {
        console.error('删除文章失败:', error)
        message.error('删除失败')
      }
    },

    viewUserProfile(user) {
      // 这里可以打开用户详情模态框或跳转到用户页面
      message.info(`查看用户: ${user.username}`)
    },

    async initDatabase() {
      if (!confirm('确定要初始化数据库吗？这将重置所有数据结构。')) {
        return
      }

      try {
        const response = await fetch('/api/admin/init-database', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('blog_token')}`
          }
        })

        if (response.ok) {
          message.success('数据库初始化成功')
          await this.loadData()
        } else {
          throw new Error('初始化失败')
        }
      } catch (error) {
        console.error('数据库初始化失败:', error)
        message.error('初始化失败')
      }
    },

    async createSampleData() {
      if (!confirm('确定要创建示例数据吗？')) {
        return
      }

      try {
        const response = await fetch('/api/admin/sample-data', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('blog_token')}`
          }
        })

        if (response.ok) {
          message.success('示例数据创建成功')
          await this.loadData()
        } else {
          throw new Error('创建失败')
        }
      } catch (error) {
        console.error('创建示例数据失败:', error)
        message.error('创建失败')
      }
    },

    clearCache() {
      localStorage.clear()
      message.success('缓存已清理')
    },

    formatDate(dateString) {
      if (!dateString) return '-'
      return new Date(dateString).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }
}
</script>

<style scoped>
.admin-page {
  padding: 2rem 0;
  min-height: calc(100vh - 200px);
  background: #f8fafc;
}

.admin-header {
  text-align: center;
  margin-bottom: 3rem;
}

.admin-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #1f2937;
}

.admin-header p {
  font-size: 1.125rem;
  color: #6b7280;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 1rem;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3b82f6;
}

.stat-content h3 {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.25rem 0;
  color: #1f2937;
}

.stat-content p {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.admin-content {
  max-width: 1200px;
  margin: 0 auto;
}

.admin-section {
  background: white;
  border-radius: 1rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem;
  border-bottom: 1px solid #e5e7eb;
}

.section-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
}

.section-actions {
  display: flex;
  gap: 1rem;
}

.table-container {
  overflow-x: auto;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
}

.admin-table th,
.admin-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.admin-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.article-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.title-link {
  color: #1f2937;
  text-decoration: none;
  font-weight: 500;
}

.title-link:hover {
  color: #3b82f6;
}

.featured-badge {
  background: #fef3c7;
  color: #d97706;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.published {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.draft {
  background: #f3f4f6;
  color: #374151;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border: none;
  background: #f3f4f6;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #6b7280;
}

.btn-icon:hover {
  background: #e5e7eb;
  color: #374151;
}

.btn-icon.btn-danger:hover {
  background: #fee2e2;
  color: #dc2626;
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
  font-weight: 500;
  color: #1f2937;
}

.user-bio {
  font-size: 0.875rem;
  color: #6b7280;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}

.empty-state svg {
  margin-bottom: 1rem;
  opacity: 0.5;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  padding: 2rem;
}

.tool-card {
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
}

.tool-card h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.tool-card p {
  margin: 0 0 1rem 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.tool-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.system-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.online,
.status-dot.connected {
  background: #10b981;
}

.status-dot.offline,
.status-dot.disconnected {
  background: #ef4444;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .admin-header h1 {
    font-size: 2rem;
  }
  
  .section-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .section-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .stats-overview {
    grid-template-columns: 1fr;
  }
  
  .tools-grid {
    grid-template-columns: 1fr;
  }
}
</style>