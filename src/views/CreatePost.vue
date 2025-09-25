<template>
  <div class="create-post-page">
    <div class="container">
      <div class="post-header">
        <h1>{{ isEdit ? '编辑文章' : '写新文章' }}</h1>
        <div class="post-actions">
          <button @click="saveDraft" class="btn btn-outline" :disabled="saving">
            {{ saving ? '保存中...' : '保存草稿' }}
          </button>
          <button @click="publishPost" class="btn" :disabled="saving || !canPublish">
            {{ saving ? '发布中...' : '发布文章' }}
          </button>
        </div>
      </div>

      <div class="post-form">
        <div class="form-group">
          <input
            v-model="post.title"
            type="text"
            placeholder="请输入文章标题..."
            class="title-input"
            maxlength="100"
          />
          <div class="char-count">{{ post.title.length }}/100</div>
        </div>

        <div class="form-group">
          <input
            v-model="post.excerpt"
            type="text"
            placeholder="请输入文章摘要..."
            class="excerpt-input"
            maxlength="200"
          />
          <div class="char-count">{{ post.excerpt.length }}/200</div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>分类</label>
            <select v-model="post.category" class="category-select">
              <option value="">选择分类</option>
              <option value="技术">技术</option>
              <option value="生活">生活</option>
              <option value="随笔">随笔</option>
              <option value="教程">教程</option>
            </select>
          </div>

          <div class="form-group">
            <label>封面图片URL (可选)</label>
            <input
              v-model="post.image"
              type="url"
              placeholder="https://example.com/image.jpg"
              class="image-input"
            />
          </div>
        </div>

        <div class="form-group">
          <label>标签 (用逗号分隔)</label>
          <input
            v-model="tagsInput"
            type="text"
            placeholder="Vue, JavaScript, 前端"
            class="tags-input"
          />
          <div class="tags-preview">
            <span v-for="tag in post.tags" :key="tag" class="tag">
              {{ tag }}
            </span>
          </div>
        </div>

        <div class="form-group">
          <label>文章内容</label>
          <div class="editor-toolbar">
            <button @click="insertMarkdown('**', '**')" type="button" class="toolbar-btn">
              <strong>B</strong>
            </button>
            <button @click="insertMarkdown('*', '*')" type="button" class="toolbar-btn">
              <em>I</em>
            </button>
            <button @click="insertMarkdown('## ', '')" type="button" class="toolbar-btn">
              H2
            </button>
            <button @click="insertMarkdown('### ', '')" type="button" class="toolbar-btn">
              H3
            </button>
            <button @click="insertMarkdown('- ', '')" type="button" class="toolbar-btn">
              列表
            </button>
            <button @click="insertMarkdown('```\n', '\n```')" type="button" class="toolbar-btn">
              代码
            </button>
            <button @click="insertMarkdown('[链接文字](', ')')" type="button" class="toolbar-btn">
              链接
            </button>
          </div>
          <textarea
            ref="contentTextarea"
            v-model="post.content"
            placeholder="开始写作吧... 支持 Markdown 语法"
            class="content-textarea"
            rows="20"
          ></textarea>
          <div class="editor-help">
            <small>支持 Markdown 语法。使用工具栏快速插入格式。</small>
          </div>
        </div>

        <div class="form-group">
          <label>
            <input v-model="post.featured" type="checkbox" />
            设为精选文章
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useAuth } from '../composables/useAuth'

export default {
  name: 'CreatePost',
  props: {
    id: String
  },
  data() {
    return {
      isEdit: false,
      saving: false,
      post: {
        title: '',
        excerpt: '',
        content: '',
        category: '',
        image: '',
        tags: [],
        featured: false,
        status: 'draft' // draft, published
      },
      tagsInput: ''
    }
  },
  setup() {
    const { user } = useAuth()
    return {
      currentUser: user
    }
  },
  computed: {
    canPublish() {
      return this.post.title.trim() && 
             this.post.excerpt.trim() && 
             this.post.content.trim() && 
             this.post.category
    }
  },
  watch: {
    tagsInput(newValue) {
      this.post.tags = newValue
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
    }
  },
  async created() {
    if (this.id) {
      this.isEdit = true
      await this.loadPost()
    }
  },
  methods: {
    async loadPost() {
      try {
        const articles = JSON.parse(localStorage.getItem('blog_articles') || '[]')
        const article = articles.find(a => a.id.toString() === this.id)
        
        if (article) {
          this.post = {
            title: article.title,
            excerpt: article.excerpt,
            content: article.content,
            category: article.category,
            image: article.image || '',
            tags: article.tags || [],
            featured: article.featured || false,
            status: article.status || 'published'
          }
          this.tagsInput = this.post.tags.join(', ')
        } else {
          alert('文章不存在')
          this.$router.push('/')
        }
      } catch (error) {
        console.error('加载文章失败:', error)
        alert('加载文章失败')
      }
    },

    async saveDraft() {
      if (!this.post.title.trim()) {
        alert('请输入文章标题')
        return
      }

      this.saving = true
      try {
        await this.savePost('draft')
        alert('草稿已保存')
      } catch (error) {
        alert('保存失败: ' + error.message)
      } finally {
        this.saving = false
      }
    },

    async publishPost() {
      if (!this.canPublish) {
        alert('请填写完整的文章信息')
        return
      }

      this.saving = true
      try {
        await this.savePost('published')
        alert('文章已发布')
        this.$router.push('/')
      } catch (error) {
        alert('发布失败: ' + error.message)
      } finally {
        this.saving = false
      }
    },

    async savePost(status) {
      const articles = JSON.parse(localStorage.getItem('blog_articles') || '[]')
      
      const postData = {
        ...this.post,
        status,
        date: this.isEdit ? 
          (articles.find(a => a.id.toString() === this.id)?.date || new Date().toISOString()) : 
          new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: {
          name: this.currentUser.username,
          bio: '博客作者',
          avatar: this.currentUser.avatar
        },
        likes: this.isEdit ? 
          (articles.find(a => a.id.toString() === this.id)?.likes || 0) : 
          0,
        views: this.isEdit ? 
          (articles.find(a => a.id.toString() === this.id)?.views || 0) : 
          0,
        readingTime: this.calculateReadingTime(this.post.content)
      }

      if (this.isEdit) {
        // 更新现有文章
        const index = articles.findIndex(a => a.id.toString() === this.id)
        if (index !== -1) {
          articles[index] = { ...articles[index], ...postData }
        }
      } else {
        // 创建新文章
        postData.id = Date.now()
        articles.unshift(postData)
      }

      localStorage.setItem('blog_articles', JSON.stringify(articles))
    },

    calculateReadingTime(content) {
      const wordsPerMinute = 200
      const words = content.trim().split(/\s+/).length
      return Math.ceil(words / wordsPerMinute)
    },

    insertMarkdown(before, after) {
      const textarea = this.$refs.contentTextarea
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = this.post.content.substring(start, end)
      
      const newText = before + selectedText + after
      this.post.content = 
        this.post.content.substring(0, start) + 
        newText + 
        this.post.content.substring(end)
      
      this.$nextTick(() => {
        textarea.focus()
        textarea.setSelectionRange(
          start + before.length, 
          start + before.length + selectedText.length
        )
      })
    }
  }
}
</script>

<style scoped>
.create-post-page {
  padding: 2rem 0;
  min-height: 100vh;
  background: #f8fafc;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.post-header h1 {
  color: #1f2937;
  margin: 0;
}

.post-actions {
  display: flex;
  gap: 1rem;
}

.post-form {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.form-group {
  margin-bottom: 1.5rem;
  position: relative;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.title-input {
  width: 100%;
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1.5rem;
  font-weight: 600;
  transition: border-color 0.3s ease;
}

.excerpt-input,
.category-select,
.image-input,
.tags-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.title-input:focus,
.excerpt-input:focus,
.category-select:focus,
.image-input:focus,
.tags-input:focus,
.content-textarea:focus {
  outline: none;
  border-color: #3b82f6;
}

.char-count {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.75rem;
  color: #9ca3af;
  pointer-events: none;
}

.tags-preview {
  margin-top: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  background: #3b82f6;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.editor-toolbar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  flex-wrap: wrap;
}

.toolbar-btn {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.toolbar-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.content-textarea {
  width: 100%;
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
  line-height: 1.6;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  resize: vertical;
  min-height: 400px;
}

.editor-help {
  margin-top: 0.5rem;
  color: #6b7280;
}

@media (max-width: 768px) {
  .post-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .post-actions {
    justify-content: stretch;
  }

  .post-actions .btn {
    flex: 1;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .editor-toolbar {
    justify-content: center;
  }

  .toolbar-btn {
    flex: 1;
    min-width: 60px;
  }
}
</style>