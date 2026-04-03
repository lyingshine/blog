<template>
  <div class="planner-page">
    <section class="planner-header">
      <p class="planner-kicker">工具</p>
      <h1 class="planner-title">每日安排</h1>
      <p class="planner-subtitle">只保留一件事：明确下一步并执行。</p>
      <p class="planner-date">{{ nowLabel }}</p>

      <div class="planner-utility" aria-label="提醒工具">
        <button class="utility-btn utility-btn-combined" type="button" @click="showReminderSettings = true" title="提醒与飞书设置">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span>提醒设置</span>
          <span v-if="notificationEnabled" class="notify-dot" aria-hidden="true"></span>
        </button>
      </div>
    </section>

    <section class="planner-job" v-if="nextActionTask">
      <div class="job-main">
        <p class="job-label">当前最该做</p>
        <h3 class="job-title">{{ nextActionTask.title || '未命名事项' }}</h3>
        <p class="job-meta">截止 {{ taskDeadlineText(nextActionTask) }} · 建议开始 {{ recommendedStartText(nextActionTask) }}</p>
        <p class="job-reason">{{ nextActionReason }}</p>
      </div>
      <button class="job-btn" type="button" @click="focusTask(nextActionTask.id)" title="定位这件事" aria-label="定位这件事">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          <circle cx="12" cy="12" r="8" />
        </svg>
      </button>
    </section>

    <section v-if="alertMessage" class="reminder-banner">
      <p>{{ alertMessage }}</p>
    </section>

    <section class="planner-board">
      <header class="board-header">
        <div class="board-header-top">
          <h2>事项清单</h2>
          <div class="board-main-actions">
            <button class="ghost-btn compact" type="button" @click="togglePlannerEdit('', 'add')">
              {{ isEditingAny ? '完成编辑' : '添加事项' }}
            </button>
            <span class="board-meta">显示 {{ displayTasks.length }} / {{ tasks.length }} 项 · 已完成 {{ completedCount }}/{{ tasks.length }}</span>
          </div>
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

      <div v-if="displayTasks.length === 0 && !addingDraft" class="empty-state">
        <p>{{ tasks.length === 0 ? '还没有事项，点击“添加事项”开始规划。' : '当前筛选条件下暂无事项。' }}</p>
      </div>

      <div v-else class="task-list">
        <article v-if="addingDraft" class="task-card task-card-draft">
          <div class="task-top">
            <span class="task-index">新建</span>
            <input
              v-model="newTaskDraft.title"
              type="text"
              class="task-title-input"
              maxlength="120"
              placeholder="事项内容"
            />
            <div class="task-top-actions">
              <button class="ghost-btn compact" type="button" @click="confirmAddDraft">确认添加</button>
              <button class="remove-btn" type="button" @click="cancelAddDraft">取消</button>
            </div>
          </div>

          <div class="task-meta-row">
            <label class="date-time-field">
              <span>截止日期</span>
              <input v-model="newTaskDraft.deadlineDate" type="date" class="date-input" />
            </label>
            <label class="date-time-field">
              <span>截止时间</span>
              <input v-model="newTaskDraft.deadlineTime" type="time" class="time-input" />
            </label>
            <label class="time-field">
              <span>预计时长</span>
              <input v-model.number="newTaskDraft.estimateMinutes" type="number" min="1" max="720" class="minute-input" />
              <small>分钟</small>
            </label>
          </div>
        </article>

        <article
          v-for="(task, index) in displayTasks"
          :key="task.id"
          class="task-card"
          :class="{ focus: focusedTaskId === task.id }"
          :id="`task-${task.id}`"
        >
          <template v-if="isEditingTask(task.id)">
            <div class="task-top">
              <span class="task-index">{{ String(index + 1).padStart(2, '0') }}</span>
              <input
                v-model="task.title"
                type="text"
                class="task-title-input"
                maxlength="120"
                placeholder="事项内容"
              />
              <div class="task-top-actions">
                <button class="ghost-btn compact" type="button" @click="finishTaskEdit(task.id)">完成编辑</button>
                <button class="remove-btn" type="button" @click="removeTask(task.id)">删除</button>
              </div>
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
            <div class="display-actions">
              <button class="ghost-btn" type="button" @click="startTaskEdit(task.id)">编辑</button>
              <button class="ghost-btn" type="button" @click="postponeTask(task, 1)">顺延 1 天</button>
            </div>
            <div class="display-result">
              <p class="display-label">结果反馈</p>
              <p class="display-content">{{ task.result || '尚未填写' }}</p>
            </div>
          </template>
        </article>
      </div>
    </section>

    <p v-if="message" class="save-message inline-message">{{ message }}</p>

    <Transition name="sheet-fade">
      <div v-if="showReminderSettings" class="settings-backdrop" @click="showReminderSettings = false"></div>
    </Transition>
    <Transition name="sheet-up">
      <section v-if="showReminderSettings" class="settings-sheet" aria-label="提醒设置面板">
        <header class="settings-header">
          <div>
            <h3>提醒设置</h3>
            <span>辅助功能，不占主内容区域</span>
          </div>
          <button class="sheet-close-btn" type="button" aria-label="关闭提醒设置" @click="showReminderSettings = false">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </header>
        <p class="settings-note">关闭面板不会关闭提醒；提醒状态以系统权限和当前开关为准。</p>
        <div class="settings-actions">
          <button class="notify-btn" type="button" @click="enableBrowserNotification" :disabled="notificationEnabled">
            {{ notificationEnabled ? '系统提醒已开启' : '开启系统提醒' }}
          </button>
        </div>
        <div class="webhook-row">
          <label for="feishu-webhook">飞书 Webhook</label>
          <input
            id="feishu-webhook"
            v-model.trim="feishuWebhook"
            type="text"
            class="webhook-input"
            placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/..."
          />
          <div class="webhook-actions">
            <button class="ghost-btn" type="button" :disabled="feishuTesting" @click="testFeishuWebhook">
              {{ feishuTesting ? '测试中...' : '测试' }}
            </button>
            <button class="ghost-btn" type="button" @click="saveWebhook">保存</button>
          </div>
        </div>
        <p v-if="settingsFeedback" class="settings-feedback">{{ settingsFeedback }}</p>
      </section>
    </Transition>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import apiService from '../api'
import { useAuthStore } from '../stores/auth'

const STORAGE_KEY = 'daily-planner-current-v4'
const WEBHOOK_KEY = 'daily-planner-feishu-webhook-v1'
const authStore = useAuthStore()

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
const editingTaskId = ref('')
const addingDraft = ref(false)
const feishuTesting = ref(false)
const settingsFeedback = ref('')
const newTaskDraft = ref({
  title: '',
  deadlineDate: '',
  deadlineTime: '',
  estimateMinutes: 60
})
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

const getDefaultDeadlineTime = () => {
  const now = new Date()
  const rounded = new Date(now)
  rounded.setMinutes(Math.ceil(now.getMinutes() / 30) * 30, 0, 0)
  rounded.setHours(rounded.getHours() + 2)
  return `${String(rounded.getHours()).padStart(2, '0')}:${String(rounded.getMinutes()).padStart(2, '0')}`
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
const pendingTodayTasks = computed(() => pendingTasks.value.filter((item) => isTaskToday(item)))
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

const isEditingAny = computed(() => addingDraft.value || !!editingTaskId.value)

const composeDeadlineDateTime = (date, time) => {
  if (!date || !time) return ''
  return `${date}T${time}`
}

const resetNewTaskDraft = () => {
  newTaskDraft.value = {
    title: '',
    deadlineDate: getToday(),
    deadlineTime: getDefaultDeadlineTime(),
    estimateMinutes: 60
  }
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

const isEditingTask = (taskId) => editingTaskId.value === taskId

const startTaskEdit = (taskId) => {
  if (!taskId) return
  isEditMode.value = true
  addingDraft.value = false
  editingTaskId.value = taskId
  focusTask(taskId)
  setTimeout(() => {
    document.querySelector(`#task-${taskId} .task-title-input`)?.focus()
  }, 0)
}

const finishTaskEdit = (taskId) => {
  if (taskId && editingTaskId.value !== taskId) return
  editingTaskId.value = ''
  if (!addingDraft.value) {
    isEditMode.value = false
  }
}

const startAddDraft = () => {
  isEditMode.value = true
  editingTaskId.value = ''
  addingDraft.value = true
  resetNewTaskDraft()
  setTimeout(() => {
    document.querySelector('.task-card-draft .task-title-input')?.focus()
  }, 0)
}

const cancelAddDraft = () => {
  addingDraft.value = false
  if (!editingTaskId.value) isEditMode.value = false
}

const confirmAddDraft = () => {
  const title = (newTaskDraft.value.title || '').trim()
  if (!title) {
    message.value = '先输入事项标题再确认添加。'
    return
  }
  const deadlineDate = newTaskDraft.value.deadlineDate || getToday()
  const deadlineTime = newTaskDraft.value.deadlineTime || getDefaultDeadlineTime()
  const deadlineDateTime = composeDeadlineDateTime(deadlineDate, deadlineTime)
  const estimate = Number(newTaskDraft.value.estimateMinutes) || 60
  const task = createTask(title, deadlineDateTime, estimate)
  tasks.value = [task, ...tasks.value]
  addingDraft.value = false
  editingTaskId.value = task.id
  focusTask(task.id)
  setTimeout(() => {
    document.querySelector(`#task-${task.id} .task-title-input`)?.focus()
  }, 0)
  message.value = '事项已添加。'
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

const postponeTask = (task, days = 1) => {
  const dueMs = getDueTimeMs(task)
  const base = dueMs === null ? new Date() : new Date(dueMs)
  base.setDate(base.getDate() + days)
  task.deadlineDate = toYmd(base)
  task.deadlineTime = `${String(base.getHours()).padStart(2, '0')}:${String(base.getMinutes()).padStart(2, '0')}`
  task.deadlineDateTime = composeDeadlineDateTime(task.deadlineDate, task.deadlineTime)
  message.value = `已顺延 ${days} 天：${task.title || '未命名事项'}`
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
  if (pendingTodayTasks.value.length === 0) return '今日暂无待办事项'
  return pendingTodayTasks.value
    .map((task, index) => `${index + 1}. ${task.title || '未命名事项'}（截止 ${taskDeadlineText(task)}，预计 ${task.estimateMinutes || 0} 分钟）`)
    .join('\n')
}

const getTodayReminderCandidates = () => {
  return pendingTodayTasks.value
    .map((task) => ({ task, reminderMs: getReminderTimeMs(task) }))
    .filter((x) => x.reminderMs !== null)
    .sort((a, b) => a.reminderMs - b.reminderMs)
}

const getBatchReminderMs = () => {
  const candidates = getTodayReminderCandidates()
  if (candidates.length === 0) return null
  return candidates[0].reminderMs
}

const getBatchReminderMark = () => {
  const reminderMs = getBatchReminderMs()
  if (reminderMs === null) return ''
  const fingerprint = pendingTodayTasks.value
    .map((task) => `${task.id}:${getTaskDeadlineDateTime(task)}:${task.estimateMinutes || 0}`)
    .join('|')
  return `${reminderMs}|${fingerprint}`
}

const sendTaskReminder = () => {
  const reminderTask = getTodayReminderCandidates()[0]?.task || null
  const dayLoad = reminderTask ? getPendingEstimateMinutesForTaskDay(reminderTask) : 0
  const text = `提醒：现在应开始处理今日待办（共 ${pendingTodayTasks.value.length} 项，今日工时 ${dayLoad} 分钟）。\n${formatPendingTasksForMessage()}`
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

  const reminderTask = getTodayReminderCandidates()[0]?.task || null
  try {
    await apiService.sendFeishuPlannerReminder({
      title: '每日安排提醒',
      content: formatPendingTasksForMessage(),
      deadline: reminderTask ? taskDeadlineText(reminderTask) : '',
      estimateMinutes: reminderTask ? getPendingEstimateMinutesForTaskDay(reminderTask) : 0,
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
  isEditMode.value = false
  editingTaskId.value = ''
  addingDraft.value = false
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

const togglePlannerEdit = (taskId = '', kind = 'add') => {
  if (kind === 'add') {
    if (isEditingAny.value) {
      isEditMode.value = false
      editingTaskId.value = ''
      addingDraft.value = false
      return
    }
    startAddDraft()
    return
  }
  startTaskEdit(taskId)
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

const saveWebhook = () => {
  feishuWebhook.value = (feishuWebhook.value || '').trim()
  saveDraft()
  const text = feishuWebhook.value ? '飞书 Webhook 已保存。' : 'Webhook 为空，已保存。'
  message.value = text
  settingsFeedback.value = text
  setTimeout(() => {
    settingsFeedback.value = ''
  }, 2200)
}

const testFeishuWebhook = async () => {
  const current = (feishuWebhook.value || '').trim()
  const saved = (localStorage.getItem(WEBHOOK_KEY) || '').trim()
  const webhook = current || saved
  if (!webhook) {
    message.value = '尚未配置飞书 Webhook，请先填写后测试。'
    return
  }

  feishuTesting.value = true
  try {
    await apiService.sendFeishuPlannerReminder({
      title: '飞书 Webhook 测试',
      content: '这是一条测试消息，用于验证当前 Webhook 可用。',
      deadline: new Date().toLocaleString('zh-CN', { hour12: false }),
      estimateMinutes: 0,
      webhook
    })
    message.value = '测试消息已发送，请到飞书群查看。'
  } catch (error) {
    console.error('feishu webhook test failed:', error)
    message.value = error.message || '测试发送失败，请检查 Webhook 是否正确。'
  } finally {
    feishuTesting.value = false
  }
}

onMounted(async () => {
  resetNewTaskDraft()
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
  position: relative;
  text-align: center;
  margin-bottom: 18px;
  padding-right: 0;
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

.planner-utility {
  position: fixed;
  top: calc(56px + var(--safe-top));
  right: max(10px, var(--safe-right));
  z-index: 1185;
  display: inline-flex;
}

.utility-btn {
  min-height: 34px;
  border: 1px solid var(--color-border-light);
  border-radius: 10px;
  background: var(--color-surface-elevated);
  color: var(--color-text-tertiary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 10px;
}

.utility-btn-combined {
  min-height: 36px;
  border-color: color-mix(in srgb, var(--color-border) 78%, var(--color-border-light));
  color: var(--color-text-secondary);
}

.utility-btn-combined span {
  font-size: 12px;
  font-weight: 600;
}

.notify-dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #22c55e;
}

.utility-btn:disabled {
  opacity: 0.55;
}

.mode-btn,
.notify-btn,
.add-btn,
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

.mode-btn.primary {
  border-color: color-mix(in srgb, var(--color-accent) 30%, var(--color-border));
  color: var(--color-accent);
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
.ghost-btn:hover {
  border-color: var(--color-text-tertiary);
}

.planner-compose,
.planner-settings,
.planner-board,
.planner-footer,
.planner-job,
.reminder-banner {
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-radius: 16px;
  padding: 16px;
}

.planner-compose,
.planner-settings,
.planner-job,
.reminder-banner {
  margin-bottom: 14px;
}

.planner-job {
  position: relative;
  border-color: var(--color-border-light);
  background: color-mix(in srgb, var(--color-surface) 92%, var(--color-surface-elevated));
}

.job-main {
  padding-right: 34px;
}

.job-label {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.job-title {
  margin-top: 6px;
  font-size: 17px;
  color: var(--color-text-primary);
  font-weight: 600;
}

.job-meta {
  margin-top: 6px;
  color: var(--color-text-secondary);
  font-size: 12px;
}

.job-reason {
  margin-top: 6px;
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.job-btn {
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: 999px;
  width: 34px;
  height: 34px;
  padding: 0;
  position: absolute;
  top: 10px;
  right: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.job-btn:hover {
  color: var(--color-text-primary);
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

.webhook-actions {
  display: inline-flex;
  gap: 8px;
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

.board-main-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.ghost-btn.compact {
  min-height: 32px;
  padding: 6px 10px;
  font-size: 12px;
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

.task-card-draft {
  border-style: dashed;
  border-color: color-mix(in srgb, var(--color-accent) 28%, var(--color-border-light));
  background: color-mix(in srgb, var(--color-accent-subtle) 36%, var(--color-surface));
}

.task-top {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  align-items: center;
}

.task-top-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
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

.display-actions {
  margin-top: 10px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.display-actions .ghost-btn {
  min-height: 34px;
  padding: 6px 10px;
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

.save-message {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.settings-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.24);
  z-index: 1190;
}

.settings-sheet {
  position: fixed;
  top: calc(54px + var(--safe-top));
  right: max(10px, var(--safe-right));
  bottom: calc(10px + var(--safe-bottom));
  width: min(380px, calc(100vw - max(20px, var(--safe-left) + var(--safe-right) + 20px)));
  z-index: 1191;
  background: color-mix(in srgb, var(--color-surface) 96%, transparent);
  border: 1px solid var(--color-border-light);
  border-radius: 16px;
  box-shadow: 0 14px 34px rgba(12, 18, 35, 0.24);
  padding: 14px;
  display: grid;
  gap: 10px;
  overflow: auto;
  position: fixed;
}

.settings-actions {
  display: flex;
  justify-content: flex-start;
}

.settings-note {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.sheet-close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 0;
  background: transparent;
  color: var(--color-text-tertiary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.sheet-close-btn:hover {
  color: var(--color-text-primary);
}

.settings-feedback {
  font-size: 12px;
  color: #0f8a63;
}

.sheet-fade-enter-active,
.sheet-fade-leave-active,
.sheet-up-enter-active,
.sheet-up-leave-active {
  transition: all var(--motion-base) var(--motion-spring);
}

.sheet-fade-enter-from,
.sheet-fade-leave-to {
  opacity: 0;
}

.sheet-up-enter-from,
.sheet-up-leave-to {
  opacity: 0;
  transform: translateX(16px);
}

@media (max-width: 768px) {
  .planner-page {
    padding: 18px 16px calc(72px + var(--safe-bottom));
  }

  .planner-title {
    font-size: 30px;
  }

  .utility-btn-combined span {
    font-size: 11px;
  }

  .planner-header {
    padding-right: 0;
  }

  .planner-job {
    padding-right: 14px;
  }

  .settings-backdrop {
    background: rgba(0, 0, 0, 0.32);
  }

  .settings-sheet {
    left: max(10px, var(--safe-left));
    right: max(10px, var(--safe-right));
    top: calc(52px + var(--safe-top));
    bottom: auto;
    width: auto;
    max-height: min(58vh, 420px);
    overflow-y: auto;
    border-radius: 14px;
    padding: 12px;
  }

  .settings-sheet .settings-header {
    margin-bottom: 6px;
  }

  .settings-sheet .notify-btn,
  .settings-sheet .ghost-btn {
    width: 100%;
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

}
</style>
