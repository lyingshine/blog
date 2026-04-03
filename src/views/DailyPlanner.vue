<template>
  <div class="planner-page">
    <section class="planner-header">
      <p class="planner-kicker">工具</p>
      <h1 class="planner-title">每日安排</h1>
      <p class="planner-subtitle">围绕“我接下来要完成什么”来规划任务，先做最关键的一件事。</p>
      <p class="planner-date">{{ nowLabel }}</p>

      <div class="header-actions">
        <button class="mode-btn" type="button" @click="toggleEditMode">
          {{ isEditMode ? '完成编辑' : '进入编辑' }}
        </button>
        <button class="notify-btn" type="button" @click="enableBrowserNotification" :disabled="notificationEnabled">
          {{ notificationEnabled ? '系统提醒已开启' : '开启系统提醒' }}
        </button>
      </div>
    </section>

    <section class="planner-summary" v-if="tasks.length > 0">
      <div class="summary-card">
        <p class="summary-label">手动完成</p>
        <p class="summary-value">{{ completedCount }}/{{ tasks.length }}</p>
      </div>
      <div class="summary-card" :class="{ warn: overdueCount > 0 }">
        <p class="summary-label">已过截止</p>
        <p class="summary-value">{{ overdueCount }}</p>
      </div>
      <div class="summary-card" :class="{ warn: upcomingReminderCount > 0 }">
        <p class="summary-label">下一次提醒</p>
        <p class="summary-value small">{{ nextReminderText }}</p>
      </div>
    </section>

    <section class="planner-job" v-if="nextActionTask">
      <div class="job-main">
        <p class="job-label">当前最该做</p>
        <h3 class="job-title">{{ nextActionTask.title || '未命名事项' }}</h3>
        <p class="job-meta">截止 {{ taskDeadlineText(nextActionTask) }} · 建议开始 {{ recommendedStartText(nextActionTask) }}</p>
        <p class="job-reason">{{ nextActionReason }}</p>
      </div>
      <button class="job-btn" type="button" @click="focusTask(nextActionTask.id)">定位这件事</button>
    </section>

    <section class="planner-settings">
      <header class="settings-header compact">
        <div>
          <h3>提醒设置</h3>
          <span>默认已保存，仅在需要时调整</span>
        </div>
        <button class="ghost-btn" type="button" @click="showReminderSettings = !showReminderSettings">
          {{ showReminderSettings ? '收起设置' : '展开设置' }}
        </button>
      </header>
      <div v-if="showReminderSettings" class="webhook-row">
        <label for="feishu-webhook">飞书 Webhook</label>
        <input
          id="feishu-webhook"
          v-model.trim="feishuWebhook"
          type="text"
          class="webhook-input"
          placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/..."
        />
        <button class="ghost-btn" type="button" @click="feishuWebhook = ''">清空</button>
      </div>
    </section>

    <section v-if="isEditMode" class="planner-compose">
      <div class="compose-row">
        <div class="compose-main">
          <input
            v-model="draftTask"
            type="text"
            class="task-input"
            maxlength="120"
            placeholder="新增事项，例如：完成文章初稿"
            @keydown.enter.prevent="addTask"
          />
          <button class="add-btn" type="button" @click="addTask">添加</button>
        </div>
        <div class="compose-meta">
          <label class="inline-field">
            <span>截止日期</span>
            <input id="draft-deadline-date" v-model="draftDeadlineDate" type="date" class="date-input" />
          </label>
          <label class="inline-field">
            <span>截止时间</span>
            <input id="draft-deadline-time" v-model="draftDeadlineTime" type="time" class="time-input" />
          </label>
          <label class="inline-field">
            <span>预计时长</span>
            <div class="minute-wrap">
              <input id="draft-estimate" v-model.number="draftEstimateMinutes" type="number" min="1" max="720" class="minute-input" />
              <small>分钟</small>
            </div>
          </label>
          <div class="quick-date-actions">
            <button type="button" class="quick-btn" @click="setDraftDateOffset(0)">今天</button>
            <button type="button" class="quick-btn" @click="setDraftDateOffset(1)">明天</button>
            <button type="button" class="quick-btn" @click="setDraftDateOffset(7)">+7天</button>
          </div>
        </div>
      </div>

      <p class="compose-hint">每项都建议填写截止日期和时间。提醒时刻 = 截止时刻 - 全部未完成事项预计总时长。</p>
    </section>

    <section v-if="alertMessage" class="reminder-banner">
      <p>{{ alertMessage }}</p>
    </section>

    <section class="planner-board">
      <header class="board-header">
        <div class="board-header-top">
          <h2>事项清单</h2>
          <span class="board-meta">显示 {{ displayTasks.length }} / {{ tasks.length }} 项 · 已完成 {{ completedCount }}/{{ tasks.length }}</span>
        </div>
        <div class="board-tools">
          <div class="filter-group">
            <button
              v-for="item in filterOptions"
              :key="item.value"
              type="button"
              class="filter-btn"
              :class="{ active: filterMode === item.value }"
              @click="filterMode = item.value"
            >
              {{ item.label }}
            </button>
          </div>
          <label class="toggle-complete">
            <input v-model="hideCompleted" type="checkbox" />
            <span>隐藏已完成</span>
          </label>
        </div>
      </header>

      <div v-if="displayTasks.length === 0" class="empty-state">
        <p>{{ tasks.length === 0 ? (isEditMode ? '还没有事项，先添加一件最重要的事。' : '暂无事项，进入编辑模式开始规划。') : '当前筛选条件下暂无事项。' }}</p>
      </div>

      <div v-else class="task-list">
        <article
          v-for="(task, index) in displayTasks"
          :key="task.id"
          class="task-card"
          :class="{ focus: focusedTaskId === task.id }"
          :id="`task-${task.id}`"
        >
          <template v-if="isEditMode">
            <div class="task-top">
              <span class="task-index">{{ String(index + 1).padStart(2, '0') }}</span>
              <input
                v-model="task.title"
                type="text"
                class="task-title-input"
                maxlength="120"
                placeholder="事项内容"
              />
              <button class="remove-btn" type="button" @click="removeTask(task.id)">删除</button>
            </div>

            <div class="task-meta-row">
              <label class="date-time-field">
                <span>截止日期</span>
                <input v-model="task.deadlineDate" type="date" class="date-input" />
              </label>
              <label class="date-time-field">
                <span>截止时间</span>
                <input v-model="task.deadlineTime" type="time" class="time-input" />
              </label>
              <label class="time-field">
                <span>预计时长</span>
                <input v-model.number="task.estimateMinutes" type="number" min="1" max="720" class="minute-input" />
                <small>分钟</small>
              </label>
              <label class="complete-field">
                <input type="checkbox" :checked="task.completed" @change="toggleTaskCompleted(task, $event.target.checked)" />
                <span>完成</span>
              </label>
              <span class="task-state" :class="taskStateClass(task)">{{ taskStateText(task) }}</span>
            </div>

            <label class="result-label">结果反馈{{ task.completed ? '（完成后必填）' : '（可先留空）' }}</label>
            <textarea
              v-model="task.result"
              class="result-input"
              rows="3"
              maxlength="500"
              placeholder="今天这项最终结果是什么？例如：完成 80%，卡在图片压缩，已记录后续动作。"
            ></textarea>
          </template>

          <template v-else>
            <div class="display-top">
              <label class="complete-field display-complete">
                <input type="checkbox" :checked="task.completed" @change="toggleTaskCompleted(task, $event.target.checked)" />
                <span>完成</span>
              </label>
              <div>
                <p class="display-title">{{ task.title || '未命名事项' }}</p>
                <p class="display-meta">
                  截止 {{ taskDeadlineText(task) }} · 预计 {{ task.estimateMinutes || 0 }} 分钟
                </p>
                <p class="display-meta">建议开始：{{ recommendedStartText(task) }}</p>
                <p v-if="task.completedAt" class="display-meta">完成时间：{{ formatDateTime(task.completedAt) }}</p>
              </div>
              <span class="task-state" :class="taskStateClass(task)">{{ taskStateText(task) }}</span>
            </div>
            <div class="display-result">
              <p class="display-label">结果反馈</p>
              <p class="display-content">{{ task.result || '尚未填写' }}</p>
            </div>
          </template>
        </article>
      </div>
    </section>

    <section class="planner-footer">
      <div class="review-status" :class="{ warn: missingFieldsCount > 0 }">
        {{ reviewStatusText }}
      </div>
      <button class="save-btn" type="button" :disabled="tasks.length === 0" @click="saveDayPlan">
        保存安排
      </button>
      <p v-if="message" class="save-message">{{ message }}</p>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import apiService from '../api'
import { useAuthStore } from '../stores/auth'

const STORAGE_KEY = 'daily-planner-current-v4'
const WEBHOOK_KEY = 'daily-planner-feishu-webhook-v1'
const authStore = useAuthStore()

const draftTask = ref('')
const draftDeadlineDate = ref('')
const draftDeadlineTime = ref('')
const draftEstimateMinutes = ref(60)
const feishuWebhook = ref('')
const showReminderSettings = ref(false)
const tasks = ref([])
const message = ref('')
const alertMessage = ref('')
const nowTick = ref(Date.now())
const lastTick = ref(Date.now())
const isEditMode = ref(false)
const filterMode = ref('today')
const hideCompleted = ref(false)
const focusedTaskId = ref('')
const notificationEnabled = ref(false)
const batchReminderMarkSent = ref('')
const hasHydrated = ref(false)
let ticker = null
let alertTimer = null
let focusTimer = null
let remoteSaveTimer = null

const toYmd = (date) => {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const getToday = () => {
  const now = new Date()
  return toYmd(now)
}

const nowLabel = computed(() => {
  const now = new Date(nowTick.value)
  return now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
})

const completedCount = computed(() => tasks.value.filter((item) => item.completed).length)
const filterOptions = [
  { value: 'today', label: '今天' },
  { value: 'future', label: '未来' },
  { value: 'overdue', label: '已超时' },
  { value: 'all', label: '全部' }
]
const getTaskDeadlineDateTime = (task) => {
  if (!task) return ''
  return composeDeadlineDateTime(task.deadlineDate, task.deadlineTime) || task.deadlineDateTime || ''
}

const missingDeadlineCount = computed(() => tasks.value.filter((item) => !item.completed && !getTaskDeadlineDateTime(item)).length)
const missingEstimateCount = computed(() => tasks.value.filter((item) => !item.completed && (!item.estimateMinutes || item.estimateMinutes <= 0)).length)
const missingResultCount = computed(() => tasks.value.filter((item) => item.completed && !item.result.trim()).length)
const missingFieldsCount = computed(() => missingDeadlineCount.value + missingEstimateCount.value + missingResultCount.value)
const pendingTasks = computed(() => tasks.value.filter((item) => !item.completed))
const totalPendingEstimateMinutes = computed(() => {
  return pendingTasks.value
    .reduce((sum, item) => {
      const minutes = Number(item.estimateMinutes)
      return sum + (Number.isFinite(minutes) && minutes > 0 ? minutes : 0)
    }, 0)
})

const getDayKeyFromMs = (ms) => {
  const d = new Date(ms)
  if (Number.isNaN(d.getTime())) return ''
  return toYmd(d)
}

const getTaskDayKey = (task) => {
  const dueMs = getDueTimeMs(task)
  if (dueMs === null) return ''
  return getDayKeyFromMs(dueMs)
}

const getPendingEstimateMinutesForTaskDay = (task) => {
  const taskDayKey = getTaskDayKey(task)
  if (!taskDayKey) return 0

  return pendingTasks.value.reduce((sum, item) => {
    if (getTaskDayKey(item) !== taskDayKey) return sum
    const minutes = Number(item.estimateMinutes)
    return sum + (Number.isFinite(minutes) && minutes > 0 ? minutes : 0)
  }, 0)
}

const getDayBounds = (baseMs) => {
  const date = new Date(baseMs)
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { startMs: start.getTime(), endMs: end.getTime() }
}

const isTaskToday = (task) => {
  const dueMs = getDueTimeMs(task)
  if (dueMs === null) return false
  const { startMs, endMs } = getDayBounds(nowTick.value)
  return dueMs >= startMs && dueMs < endMs
}

const isTaskFuture = (task) => {
  const dueMs = getDueTimeMs(task)
  if (dueMs === null) return false
  const { endMs } = getDayBounds(nowTick.value)
  return dueMs >= endMs
}

const sortTasks = (arr) => {
  return [...arr].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    const aDue = getDueTimeMs(a)
    const bDue = getDueTimeMs(b)
    if (aDue === null && bDue === null) return 0
    if (aDue === null) return 1
    if (bDue === null) return -1
    return aDue - bDue
  })
}

const displayTasks = computed(() => {
  let items = [...tasks.value]

  if (hideCompleted.value) {
    items = items.filter((task) => !task.completed)
  }

  if (filterMode.value === 'today') {
    items = items.filter((task) => isTaskToday(task))
  } else if (filterMode.value === 'future') {
    items = items.filter((task) => isTaskFuture(task))
  } else if (filterMode.value === 'overdue') {
    items = items.filter((task) => !task.completed && compareWithNow(task) !== null && compareWithNow(task) < 0)
  }

  return sortTasks(items)
})

const composeDeadlineDateTime = (date, time) => {
  if (!date || !time) return ''
  return `${date}T${time}`
}

const splitDeadlineDateTime = (dateTime) => {
  if (!dateTime || typeof dateTime !== 'string') return { date: '', time: '' }
  const [date = '', timeRaw = ''] = dateTime.split('T')
  return { date, time: timeRaw.slice(0, 5) }
}

const getDueTimeMs = (task) => {
  const deadlineDateTime = getTaskDeadlineDateTime(task)
  if (!deadlineDateTime) return null
  const due = new Date(deadlineDateTime)
  if (Number.isNaN(due.getTime())) return null
  return due.getTime()
}

const getReminderTimeMs = (task) => {
  const dueMs = getDueTimeMs(task)
  if (dueMs === null) return null
  const totalMinutes = Number(getPendingEstimateMinutesForTaskDay(task))
  if (!totalMinutes || totalMinutes <= 0) return null
  return dueMs - totalMinutes * 60 * 1000
}

const compareWithNow = (task) => {
  const dueMs = getDueTimeMs(task)
  if (dueMs === null) return null
  return dueMs - nowTick.value
}

const overdueCount = computed(() => {
  return pendingTasks.value.filter((item) => compareWithNow(item) !== null && compareWithNow(item) < 0).length
})

const upcomingReminderCount = computed(() => {
  const oneHour = 60 * 60 * 1000
  return pendingTasks.value.filter((item) => {
    const reminderMs = getReminderTimeMs(item)
    if (reminderMs === null) return false
    const diff = reminderMs - nowTick.value
    return diff >= 0 && diff <= oneHour
  }).length
})

const nextReminderTask = computed(() => {
  const candidates = pendingTasks.value
    .map((item) => ({ task: item, reminderMs: getReminderTimeMs(item) }))
    .filter((x) => x.reminderMs !== null)
    .sort((a, b) => a.reminderMs - b.reminderMs)

  return candidates.length > 0 ? candidates[0] : null
})

const nextReminderText = computed(() => {
  if (!nextReminderTask.value) return '暂无'
  const dayLoad = getPendingEstimateMinutesForTaskDay(nextReminderTask.value.task)
  const timeText = new Date(nextReminderTask.value.reminderMs).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
  return `${timeText} · ${nextReminderTask.value.task.title || '未命名事项'} · 当日工时 ${dayLoad} 分钟`
})

const nextActionTask = computed(() => {
  const available = pendingTasks.value.filter((task) => getDueTimeMs(task) !== null && Number(task.estimateMinutes) > 0)
  if (available.length === 0) return null
  return sortTasks(available)[0]
})

const nextActionReason = computed(() => {
  if (!nextActionTask.value) return ''
  const diff = compareWithNow(nextActionTask.value)
  if (diff === null) return '建议先补全该事项截止时间'
  if (diff < 0) return '该事项已超时，建议立刻处理或重新评估截止时间'
  if (diff <= 2 * 60 * 60 * 1000) return '该事项即将到期，建议优先投入'
  return '该事项在未完成任务中最早到期，优先完成可降低整体风险'
})

const reviewStatusText = computed(() => {
  if (missingFieldsCount.value === 0) return '进行中的事项已补全截止与预计，已完成事项已补全结果反馈'

  const parts = []
  if (missingDeadlineCount.value > 0) parts.push(`${missingDeadlineCount.value} 项缺截止时间`)
  if (missingEstimateCount.value > 0) parts.push(`${missingEstimateCount.value} 项缺预计时长`)
  if (missingResultCount.value > 0) parts.push(`${missingResultCount.value} 项已完成但缺结果反馈`)
  return `还有 ${parts.join('，')}`
})

const createTask = (title = '', deadlineDateTime = '', estimateMinutes = 60) => {
  const { date, time } = splitDeadlineDateTime(deadlineDateTime)
  return {
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  title,
  deadlineDate: date,
  deadlineTime: time,
  deadlineDateTime,
  estimateMinutes,
  result: '',
  completed: false,
  completedAt: ''
  }
}

const taskDeadlineText = (task) => {
  const deadlineDateTime = getTaskDeadlineDateTime(task)
  if (!deadlineDateTime) return '--'
  const date = new Date(deadlineDateTime)
  if (Number.isNaN(date.getTime())) return '--'
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

const addTask = () => {
  const title = draftTask.value.trim()
  if (!title) return
  const deadlineDateTime = composeDeadlineDateTime(draftDeadlineDate.value, draftDeadlineTime.value)
  tasks.value.push(createTask(title, deadlineDateTime, Number(draftEstimateMinutes.value) || 60))
  draftTask.value = ''
  draftDeadlineDate.value = getToday()
  draftDeadlineTime.value = ''
  draftEstimateMinutes.value = 60
}

const setDraftDateOffset = (offsetDays) => {
  const base = new Date()
  base.setHours(0, 0, 0, 0)
  base.setDate(base.getDate() + offsetDays)
  draftDeadlineDate.value = toYmd(base)
}

const focusTask = (id) => {
  if (!id) return
  focusedTaskId.value = id
  const target = document.getElementById(`task-${id}`)
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  if (focusTimer) clearTimeout(focusTimer)
  focusTimer = setTimeout(() => {
    focusedTaskId.value = ''
  }, 2200)
}

const removeTask = (id) => {
  tasks.value = tasks.value.filter((item) => item.id !== id)
}

const toggleTaskCompleted = (task, checked) => {
  task.completed = Boolean(checked)
  if (task.completed) {
    task.completedAt = new Date().toISOString()
  } else {
    task.completedAt = ''
  }
  message.value = `状态已更新。下一次提醒：${nextReminderText.value}`
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return '--'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return '--'
  return d.toLocaleString('zh-CN', { hour12: false })
}

const recommendedStartText = (task) => {
  const reminderMs = getReminderTimeMs(task)
  if (reminderMs === null) return '--:--'
  return new Date(reminderMs).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

const taskStateText = (task) => {
  if (task.completed) return '已完成'
  if (!getTaskDeadlineDateTime(task)) return '待设截止'
  if (!task.estimateMinutes || task.estimateMinutes <= 0) return '待设预计时长'

  const reminderMs = getReminderTimeMs(task)
  const dueDiff = compareWithNow(task)

  if (dueDiff === null || reminderMs === null) return '时间异常'
  if (dueDiff < 0) return '已超时'
  if (nowTick.value >= reminderMs) return '应立即开始'
  return '进行中'
}

const taskStateClass = (task) => {
  const state = taskStateText(task)
  if (state === '已完成') return 'done'
  if (state === '已超时') return 'danger'
  if (state === '应立即开始') return 'warn'
  if (state === '进行中') return 'normal'
  return 'missing'
}

const formatPendingTasksForMessage = () => {
  if (pendingTasks.value.length === 0) return '暂无待办事项'
  return pendingTasks.value
    .map((task, index) => `${index + 1}. ${task.title || '未命名事项'}（截止 ${taskDeadlineText(task)}，预计 ${task.estimateMinutes || 0} 分钟）`)
    .join('\n')
}

const getBatchReminderMs = () => {
  const points = pendingTasks.value
    .map((task) => getReminderTimeMs(task))
    .filter((value) => value !== null)

  if (points.length === 0) return null
  return Math.min(...points)
}

const getBatchReminderMark = () => {
  const reminderMs = getBatchReminderMs()
  if (reminderMs === null) return ''
  const fingerprint = pendingTasks.value
    .map((task) => `${task.id}:${getTaskDeadlineDateTime(task)}:${task.estimateMinutes || 0}`)
    .join('|')
  return `${reminderMs}|${fingerprint}`
}

const sendTaskReminder = () => {
  const reminderTask = nextReminderTask.value?.task || null
  const dayLoad = reminderTask ? getPendingEstimateMinutesForTaskDay(reminderTask) : 0
  const text = `提醒：现在应开始处理当前待办（共 ${pendingTasks.value.length} 项，目标日期工时 ${dayLoad} 分钟）。\n${formatPendingTasksForMessage()}`
  alertMessage.value = text
  message.value = text

  if (alertTimer) clearTimeout(alertTimer)
  alertTimer = setTimeout(() => {
    alertMessage.value = ''
  }, 8000)

  if (notificationEnabled.value && 'Notification' in window) {
    try {
      new Notification('每日安排提醒', { body: text })
    } catch (error) {
      console.error('notification failed:', error)
    }
  }
}

const sendFeishuReminder = async (mark) => {
  if (!authStore.isLoggedIn) return
  if (!mark) return

  try {
    await apiService.sendFeishuPlannerReminder({
      title: '每日安排提醒',
      content: formatPendingTasksForMessage(),
      deadline: nextReminderTask.value?.task ? taskDeadlineText(nextReminderTask.value.task) : '',
      estimateMinutes: nextReminderTask.value?.task ? getPendingEstimateMinutesForTaskDay(nextReminderTask.value.task) : 0,
      webhook: feishuWebhook.value || undefined
    })
  } catch (error) {
    console.error('send feishu reminder failed:', error)
  }
}

const checkReminder = () => {
  const reminderMs = getBatchReminderMs()
  const mark = getBatchReminderMark()

  if (reminderMs === null || !mark || batchReminderMarkSent.value === mark) {
    return
  }

  if (lastTick.value < reminderMs && nowTick.value >= reminderMs) {
    batchReminderMarkSent.value = mark
    sendTaskReminder()
    void sendFeishuReminder(mark)
  }
}

const normalizeRestoredTask = (item = {}) => ({
  id: item.id || createTask().id,
  title: item.title || '',
  deadlineDate: item.deadlineDate || splitDeadlineDateTime(item.deadlineDateTime || '').date || (item.deadline ? getToday() : ''),
  deadlineTime: item.deadlineTime || splitDeadlineDateTime(item.deadlineDateTime || '').time || item.deadline || '',
  deadlineDateTime: item.deadlineDateTime || composeDeadlineDateTime(item.deadlineDate, item.deadlineTime) || composeDeadlineDateTime(item.deadline ? getToday() : '', item.deadline || ''),
  estimateMinutes: Number(item.estimateMinutes) || 0,
  result: item.result || '',
  completed: Boolean(item.completed),
  completedAt: item.completedAt || ''
})

const buildPlannerPayload = () => {
  const normalizedTasks = tasks.value.map((item) => ({
    ...item,
    deadlineDateTime: getTaskDeadlineDateTime(item)
  }))

  return {
    isEditMode: isEditMode.value,
    filterMode: filterMode.value,
    hideCompleted: hideCompleted.value,
    tasks: normalizedTasks,
    batchReminderMarkSent: batchReminderMarkSent.value,
    feishuWebhook: feishuWebhook.value || ''
  }
}

const applyPlannerPayload = (payload = {}) => {
  if (Array.isArray(payload.tasks)) {
    tasks.value = payload.tasks.map((item) => normalizeRestoredTask(item))
  }
  isEditMode.value = Boolean(payload.isEditMode)
  filterMode.value = ['today', 'future', 'overdue', 'all'].includes(payload.filterMode) ? payload.filterMode : 'today'
  hideCompleted.value = Boolean(payload.hideCompleted)
  batchReminderMarkSent.value = payload.batchReminderMarkSent || ''
  if (typeof payload.feishuWebhook === 'string') {
    feishuWebhook.value = payload.feishuWebhook
  }
}

const saveDraftLocal = (payload = buildPlannerPayload()) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  localStorage.setItem(WEBHOOK_KEY, payload.feishuWebhook || '')
}

const fetchPlannerFromDb = async () => {
  if (!authStore.isLoggedIn) return null
  const result = await apiService.getMyDailyPlanner()
  return result?.data || null
}

const savePlannerToDb = async (payload = buildPlannerPayload()) => {
  if (!authStore.isLoggedIn) return null
  const result = await apiService.saveMyDailyPlanner(payload)
  return result?.data || null
}

const scheduleRemoteSave = () => {
  if (!authStore.isLoggedIn || !hasHydrated.value) return
  if (remoteSaveTimer) clearTimeout(remoteSaveTimer)
  remoteSaveTimer = setTimeout(() => {
    remoteSaveTimer = null
    void savePlannerToDb(buildPlannerPayload()).catch((error) => {
      console.error('daily planner remote autosave failed:', error)
    })
  }, 700)
}

const saveDraft = () => {
  saveDraftLocal(buildPlannerPayload())
  scheduleRemoteSave()
}

const saveDayPlan = async () => {
  message.value = ''

  if (tasks.value.length === 0) {
    message.value = '请先添加至少一项待办。'
    return
  }

  if (missingDeadlineCount.value > 0) {
    message.value = `请先补全 ${missingDeadlineCount.value} 项截止时间。`
    return
  }

  if (missingEstimateCount.value > 0) {
    message.value = `请先补全 ${missingEstimateCount.value} 项预计时长。`
    return
  }

  if (missingResultCount.value > 0) {
    message.value = `请先补全 ${missingResultCount.value} 项已完成事项的结果反馈。`
    return
  }

  const payload = buildPlannerPayload()
  saveDraftLocal(payload)

  if (!authStore.isLoggedIn) {
    message.value = '已保存安排（本地）。登录后会自动迁移到数据库。'
    return
  }

  try {
    await savePlannerToDb(payload)
    message.value = '已保存安排并同步到数据库。'
  } catch (error) {
    console.error('daily planner save to db failed:', error)
    message.value = '已保存到本地，但数据库同步失败。'
  }
}

const toggleEditMode = () => {
  isEditMode.value = !isEditMode.value
}

const enableBrowserNotification = async () => {
  if (!('Notification' in window)) {
    message.value = '当前浏览器不支持系统通知。'
    return
  }

  const permission = await Notification.requestPermission()
  notificationEnabled.value = permission === 'granted'
  message.value = notificationEnabled.value ? '系统提醒已开启。' : '未获得系统提醒权限。'
}

onMounted(async () => {
  draftDeadlineDate.value = getToday()
  let hasLocalPlanner = false

  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed?.tasks)) {
        hasLocalPlanner = true
        applyPlannerPayload(parsed)
      }
    } catch (error) {
      console.error('daily planner restore failed:', error)
    }
  }

  feishuWebhook.value = localStorage.getItem(WEBHOOK_KEY) || ''

  if (authStore.isLoggedIn) {
    try {
      const dbPlanner = await fetchPlannerFromDb()
      if (dbPlanner && Array.isArray(dbPlanner.tasks)) {
        applyPlannerPayload(dbPlanner)
        saveDraftLocal(buildPlannerPayload())
      } else if (hasLocalPlanner) {
        await savePlannerToDb(buildPlannerPayload())
      }
    } catch (error) {
      console.error('daily planner initial sync failed:', error)
    }
  }

  if ('Notification' in window && Notification.permission === 'granted') {
    notificationEnabled.value = true
  }

  ticker = setInterval(() => {
    lastTick.value = nowTick.value
    nowTick.value = Date.now()
    checkReminder()
  }, 30 * 1000)

  hasHydrated.value = true
})

onUnmounted(() => {
  if (ticker) clearInterval(ticker)
  if (alertTimer) clearTimeout(alertTimer)
  if (focusTimer) clearTimeout(focusTimer)
  if (remoteSaveTimer) clearTimeout(remoteSaveTimer)
})

watch([tasks, isEditMode, feishuWebhook, batchReminderMarkSent, filterMode, hideCompleted], () => {
  if (!hasHydrated.value) return
  saveDraft()
}, { deep: true })

watch(() => authStore.isLoggedIn, async (isLoggedIn, wasLoggedIn) => {
  if (!hasHydrated.value || !isLoggedIn || wasLoggedIn === isLoggedIn) return

  try {
    const dbPlanner = await fetchPlannerFromDb()
    if (dbPlanner && Array.isArray(dbPlanner.tasks)) {
      applyPlannerPayload(dbPlanner)
      saveDraftLocal(buildPlannerPayload())
      return
    }
    await savePlannerToDb(buildPlannerPayload())
  } catch (error) {
    console.error('daily planner login sync failed:', error)
  }
})
</script>

<style scoped>
.planner-page {
  max-width: 920px;
  margin: 0 auto;
  padding: 28px 22px calc(84px + var(--safe-bottom));
}

.planner-header {
  text-align: center;
  margin-bottom: 18px;
}

.planner-kicker {
  color: var(--color-text-tertiary);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.planner-title {
  margin-top: 8px;
  font-size: 36px;
  letter-spacing: -0.03em;
  color: var(--color-text-primary);
}

.planner-subtitle {
  margin-top: 10px;
  color: var(--color-text-secondary);
  font-size: 15px;
}

.planner-date {
  margin-top: 6px;
  color: var(--color-text-tertiary);
  font-size: 13px;
}

.header-actions {
  margin-top: 12px;
  display: flex;
  justify-content: center;
  gap: 10px;
}

.mode-btn,
.notify-btn,
.add-btn,
.save-btn,
.ghost-btn {
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface-elevated);
  color: var(--color-text-primary);
  min-height: 40px;
  padding: 9px 14px;
  font-size: 13px;
  font-weight: 600;
  transition: border-color var(--transition-fast), color var(--transition-fast);
}

.ghost-btn {
  padding: 8px 10px;
  font-weight: 500;
}

.notify-btn:disabled {
  opacity: 0.7;
}

.mode-btn:hover,
.notify-btn:hover:not(:disabled),
.add-btn:hover,
.save-btn:hover:not(:disabled),
.ghost-btn:hover {
  border-color: var(--color-text-tertiary);
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.planner-compose,
.planner-settings,
.planner-board,
.planner-footer,
.planner-summary,
.planner-job,
.reminder-banner {
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-radius: 16px;
  padding: 16px;
}

.planner-compose,
.planner-settings,
.planner-summary,
.planner-job,
.reminder-banner {
  margin-bottom: 14px;
}

.planner-job {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  border-color: #b8cdfc;
  background: #f5f8ff;
}

.job-label {
  font-size: 12px;
  color: #2958b8;
}

.job-title {
  margin-top: 6px;
  font-size: 20px;
  color: #183b84;
}

.job-meta {
  margin-top: 6px;
  color: #36508b;
  font-size: 13px;
}

.job-reason {
  margin-top: 6px;
  color: #274269;
  font-size: 13px;
}

.job-btn {
  border: 1px solid #87a8f7;
  background: white;
  color: #21437f;
  border-radius: 10px;
  padding: 9px 12px;
  font-size: 13px;
  font-weight: 600;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.settings-header.compact {
  margin-bottom: 0;
}

.settings-header h3 {
  font-size: 14px;
  color: var(--color-text-primary);
}

.settings-header span {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.compose-row {
  display: grid;
  gap: 12px;
}

.compose-main {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: center;
}

.compose-meta {
  display: grid;
  grid-template-columns: repeat(4, minmax(120px, 1fr));
  gap: 10px;
  align-items: end;
}

.webhook-row {
  margin-top: 10px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  align-items: center;
}

.webhook-row label {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.task-input,
.task-title-input,
.date-input,
.time-input,
.minute-input,
.result-input,
.webhook-input {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface-elevated);
  color: var(--color-text-primary);
  min-height: 40px;
  padding: 8px 10px;
  font-size: 14px;
}

.task-input:focus,
.task-title-input:focus,
.date-input:focus,
.time-input:focus,
.minute-input:focus,
.result-input:focus,
.webhook-input:focus {
  outline: none;
  border-color: var(--color-accent);
}

.inline-field {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.quick-date-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
}

.quick-btn {
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-secondary);
  padding: 7px 10px;
  font-size: 12px;
}

.quick-btn:hover {
  border-color: var(--color-border);
  color: var(--color-text-primary);
}

.inline-field span {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.minute-wrap {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.minute-wrap small {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.minute-wrap .minute-input {
  width: 88px;
}

.compose-hint {
  margin-top: 10px;
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.planner-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.summary-card {
  border: 1px solid var(--color-border-light);
  border-radius: 12px;
  padding: 10px;
}

.summary-card.warn {
  border-color: #efc78f;
}

.summary-label {
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.summary-value {
  margin-top: 4px;
  color: var(--color-text-primary);
  font-size: 20px;
  font-weight: 650;
}

.summary-value.small {
  font-size: 13px;
  font-weight: 600;
}

.reminder-banner {
  border-color: #9ad7bf;
  background: #f3fbf7;
}

.reminder-banner p {
  color: #21664f;
  font-size: 14px;
}

.board-header {
  display: grid;
  gap: 8px;
  margin-bottom: 12px;
}

.board-header-top {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.board-header h2 {
  font-size: 18px;
  color: var(--color-text-primary);
}

.board-meta {
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.board-tools {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-group {
  display: inline-flex;
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border-light);
  border-radius: 10px;
  padding: 2px;
}

.filter-btn {
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 600;
}

.filter-btn.active {
  background: white;
  color: var(--color-text-primary);
}

.toggle-complete {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  font-size: 12px;
  color: var(--color-text-secondary);
  padding: 6px 8px;
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
}

.empty-state {
  border: 1px dashed var(--color-border);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.task-list {
  display: grid;
  gap: 10px;
}

.task-card {
  border: 1px solid var(--color-border-light);
  border-radius: 12px;
  padding: 12px;
  background: var(--color-surface);
}

.task-card.focus {
  border-color: #87a8f7;
  box-shadow: 0 0 0 3px rgba(135, 168, 247, 0.2);
}

.task-top {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  align-items: center;
}

.task-index {
  color: var(--color-text-tertiary);
  font-size: 12px;
  font-weight: 600;
}

.remove-btn {
  border: 1px solid var(--color-border-light);
  background: transparent;
  color: var(--color-text-tertiary);
  border-radius: 8px;
  padding: 7px 10px;
  font-size: 12px;
}

.task-meta-row {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.time-field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-time-field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-field span,
.date-time-field span,
.time-field small {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.complete-field {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.display-complete {
  min-width: 56px;
}

.task-state {
  font-size: 12px;
  border-radius: 999px;
  padding: 5px 10px;
  border: 1px solid var(--color-border-light);
  color: var(--color-text-secondary);
}

.task-state.normal {
  color: #25765a;
  border-color: #9ad7bf;
}

.task-state.warn {
  color: #a46200;
  border-color: #efc78f;
}

.task-state.danger {
  color: #b34a38;
  border-color: #efb3ab;
}

.task-state.done {
  color: #2563eb;
  border-color: #b8cdfc;
}

.task-state.missing {
  color: var(--color-text-tertiary);
}

.result-label,
.display-label {
  display: block;
  margin-top: 10px;
  margin-bottom: 6px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.result-input {
  width: 100%;
  resize: vertical;
  line-height: 1.6;
}

.display-top {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 12px;
  align-items: flex-start;
}

.display-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.display-meta {
  margin-top: 4px;
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.display-content {
  color: var(--color-text-primary);
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.planner-footer {
  margin-top: 14px;
  display: grid;
  gap: 10px;
}

.review-status {
  color: #0f8a63;
  font-size: 13px;
}

.review-status.warn {
  color: #b76a10;
}

.save-message {
  font-size: 13px;
  color: var(--color-text-secondary);
}

@media (max-width: 768px) {
  .planner-page {
    padding: 18px 16px calc(72px + var(--safe-bottom));
  }

  .planner-title {
    font-size: 30px;
  }

  .header-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .planner-job {
    flex-direction: column;
    align-items: flex-start;
  }

  .compose-main,
  .webhook-row {
    grid-template-columns: 1fr;
  }

  .compose-meta {
    grid-template-columns: 1fr;
  }

  .quick-date-actions {
    justify-content: flex-start;
  }

  .planner-summary {
    grid-template-columns: 1fr;
  }

  .settings-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .task-top,
  .display-top {
    grid-template-columns: 1fr;
  }

  .task-meta-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .board-tools {
    align-items: flex-start;
  }

  .planner-footer {
    position: sticky;
    bottom: calc(8px + var(--safe-bottom));
    z-index: 15;
    background: color-mix(in srgb, var(--color-surface) 92%, transparent);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }

  .save-btn {
    width: 100%;
  }
}
</style>
