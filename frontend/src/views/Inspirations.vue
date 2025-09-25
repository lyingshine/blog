<template>
  <div class="inspirations-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="container">
        <h1 class="page-title">
          <i class="fas fa-lightbulb"></i>
          灵感时刻
        </h1>
        <p class="page-subtitle">分享你的想法，记录生活的美好瞬间</p>
        
        <!-- 发布按钮 -->
        <button 
          v-if="isLoggedIn" 
          @click="showCreateModal = true"
          class="create-btn"
        >
          <i class="fas fa-plus"></i>
          发布灵感
        </button>
      </div>
    </div>

    <!-- 筛选器 -->
    <div class="filters">
      <div class="container">
        <div class="filter-tabs">
          <button 
            :class="{ active: currentFilter === 'all' }"
            @click="setFilter('all')"
          >
            全部
          </button>
          <button 
            v-if="isLoggedIn"
            :class="{ active: currentFilter === 'mine' }"
            @click="setFilter('mine')"
          >
            我的灵感
          </button>
          <button 
            :class="{ active: currentFilter === 'following' }"
            @click="setFilter('following')"
          >
            关注的人
          </button>
        </div>
      </div>
    </div>

    <!-- 灵感列表 -->
    <div class="inspirations-content">
      <div class="container">
        <div v-if="loading && inspirations.length === 0" class="loading">
          <i class="fas fa-spinner fa-spin"></i>
          加载中...
        </div>

        <div v-else-if="inspirations.length === 0" class="empty-state">
          <i class="fas fa-lightbulb-o"></i>
          <h3>还没有灵感</h3>
          <p>成为第一个分享灵感的人吧！</p>
          <button 
            v-if="isLoggedIn" 
            @click="showCreateModal = true"
            class="create-btn"
          >
            发布灵感
          </button>
        </div>

        <div v-else class="inspirations-list">
          <InspirationCard
            v-for="inspiration in inspirations"
            :key="inspiration.id"
            :inspiration="inspiration"
            @like="handleLike"
            @delete="handleDelete"
          />
        </div>

        <!-- 加载更多 -->
        <div v-if="hasMore" class="load-more">
          <button 
            @click="loadMore" 
            :disabled="loading"
            class="load-more-btn"
          >
            <i v-if="loading" class="fas fa-spinner fa-spin"></i>
            <span>{{ loading ? '加载中...' : '加载更多' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 发布灵感弹窗 -->
    <CreateInspirationModal
      v-if="showCreateModal"
      @close="showCreateModal = false"
      @created="handleInspirationCreated"
    />
  </div>
</template>

<script>
import { inspirationsAPI } from '../utils/inspirations-api'
import InspirationCard from '../components/InspirationCard.vue'
import CreateInspirationModal from '../components/CreateInspirationModal.vue'

export default {
  name: 'Inspirations',
  components: {
    InspirationCard,
    CreateInspirationModal
  },
  data() {
    return {
      inspirations: [],
      loading: false,
      currentFilter: 'all',
      currentPage: 1,
      hasMore: true,
      showCreateModal: false
    }
  },
  computed: {
    isLoggedIn() {
      return !!localStorage.getItem('blog_token')
    },
    currentUser() {
      const userStr = localStorage.getItem('blog_user')
      return userStr ? JSON.parse(userStr) : null
    }
  },
  async created() {
    await this.loadInspirations()
  },
  methods: {
    async loadInspirations(reset = true) {
      if (this.loading) return

      this.loading = true
      
      try {
        if (reset) {
          this.currentPage = 1
          this.inspirations = []
        }

        const params = {
          page: this.currentPage,
          limit: 20
        }

        if (this.currentFilter === 'mine' && this.currentUser) {
          params.user_id = this.currentUser.id
        }

        const response = await inspirationsAPI.getInspirations(params)
        
        if (reset) {
          this.inspirations = response.data.inspirations
        } else {
          this.inspirations.push(...response.data.inspirations)
        }

        this.hasMore = this.currentPage < response.data.totalPages
        
      } catch (error) {
        console.error('加载灵感失败:', error)
        this.$message?.error('加载灵感失败')
      } finally {
        this.loading = false
      }
    },

    async loadMore() {
      if (!this.hasMore || this.loading) return
      
      this.currentPage++
      await this.loadInspirations(false)
    },

    async setFilter(filter) {
      if (filter === 'following') {
        this.$message?.info('关注功能即将上线')
        return
      }
      
      this.currentFilter = filter
      await this.loadInspirations()
    },

    async handleLike(inspirationId) {
      if (!this.isLoggedIn) {
        this.$message?.warning('请先登录')
        return
      }

      try {
        const response = await inspirationsAPI.toggleLike(inspirationId)
        
        // 更新本地数据
        const inspiration = this.inspirations.find(i => i.id === inspirationId)
        if (inspiration) {
          inspiration.isLiked = response.data.isLiked
          inspiration.likes_count = response.data.likes_count
        }
        
      } catch (error) {
        console.error('点赞失败:', error)
        this.$message?.error('操作失败')
      }
    },

    async handleDelete(inspirationId) {
      if (!confirm('确定要删除这条灵感吗？')) return

      try {
        await inspirationsAPI.deleteInspiration(inspirationId)
        
        // 从列表中移除
        this.inspirations = this.inspirations.filter(i => i.id !== inspirationId)
        this.$message?.success('删除成功')
        
      } catch (error) {
        console.error('删除失败:', error)
        this.$message?.error('删除失败')
      }
    },

    handleInspirationCreated(newInspiration) {
      // 将新灵感添加到列表顶部
      this.inspirations.unshift(newInspiration)
      this.showCreateModal = false
      this.$message?.success('发布成功')
    }
  }
}
</script>

<style scoped>
.inspirations-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.page-header {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 2rem 0;
  text-align: center;
  color: white;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.page-subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
  margin-bottom: 1.5rem;
}

.create-btn {
  background: linear-gradient(45deg, #ff6b6b, #ee5a24);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255, 107, 107, 0.3);
}

.filters {
  background: rgba(255, 255, 255, 0.95);
  padding: 1rem 0;
  border-bottom: 1px solid #e0e0e0;
}

.filter-tabs {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.filter-tabs button {
  background: none;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.filter-tabs button.active {
  background: #667eea;
  color: white;
}

.filter-tabs button:hover:not(.active) {
  background: #f0f0f0;
}

.inspirations-content {
  padding: 2rem 0;
}

.loading, .empty-state {
  text-align: center;
  padding: 3rem 0;
  color: white;
}

.empty-state i {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.6;
}

.empty-state h3 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.inspirations-list {
  display: grid;
  gap: 1.5rem;
  max-width: 600px;
  margin: 0 auto;
}

.load-more {
  text-align: center;
  margin-top: 2rem;
}

.load-more-btn {
  background: rgba(255, 255, 255, 0.9);
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.load-more-btn:hover:not(:disabled) {
  background: white;
  transform: translateY(-2px);
}

.load-more-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

@media (max-width: 768px) {
  .page-title {
    font-size: 2rem;
  }
  
  .filter-tabs {
    flex-wrap: wrap;
  }
  
  .inspirations-list {
    gap: 1rem;
  }
}
</style>