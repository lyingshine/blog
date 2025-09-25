<template>
  <div class="admin-page">
    <div class="container">
      <div class="admin-header">
        <h1>数据管理</h1>
        <p>管理博客文章和用户数据</p>
      </div>

      <div class="admin-content">
        <div class="admin-section">
          <h2>文章管理</h2>
          <div class="admin-actions">
            <button @click="clearArticles" class="btn btn-outline">
              清空所有文章
            </button>
          </div>
          
          <div class="data-info">
            <p>当前文章数量: {{ articleCount }}</p>
          </div>
        </div>

        <div class="admin-section">
          <h2>用户管理</h2>
          <div class="admin-actions">
            <button @click="clearUsers" class="btn btn-outline">
              清空用户数据
            </button>
          </div>
          
          <div class="data-info">
            <p>注册用户数量: {{ userCount }}</p>
          </div>
        </div>

        <div class="admin-section">
          <h2>系统状态</h2>
          <div class="status-grid">
            <div class="status-item">
              <h3>存储使用情况</h3>
              <p>{{ storageUsage }}</p>
            </div>
            <div class="status-item">
              <h3>当前用户</h3>
              <p>{{ currentUser || '未登录' }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useAuth } from '../composables/useAuth'


export default {
  name: 'Admin',
  data() {
    return {
      articleCount: 0,
      userCount: 0,
      storageUsage: '0 KB'
    }
  },
  setup() {
    const { user } = useAuth()
    return {
      currentUser: user
    }
  },
  mounted() {
    this.updateStats()
  },
  methods: {
    updateStats() {
      // 更新文章数量
      const articles = JSON.parse(localStorage.getItem('blog_articles') || '[]')
      this.articleCount = articles.length

      // 更新用户数量
      const users = JSON.parse(localStorage.getItem('blog_users') || '[]')
      this.userCount = users.length

      // 计算存储使用情况
      let totalSize = 0
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length
        }
      }
      this.storageUsage = `${(totalSize / 1024).toFixed(2)} KB`
    },



    clearArticles() {
      if (confirm('确定要清空所有文章吗？此操作不可恢复。')) {
        localStorage.removeItem('blog_articles')
        this.updateStats()
        alert('所有文章已清空！')
      }
    },

    clearUsers() {
      if (confirm('确定要清空所有用户数据吗？此操作不可恢复。')) {
        localStorage.removeItem('blog_users')
        this.updateStats()
        alert('用户数据已清空！')
      }
    }
  }
}
</script>

<style scoped>
.admin-page {
  padding: 2rem 0;
  min-height: 80vh;
}

.admin-header {
  text-align: center;
  margin-bottom: 3rem;
}

.admin-header h1 {
  font-size: 2.5rem;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.admin-header p {
  color: #6b7280;
  font-size: 1.125rem;
}

.admin-content {
  max-width: 800px;
  margin: 0 auto;
}

.admin-section {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
}

.admin-section h2 {
  color: #1f2937;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}

.admin-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.data-info {
  padding: 1rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
}

.data-info p {
  margin: 0;
  color: #4b5563;
  font-weight: 500;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.status-item {
  padding: 1rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
}

.status-item h3 {
  margin-bottom: 0.5rem;
  color: #374151;
  font-size: 1rem;
}

.status-item p {
  margin: 0;
  color: #6b7280;
  font-weight: 500;
}

@media (max-width: 768px) {
  .admin-header h1 {
    font-size: 2rem;
  }
  
  .admin-actions {
    flex-direction: column;
  }
  
  .status-grid {
    grid-template-columns: 1fr;
  }
}
</style>