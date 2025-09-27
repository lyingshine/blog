<template>
  <div class="system-settings">
    <div class="management-header">
      <h3>系统设置</h3>
    </div>

    <div class="settings-grid">
      <!-- 服务器状态 -->
      <div class="setting-card">
        <div class="setting-header">
          <Icon name="server" />
          <h4>服务器状态</h4>
        </div>
        <div class="setting-content">
          <div class="status-indicator">
            <span :class="['status-dot', serverStatus]"></span>
            <span class="status-text">{{ getServerStatusText(serverStatus) }}</span>
          </div>
        </div>
      </div>

      <!-- 数据库状态 -->
      <div class="setting-card">
        <div class="setting-header">
          <Icon name="database" />
          <h4>数据库状态</h4>
        </div>
        <div class="setting-content">
          <div class="status-indicator">
            <span :class="['status-dot', dbStatus]"></span>
            <span class="status-text">{{ getDbStatusText(dbStatus) }}</span>
          </div>
        </div>
      </div>

      <!-- 系统操作 -->
      <div class="setting-card full-width">
        <div class="setting-header">
          <Icon name="settings" />
          <h4>系统操作</h4>
        </div>
        <div class="setting-content">
          <div class="action-buttons">
            <button @click="$emit('init-database')" class="btn btn-primary">
              <Icon name="database" />
              初始化数据库
            </button>
            <button @click="$emit('create-sample-data')" class="btn btn-secondary">
              <Icon name="plus" />
              创建示例数据
            </button>
            <button @click="$emit('clear-cache')" class="btn btn-warning">
              <Icon name="trash" />
              清理缓存
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Icon from '../common/Icon.vue'

defineProps({
  serverStatus: {
    type: String,
    default: 'online'
  },
  dbStatus: {
    type: String,
    default: 'connected'
  }
})

defineEmits(['init-database', 'create-sample-data', 'clear-cache'])

const getServerStatusText = (status) => {
  const statusMap = {
    'online': '在线',
    'offline': '离线',
    'maintenance': '维护中'
  }
  return statusMap[status] || status
}

const getDbStatusText = (status) => {
  const statusMap = {
    'connected': '已连接',
    'disconnected': '未连接',
    'error': '连接错误'
  }
  return statusMap[status] || status
}
</script>

<style scoped>
.system-settings {
  width: 100%;
}

.management-header {
  margin-bottom: 1.5rem;
}

.management-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.setting-card {
  background: #f8fafc;
  border-radius: 0.5rem;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
}

.setting-card.full-width {
  grid-column: 1 / -1;
}

.setting-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.setting-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.setting-content {
  color: #6b7280;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.status-dot.online,
.status-dot.connected {
  background: #10b981;
}

.status-dot.offline,
.status-dot.disconnected,
.status-dot.error {
  background: #ef4444;
}

.status-dot.maintenance {
  background: #f59e0b;
}

.status-text {
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
}

.btn-warning {
  background: #f59e0b;
  color: white;
}

.btn-warning:hover {
  background: #d97706;
}
</style>