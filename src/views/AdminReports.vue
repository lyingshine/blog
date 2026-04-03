<template>
  <div class="admin-reports-page">
    <header class="page-header">
      <div>
        <h1>举报审核</h1>
        <p>管理用户提交的举报，及时处理违规内容。</p>
      </div>
      <router-link class="back-link" to="/admin">返回管理台</router-link>
    </header>

    <section class="toolbar">
      <button
        v-for="item in filters"
        :key="item.value"
        class="filter-btn"
        :class="{ active: statusFilter === item.value }"
        type="button"
        @click="changeFilter(item.value)"
      >
        {{ item.label }}
      </button>
      <button class="refresh-btn" type="button" @click="loadReports" :disabled="loading">刷新</button>
    </section>

    <section class="list-section">
      <div v-if="loading" class="empty-state">加载中...</div>
      <div v-else-if="!reports.length" class="empty-state">当前没有符合条件的举报</div>
      <article v-for="report in reports" :key="report.id" class="report-card">
        <header class="report-header">
          <div class="report-title">
            <strong>#{{ report.id }} · {{ report.target_type }} / {{ report.target_id }}</strong>
            <span class="report-meta">举报人：{{ report.reporter_username || `用户${report.user_id}` }} · {{ formatTime(report.created_at) }}</span>
          </div>
          <span class="status-badge" :class="report.status">{{ statusLabel(report.status) }}</span>
        </header>

        <div class="report-body">
          <p><b>原因：</b>{{ report.reason || '未填写' }}</p>
          <p><b>说明：</b>{{ report.details || '无' }}</p>
        </div>

        <footer class="report-actions">
          <button type="button" class="action-btn" @click="updateStatus(report, 'pending')" :disabled="report.status === 'pending'">
            标记待处理
          </button>
          <button type="button" class="action-btn success" @click="updateStatus(report, 'resolved')" :disabled="report.status === 'resolved'">
            标记已处理
          </button>
          <button type="button" class="action-btn danger" @click="updateStatus(report, 'rejected')" :disabled="report.status === 'rejected'">
            驳回
          </button>
          <router-link
            v-if="report.target_type === 'article'"
            class="jump-link"
            :to="`/article/${report.target_id}`"
            target="_blank"
          >
            查看内容
          </router-link>
          <router-link
            v-else
            class="jump-link"
            to="/moments"
            target="_blank"
          >
            查看动态
          </router-link>
        </footer>
      </article>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import apiService from '../api'

const filters = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待处理' },
  { value: 'resolved', label: '已处理' },
  { value: 'rejected', label: '已驳回' }
]

const statusFilter = ref('pending')
const loading = ref(false)
const reports = ref([])

const statusLabel = (status) => {
  if (status === 'resolved') return '已处理'
  if (status === 'rejected') return '已驳回'
  return '待处理'
}

const formatTime = (dateStr) => {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return '--'
  return d.toLocaleString('zh-CN', { hour12: false })
}

const loadReports = async () => {
  loading.value = true
  try {
    const params = { limit: 120 }
    if (statusFilter.value !== 'all') params.status = statusFilter.value
    const res = await apiService.getAdminReports(params)
    reports.value = res.data || []
  } catch (error) {
    console.error('加载举报失败:', error)
    alert(error.message || '加载举报失败')
  } finally {
    loading.value = false
  }
}

const changeFilter = async (value) => {
  statusFilter.value = value
  await loadReports()
}

const updateStatus = async (report, status) => {
  try {
    const res = await apiService.updateAdminReport(report.id, status)
    const updated = res.data || { ...report, status }
    reports.value = reports.value.map((item) => (item.id === report.id ? { ...item, ...updated } : item))
  } catch (error) {
    console.error('更新举报状态失败:', error)
    alert(error.message || '更新失败')
  }
}

onMounted(async () => {
  await loadReports()
})
</script>

<style scoped>
.admin-reports-page {
  max-width: 1040px;
  margin: 0 auto;
  padding: 24px 18px calc(84px + var(--safe-bottom));
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.page-header h1 {
  margin: 0;
  font-size: 30px;
  letter-spacing: -0.02em;
}

.page-header p {
  margin-top: 6px;
  color: var(--color-text-secondary);
}

.back-link {
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid var(--color-border-light);
  border-radius: 10px;
  color: var(--color-text-secondary);
  display: inline-flex;
  align-items: center;
}

.toolbar {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-btn,
.refresh-btn {
  min-height: 36px;
  border: 1px solid var(--color-border-light);
  border-radius: 10px;
  padding: 0 12px;
  background: var(--color-surface);
  color: var(--color-text-secondary);
}

.filter-btn.active {
  color: var(--color-accent);
  border-color: color-mix(in srgb, var(--color-accent) 36%, var(--color-border-light));
  background: var(--color-accent-subtle);
}

.list-section {
  margin-top: 14px;
  display: grid;
  gap: 10px;
}

.report-card {
  border: 1px solid var(--color-border-light);
  border-radius: 14px;
  background: var(--color-surface);
  padding: 12px;
}

.report-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.report-title {
  min-width: 0;
}

.report-title strong {
  font-size: 15px;
  color: var(--color-text-primary);
}

.report-meta {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.status-badge {
  min-height: 26px;
  border-radius: 999px;
  border: 1px solid var(--color-border-light);
  padding: 0 10px;
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.status-badge.pending {
  color: #b7791f;
  border-color: color-mix(in srgb, #b7791f 35%, var(--color-border-light));
}

.status-badge.resolved {
  color: #0f8a63;
  border-color: color-mix(in srgb, #0f8a63 35%, var(--color-border-light));
}

.status-badge.rejected {
  color: #d64f4f;
  border-color: color-mix(in srgb, #d64f4f 35%, var(--color-border-light));
}

.report-body {
  margin-top: 10px;
}

.report-body p {
  margin: 6px 0;
  color: var(--color-text-secondary);
  white-space: pre-wrap;
  word-break: break-word;
}

.report-actions {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btn {
  min-height: 34px;
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  background: var(--color-surface-elevated);
  color: var(--color-text-secondary);
  padding: 0 10px;
  font-size: 12px;
}

.action-btn.success {
  color: #0f8a63;
}

.action-btn.danger {
  color: #d64f4f;
}

.jump-link {
  min-height: 34px;
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  padding: 0 10px;
  display: inline-flex;
  align-items: center;
}

.empty-state {
  border: 1px dashed var(--color-border);
  border-radius: 12px;
  padding: 22px;
  text-align: center;
  color: var(--color-text-tertiary);
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
  }

  .back-link {
    width: 100%;
    justify-content: center;
  }
}
</style>
