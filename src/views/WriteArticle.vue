<template>
  <div class="write-article">
    <div class="write-container">
      <header class="write-header">
        <button class="back-btn" @click="$router.back()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          返回
        </button>
        <h1 class="write-title">发布内容</h1>
      </header>
      <p class="write-subtitle">记录观点、经验、故事或任何值得分享的片段。</p>

      <form class="write-form" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label class="form-label" for="title">标题</label>
          <input id="title" v-model="form.title" type="text" class="form-input" placeholder="给这篇内容起一个清晰的标题" required />
        </div>

        <div class="form-group">
          <label class="form-label" for="category">分类</label>
          <select id="category" v-model="form.category" class="form-select">
            <option value="观点">观点</option>
            <option value="经验">经验</option>
            <option value="生活">生活</option>
            <option value="阅读">阅读</option>
            <option value="创作">创作</option>
            <option value="随笔">随笔</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" for="excerpt">摘要</label>
          <textarea id="excerpt" v-model="form.excerpt" class="form-textarea form-textarea-sm" placeholder="一句话概括这篇内容（可选）" rows="2"></textarea>
        </div>

        <div class="form-group">
          <label class="form-label" for="content">正文</label>
          <textarea id="content" v-model="form.content" class="form-textarea" placeholder="开始写作吧（支持 HTML）" rows="16" required></textarea>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="$router.back()">取消</button>
          <button type="submit" class="btn btn-primary" :disabled="submitting">{{ submitting ? '发布中...' : '发布文章' }}</button>
        </div>
      </form>

      <div v-if="message" class="message" :class="messageType">{{ message }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import apiService from '../api'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  title: '',
  category: '观点',
  excerpt: '',
  content: ''
})

const submitting = ref(false)
const message = ref('')
const messageType = ref('')

onMounted(() => {
  if (!authStore.isLoggedIn) {
    router.push('/login')
  }
})

const handleSubmit = async () => {
  if (!form.value.title.trim() || !form.value.content.trim()) {
    message.value = '标题和内容为必填项'
    messageType.value = 'error'
    return
  }

  submitting.value = true
  message.value = ''

  try {
    const response = await apiService.createArticle(form.value)
    message.value = '文章发布成功！'
    messageType.value = 'success'

    setTimeout(() => {
      router.push(`/article/${response.data.id}`)
    }, 1000)
  } catch (error) {
    message.value = error.message || '发布失败，请重试'
    messageType.value = 'error'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.write-article { min-height: calc(100dvh - var(--safe-top)); padding: 24px 22px calc(32px + var(--safe-bottom)); }
.write-container { max-width: 800px; margin: 0 auto; }
.write-header { display: flex; align-items: center; gap: 14px; margin-bottom: 8px; }
.write-subtitle { color: var(--color-text-secondary); margin-bottom: 18px; font-size: 14px; }
.back-btn { display: flex; align-items: center; gap: 6px; min-height: 40px; padding: 8px 14px; background: var(--color-surface); border: 1px solid var(--color-border-light); border-radius: var(--radius-md); color: var(--color-text-secondary); font-size: 14px; cursor: pointer; transition: border-color var(--transition-fast), color var(--transition-fast), background-color var(--transition-fast); }
.back-btn:hover { background: var(--color-accent-subtle); color: var(--color-accent); }
.write-title { font-size: 24px; font-weight: 650; color: var(--color-text-primary); }
.write-form { display: flex; flex-direction: column; gap: 18px; }
.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-label { font-size: 14px; font-weight: 500; color: var(--color-text-secondary); }
.form-input, .form-select, .form-textarea { min-height: 44px; padding: 12px 16px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); color: var(--color-text-primary); font-size: 15px; transition: border-color var(--transition-fast); }
.form-input:focus, .form-select:focus, .form-textarea:focus { outline: none; border-color: var(--color-accent); }
.form-textarea { resize: vertical; font-family: inherit; line-height: 1.6; }
.form-textarea-sm { min-height: 60px; }
.form-actions { display: flex; justify-content: flex-end; gap: 12px; padding-top: 2px; }
.btn { min-height: 44px; padding: 10px 24px; border-radius: 10px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all var(--transition-fast); border: none; }
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-primary { background: var(--color-accent); color: white; }
.btn-primary:hover:not(:disabled) { background: var(--color-accent); }
.btn-secondary { background: var(--color-surface); border: 1px solid var(--color-border-light); color: var(--color-text-secondary); }
.btn-secondary:hover { background: var(--color-accent-subtle); color: var(--color-accent); }
.message { margin-top: 16px; padding: 12px 16px; border-radius: var(--radius-md); font-size: 14px; }
.message.success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
.message.error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
@media (max-width: 768px) {
  .write-article { padding: 18px 16px calc(20px + var(--safe-bottom)); }
  .write-header { flex-direction: column; align-items: flex-start; gap: 10px; margin-bottom: 6px; }
  .write-title { font-size: 22px; }
  .write-subtitle { margin-bottom: 14px; font-size: 13px; }
  .write-form { gap: 14px; }
  .form-actions { flex-direction: column-reverse; }
  .btn { width: 100%; }
  .back-btn { width: 100%; justify-content: center; }
}
</style>
