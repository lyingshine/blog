<template>
  <div class="admin-page">
    <Transition name="admin-notice-fade">
      <p v-if="adminNotice" class="admin-notice">{{ adminNotice }}</p>
    </Transition>

    <header class="admin-hero ux-card">
      <div class="hero-copy">
        <p class="hero-kicker">绔欑偣鍚庡彴</p>
        <h1 class="hero-title">管理控制台</h1>
        <p class="hero-subtitle">
          瀹炴椂鏌ョ湅鍗氬杩愯鐘舵€併€佽闂椿璺冨害涓庣郴缁熷閲忥紝璁╁悗鍙颁篃淇濇寔鍜屽墠鍙颁竴鑷寸殑缁嗚吇浣撻獙銆?        </p>
        <div class="hero-actions">
          <span class="hero-pill" :class="healthClass">{{ healthText }}</span>
          <span class="hero-pill hero-pill-neutral">褰撳墠鍘嬫祴 {{ displayPreset.label }}</span>
        </div>
      </div>

      <div class="hero-aside">
        <div class="hero-orb hero-orb-large"></div>
        <div class="hero-orb hero-orb-small"></div>
        <div class="hero-status-card">
          <span class="status-label">褰撳墠鍦ㄧ嚎</span>
          <strong class="status-value">{{ num(activity.currentOnline) }}</strong>
          <span class="status-meta">宄板€肩洰鏍?{{ num(displayPreset.peakOnlineTarget) }}</span>
        </div>
      </div>
    </header>

    <div class="tab-bar ux-tab-shell" role="tablist" aria-label="后台标签页">
      <button class="tab-button ux-tab" :class="{ active: activeTab === 'overview' }" @click="activeTab = 'overview'">
        鎬昏
      </button>
      <button class="tab-button ux-tab" :class="{ active: activeTab === 'sessions' }" @click="activeTab = 'sessions'">
        浼氳瘽
      </button>
    </div>

    <section class="profile-card ux-card">
      <div class="profile-grid">
        <div>
          <p class="section-kicker">鍘嬫祴绯荤粺</p>
          <h2 class="profile-title">{{ displayPreset.label }}</h2>
          <p class="profile-meta">{{ displayPreset.description }}</p>
        </div>
        <div class="profile-stats">
          <span>鐢ㄦ埛姹?{{ num(displayPreset.maxRegisteredUsers) }}</span>
          <span>鍦ㄧ嚎鐩爣 {{ num(displayPreset.peakOnlineTarget) }}</span>
          <span>浼扮畻宄板€艰姹?{{ num(displayPreset.targetPeakRpm) }}/鍒嗛挓</span>
        </div>
      </div>
      <p class="profile-note">压测参数已改为固定档位选择。先选择档位，再点击“应用档位”生效，避免误触切换。</p>
      <div class="simulator-controls">
        <div class="simulator-state">
          <span class="state-label">模拟器状态</span>
          <strong class="state-value" :class="simulatorStateClass">{{ simulatorStateText }}</strong>
        </div>
        <div class="simulator-buttons">
          <button class="ghost-button chip-button" :disabled="simulatorActionLoading || !canStartSimulator" @click="controlSimulator('start')">
            {{ simulatorActionLoading === 'start' ? '启动中...' : '启动' }}
          </button>
          <button class="ghost-button chip-button" :disabled="simulatorActionLoading || !canPauseSimulator" @click="controlSimulator('pause')">
            {{ simulatorActionLoading === 'pause' ? '鏆傚仠涓?..' : '鏆傚仠' }}
          </button>
          <button class="apply-button chip-button" :disabled="simulatorActionLoading || !canStopSimulator" @click="controlSimulator('stop')">
            {{ simulatorActionLoading === 'stop' ? '鍋滄涓?..' : '鍋滄' }}
          </button>
        </div>
      </div>
      <div v-if="authStore.isAdmin && presets.length" class="profile-switcher">
        <button
          v-for="preset in presets"
          :key="preset.id"
          class="profile-button chip-button"
          :class="{ active: stagedPresetId === preset.id }"
          :disabled="savingConfig"
          @click="stagedPresetId = preset.id"
        >
          {{ preset.label }}
        </button>
      </div>
      <div v-if="authStore.isAdmin && presets.length" class="preset-actions">
        <p class="preset-state" v-if="hasPendingPresetChange">
          已选择「{{ pendingPresetLabel }}」，点击右侧按钮后生效。
        </p>
        <p class="preset-state" v-else>
          当前生效档位：{{ runningPresetLabel }}
        </p>
        <div class="preset-action-buttons">
          <button class="ghost-button chip-button" :disabled="savingConfig || !hasPendingPresetChange" @click="stagedPresetId = selectedPresetId">
            鍙栨秷閫夋嫨
          </button>
          <button class="apply-button chip-button" :disabled="savingConfig || !hasPendingPresetChange" @click="applyPreset(stagedPresetId)">
            {{ savingConfig ? "搴旂敤涓?.." : "搴旂敤妗ｄ綅" }}
          </button>
        </div>
      </div>
      <div v-if="authStore.isAdmin && presets.length" class="preset-grid">
        <article
          v-for="preset in presets"
          :key="`${preset.id}-card`"
          class="preset-card ux-card"
          :class="{ active: stagedPresetId === preset.id }"
        >
          <div class="preset-card-head">
            <strong>
              {{ preset.label }}
              <em v-if="selectedPresetId === preset.id" class="preset-badge">生效中</em>
            </strong>
            <span>{{ num(preset.targetPeakRpm) }}/鍒嗛挓</span>
          </div>
          <p>{{ preset.description }}</p>
          <div class="preset-card-meta">
            <span>鐢ㄦ埛姹?{{ num(preset.maxRegisteredUsers) }}</span>
            <span>鍦ㄧ嚎 {{ num(preset.peakOnlineTarget) }}</span>
          </div>
        </article>
      </div>
    </section>

    <section v-if="!authStore.isAdmin" class="login-card ux-card">
      <div class="section-heading">
        <p class="section-kicker">璁块棶鍙楅檺</p>
        <h2>闇€瑕佺鐞嗗憳鏉冮檺</h2>
        <p>只有角色为 `admin` 的用户可以进入后台。当前请使用用户名为 `lyingshine` 的账号登录。</p>
      </div>
    </section>

    <template v-else-if="activeTab === 'overview'">
      <section class="metrics-grid">
        <article class="metric-card feature-card">
          <p class="metric-label">姣忓垎閽熻姹傛暟</p>
          <p class="metric-value">{{ num(metrics.app?.requestPerMinute) }}</p>
          <p class="metric-meta">鏈€杩?1 鍒嗛挓婊氬姩娴侀噺</p>
        </article>
        <article class="metric-card ux-card">
          <p class="metric-label">P95 寤惰繜</p>
          <p class="metric-value">{{ formatMs(metrics.app?.p95LatencyMs) }}</p>
          <p class="metric-meta">P99 {{ formatMs(metrics.app?.p99LatencyMs) }}</p>
        </article>
        <article class="metric-card ux-card">
          <p class="metric-label">错误率</p>
          <p class="metric-value">{{ formatPct(metrics.app?.errorRate) }}</p>
          <p class="metric-meta">鏈€杩?1 鍒嗛挓 5xx 鍗犳瘮</p>
        </article>
        <article class="metric-card ux-card">
          <p class="metric-label">鍦ㄧ嚎鐢ㄦ埛</p>
          <p class="metric-value">{{ num(activity.currentOnline) }}</p>
          <p class="metric-meta">宄板€煎湪绾跨洰鏍?{{ num(displayPreset.peakOnlineTarget) }}</p>
        </article>
        <article class="metric-card ux-card">
          <p class="metric-label">峰值请求目标</p>
          <p class="metric-value">{{ num(displayPreset.targetPeakRpm) }}</p>
          <p class="metric-meta">姣忓垎閽熻姹傛暟鍩虹嚎</p>
        </article>
        <article class="metric-card ux-card">
          <p class="metric-label">闃熷垪鍗犵敤</p>
          <p class="metric-value">{{ formatPct(queueUsage) }}</p>
          <p class="metric-meta">{{ num(metrics.simulator?.queue?.active) }} / {{ num(metrics.simulator?.queue?.limit) }}</p>
        </article>
        <article class="metric-card ux-card">
          <p class="metric-label">鏁版嵁搴撹繛鎺ユ睜</p>
          <p class="metric-value">{{ formatPct(dbUsage) }}</p>
          <p class="metric-meta">{{ num(metrics.database.appTotal) }} / {{ num(totalDbLimit) }}</p>
        </article>
        <article class="metric-card valve-card" :class="valveStateClass">
          <p class="metric-label">流量阀门</p>
          <p class="metric-value">{{ valveStateText }}</p>
          <p class="metric-meta">
            闃€闂?{{ formatPct(metrics.simulator?.valve?.intake || 0) }} 路
            P95 {{ formatMs(metrics.simulator?.valve?.p95LatencyMs || 0) }} 路
            閿欒鐜?{{ formatPct(metrics.simulator?.valve?.errorRate || 0) }}
          </p>
        </article>
      </section>

      <section class="panel-grid">
        <article class="panel-card wide-panel">
          <header class="panel-header">
            <div>
              <p class="section-kicker">绯荤粺璧勬簮</p>
              <h3>杩愯瀹归噺</h3>
            </div>
            <span>{{ metrics.platform }} {{ metrics.arch }}</span>
          </header>

          <div class="meter-list">
            <div class="meter-item">
              <div class="meter-head">
                <span>CPU 使用率</span>
                <strong>{{ formatPct(metrics.cpu.usage) }}</strong>
              </div>
              <div class="meter"><div class="fill cpu" :style="{ width: `${toPercent(metrics.cpu.usage)}%` }" /></div>
            </div>
            <div class="meter-item">
              <div class="meter-head">
                <span>内存使用率</span>
                <strong>{{ formatPct(metrics.memory.usage) }}</strong>
              </div>
              <div class="meter"><div class="fill mem" :style="{ width: `${toPercent(metrics.memory.usage)}%` }" /></div>
            </div>
            <div class="meter-item">
              <div class="meter-head">
                <span>鍦ㄧ嚎瀹归噺</span>
                <strong>{{ formatPct(onlineUsage) }}</strong>
              </div>
              <div class="meter"><div class="fill online" :style="{ width: `${toPercent(onlineUsage)}%` }" /></div>
            </div>
          </div>

          <p class="footnote">Node {{ metrics.nodeVersion }} 路 PID {{ metrics.pid }} 路 Worker {{ metrics.cluster.workers }}</p>
        </article>

        <article class="panel-card ux-card">
          <header class="panel-header">
            <div>
              <p class="section-kicker">鎬ц兘鐑偣</p>
              <h3>慢接口</h3>
            </div>
            <span>寤惰繜鏈€楂樼殑璺敱</span>
          </header>
          <div class="route-list" v-if="metrics.app?.slowRoutes?.length">
            <div class="route-item" v-for="r in metrics.app.slowRoutes" :key="r.route">
              <div>
                <p class="route-name">{{ r.route }}</p>
                <p class="route-meta">璇锋眰 {{ num(r.count) }} 路 閿欒 {{ formatPct(r.errorRate) }}</p>
              </div>
              <strong>{{ formatMs(r.avgDurationMs) }}</strong>
            </div>
          </div>
          <p v-else class="empty-state">当前时间窗口内暂无慢接口。</p>
        </article>

        <article class="panel-card ux-card">
          <header class="panel-header">
            <div>
              <p class="section-kicker">娴侀噺鍒嗗竷</p>
              <h3>楂橀璺敱</h3>
            </div>
            <span>请求量排名</span>
          </header>
          <div class="route-list" v-if="metrics.app?.topRoutes?.length">
            <div class="route-item" v-for="r in metrics.app.topRoutes" :key="r.route">
              <div>
                <p class="route-name">{{ r.route }}</p>
                <p class="route-meta">骞冲潎 {{ formatMs(r.avgDurationMs) }} 路 宄板€?{{ formatMs(r.maxDurationMs) }}</p>
              </div>
              <strong>{{ num(r.count) }}</strong>
            </div>
          </div>
          <p v-else class="empty-state">暂时还没有路由统计数据。</p>
        </article>

        <article class="panel-card ux-card">
          <header class="panel-header">
            <div>
              <p class="section-kicker">数据层</p>
              <h3>存储状态</h3>
            </div>
            <span>鏁版嵁搴撲笌缂撳瓨</span>
          </header>
          <div class="kv-list">
            <div class="kv">
              <span>MySQL 线程数</span>
              <strong>{{ num(metrics.database.mysqlTotal) }}</strong>
            </div>
            <div class="kv">
              <span>应用连接池</span>
              <strong>{{ num(metrics.database.appTotal) }} / {{ num(totalDbLimit) }}</strong>
            </div>
            <div class="kv">
              <span>缂撳瓨鏉＄洰</span>
              <strong>{{ num(metrics.cache.size) }}</strong>
            </div>
            <div class="kv">
              <span>缓存命中率</span>
              <strong>{{ formatPct(metrics.cache.hitRate) }}</strong>
            </div>
            <div class="kv">
              <span>Redis 状态</span>
              <strong>{{ metrics.cache.redis || '鏈煡' }}</strong>
            </div>
          </div>
          <div class="mini-stats">
            <span>鏂囩珷 {{ num(metrics.database.articles) }}</span>
            <span>鍔ㄦ€?{{ num(metrics.database.statuses) }}</span>
            <span>鐢ㄦ埛 {{ num(metrics.database.users) }}</span>
            <span>鍛戒腑 {{ num(metrics.cache.hits) }} / 鏈懡涓?{{ num(metrics.cache.misses) }}</span>
          </div>
        </article>

        <article class="panel-card wide-panel logs-panel">
          <header class="panel-header">
            <div>
              <p class="section-kicker">鍚庣杈撳嚭</p>
              <h3>服务器日志</h3>
            </div>
            <div class="log-actions">
              <div class="log-switch">
                <button type="button" class="log-switch-btn chip-button" :class="{ active: logView === 'both' }" @click="logView = 'both'">鍏ㄩ儴</button>
                <button type="button" class="log-switch-btn chip-button" :class="{ active: logView === 'out' }" @click="logView = 'out'">stdout</button>
                <button type="button" class="log-switch-btn chip-button" :class="{ active: logView === 'err' }" @click="logView = 'err'">stderr</button>
              </div>
              <button class="ghost-button chip-button" :disabled="logsLoading" @click="refreshServerLogs">
                {{ logsLoading ? "鍒锋柊涓?.." : "鍒锋柊鏃ュ織" }}
              </button>
            </div>
          </header>
          <p class="log-meta">鏈€杩?{{ num(serverLogs.lines) }} 琛?路 鏇存柊鏃堕棿 {{ logUpdatedAt }}</p>
          <div class="log-shell" v-if="renderedLogText">
            <pre class="log-content">{{ renderedLogText }}</pre>
          </div>
          <p v-else class="empty-state">暂无日志输出，或日志文件尚未生成。</p>
        </article>
      </section>
    </template>

    <template v-else>
      <section class="metrics-grid">
        <article class="metric-card feature-card">
          <p class="metric-label">褰撳墠鍦ㄧ嚎浜烘暟</p>
          <p class="metric-value">{{ num(activity.currentOnline) }}</p>
          <p class="metric-meta">瀹炴椂骞跺彂浼氳瘽</p>
        </article>
        <article class="metric-card ux-card">
          <p class="metric-label">骞冲潎鍋滅暀鏃堕暱</p>
          <p class="metric-value">{{ formatDuration(activity.avgDuration) }}</p>
          <p class="metric-meta">浠呯粺璁″凡瀹屾垚浼氳瘽</p>
        </article>
        <article class="metric-card ux-card">
          <p class="metric-label">完成会话数</p>
          <p class="metric-value">{{ num(activity.totalSessions) }}</p>
          <p class="metric-meta">婊氬姩鍘嗗彶绐楀彛</p>
        </article>
        <article class="metric-card ux-card">
          <p class="metric-label">妯℃嫙鍣ㄩ敊璇巼</p>
          <p class="metric-value">{{ formatPct(metrics.simulator?.errorRate) }}</p>
          <p class="metric-meta">客户端请求失败占比</p>
        </article>
      </section>

      <section class="panel-grid sessions-grid">
        <article class="panel-card ux-card">
          <header class="panel-header">
            <div>
              <p class="section-kicker">鐢ㄦ埛缁撴瀯</p>
              <h3>璁块棶鏋勬垚</h3>
            </div>
            <span>瀹炴椂缁勬垚</span>
          </header>
          <div class="mix-list">
            <div class="mix-item" v-for="item in audienceMix" :key="item.key">
              <div class="meter-head">
                <span>{{ item.label }}</span>
                <strong>{{ num(item.count) }}（{{ formatPct(item.ratio) }}）</strong>
              </div>
              <div class="meter">
                <div class="fill online" :style="{ width: `${toPercent(item.ratio)}%` }" />
              </div>
            </div>
          </div>
        </article>

        <article class="panel-card ux-card">
          <header class="panel-header">
            <div>
              <p class="section-kicker">最近会话</p>
              <h3>最新完成记录</h3>
            </div>
            <span>鍊掑簭灞曠ず</span>
          </header>
          <div class="route-list" v-if="activity.recentSessions?.length">
            <div class="route-item" v-for="(s, i) in recentSessions" :key="i">
              <div>
                <p class="route-name">{{ typeLabel(s.type) }}</p>
                <p class="route-meta">鍋滅暀 {{ formatDuration(s.duration) }}</p>
              </div>
              <strong>{{ num(s.actions) }} 次操作</strong>
            </div>
          </div>
          <p v-else class="empty-state">还没有已完成的会话记录。</p>
        </article>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useAuthStore } from "../stores/auth";
import apiService from "../api";

const authStore = useAuthStore();
const activeTab = ref("overview");
const presets = ref([]);
const selectedPresetId = ref("");
const stagedPresetId = ref("");
const savingConfig = ref(false);
const simulatorActionLoading = ref("");
const logView = ref("both");
const logsLoading = ref(false);
const LOG_LINE_COUNT = 120;
const adminNotice = ref("");
let adminNoticeTimer = null;

function setAdminNotice(message) {
  adminNotice.value = message;
  if (adminNoticeTimer) clearTimeout(adminNoticeTimer);
  adminNoticeTimer = setTimeout(() => {
    adminNotice.value = "";
  }, 2200);
}

const serverLogs = ref({
  type: "both",
  lines: LOG_LINE_COUNT,
  timestamp: 0,
  sources: {
    out: { lines: [], size: 0, mtimeMs: 0, exists: false },
    err: { lines: [], size: 0, mtimeMs: 0, exists: false }
  }
});

const metrics = ref({
  cpu: { usage: 0, cores: 0, model: "", history: [] },
  memory: { total: 0, used: 0, usage: 0, history: [] },
  network: { rx: 0, tx: 0, history: [] },
  database: { mysqlTotal: 0, readPoolUsed: 0, readPoolLimit: 150, writePoolUsed: 0, writePoolLimit: 50, appTotal: 0, articles: 0, statuses: 0, users: 0 },
  cache: { size: 0, redis: "unknown", hits: 0, misses: 0, hitRate: 0 },
  cluster: { workers: 1 },
  app: { requestPerMinute: 0, errorRate: 0, p95LatencyMs: 0, p99LatencyMs: 0, topRoutes: [], slowRoutes: [] },
  simulator: {
    state: "stopped",
    running: false,
    paused: false,
    scale: "unknown",
    presetId: "",
    description: "",
    peakOnlineTarget: 0,
    maxRegisteredUsers: 0,
    targetPeakRpm: 0,
    controls: {
      baseRegistrationRate: 0,
      baseLoginRate: 0,
      concurrentRequests: 0,
      actionMultiplier: 0,
      actionIntervalMultiplier: 1,
      sessionDurationMultiplier: 0,
      cooldownMultiplier: 0,
      visitorRatio: 0,
      writeMultiplier: 1
    },
    queue: { active: 0, limit: 0 },
    valve: { intake: 1, p95LatencyMs: 0, errorRate: 0, queueUsage: 0, target: 1 },
    errorRate: 0
  },
  uptime: 0,
  platform: "",
  arch: "",
  nodeVersion: "",
  pid: 0
});

const activity = ref({
  currentOnline: 0,
  currentTypes: {},
  avgDuration: 0,
  totalSessions: 0,
  recentSessions: []
});

let intervalId = null;

const totalDbLimit = computed(() => (metrics.value.database.readPoolLimit || 0) + (metrics.value.database.writePoolLimit || 0));
const dbUsage = computed(() => (totalDbLimit.value > 0 ? metrics.value.database.appTotal / totalDbLimit.value : 0));
const onlineUsage = computed(() => {
  const target = metrics.value.simulator?.peakOnlineTarget || 0;
  return target > 0 ? activity.value.currentOnline / target : 0;
});
const queueUsage = computed(() => {
  const q = metrics.value.simulator?.queue;
  return q?.limit ? q.active / q.limit : 0;
});

const valveStateText = computed(() => {
  const intake = Number(metrics.value.simulator?.valve?.intake || 0);
  if (intake >= 1.15) return "可加压";
  if (intake >= 0.85) return "绋冲畾鏀鹃噺";
  if (intake >= 0.5) return "开始收紧";
  return "寮哄姏闄愭祦";
});

const valveStateClass = computed(() => {
  const intake = Number(metrics.value.simulator?.valve?.intake || 0);
  if (intake >= 1.15) return "open";
  if (intake >= 0.85) return "steady";
  if (intake >= 0.5) return "tight";
  return "closed";
});

const displayPreset = computed(() => {
  const fromMetrics = metrics.value.simulator || {};
  const fallback = presets.value.find((preset) => preset.id === selectedPresetId.value) || presets.value.find((preset) => preset.id === "medium");
  return {
    label: fromMetrics.scale || fallback?.label || "涓帇",
    description: fromMetrics.description || fallback?.description || "默认压测档，读流量和写流量比较均衡。",
    maxRegisteredUsers: fromMetrics.maxRegisteredUsers || fallback?.maxRegisteredUsers || 0,
    peakOnlineTarget: fromMetrics.peakOnlineTarget || fallback?.peakOnlineTarget || 0,
    targetPeakRpm: fromMetrics.targetPeakRpm || fallback?.targetPeakRpm || 0
  };
});

const hasPendingPresetChange = computed(() => !!stagedPresetId.value && stagedPresetId.value !== selectedPresetId.value);
const pendingPresetLabel = computed(() => presets.value.find((preset) => preset.id === stagedPresetId.value)?.label || stagedPresetId.value || "");
const runningPresetLabel = computed(() => presets.value.find((preset) => preset.id === selectedPresetId.value)?.label || selectedPresetId.value || "未设置");
const simulatorState = computed(() => metrics.value.simulator?.state || "stopped");
const simulatorStateText = computed(() => {
  if (simulatorState.value === "running") return "运行中";
  if (simulatorState.value === "paused") return "已暂停";
  return "已停止";
});
const simulatorStateClass = computed(() => {
  if (simulatorState.value === "running") return "running";
  if (simulatorState.value === "paused") return "paused";
  return "stopped";
});
const canStartSimulator = computed(() => simulatorState.value !== "running");
const canPauseSimulator = computed(() => simulatorState.value === "running");
const canStopSimulator = computed(() => simulatorState.value !== "stopped");

function syncStagedPreset() {
  if (!stagedPresetId.value || stagedPresetId.value === selectedPresetId.value) {
    stagedPresetId.value = selectedPresetId.value;
  }
}

const healthText = computed(() => {
  const err = metrics.value.app?.errorRate || 0;
  const p95 = metrics.value.app?.p95LatencyMs || 0;
  if (err > 0.03 || p95 > 600) return "需要关注";
  if (err > 0.01 || p95 > 300) return "娉ㄦ剰娉㈠姩";
  return "杩愯绋冲畾";
});

const healthClass = computed(() => {
  const text = healthText.value;
  if (text === "需要关注") return "danger";
  if (text === "娉ㄦ剰娉㈠姩") return "warn";
  return "ok";
});

const audienceMix = computed(() => {
  const total = Math.max(1, activity.value.currentOnline || 0);
  const map = activity.value.currentTypes || {};
  const rows = [
    { key: "ACTIVE_VETERAN", label: "活跃老用户", count: map.ACTIVE_VETERAN || 0 },
    { key: "SILENT_VETERAN", label: "沉默老用户", count: map.SILENT_VETERAN || 0 },
    { key: "NEW_USER", label: "新用户", count: map.NEW_USER || 0 },
    { key: "VISITOR", label: "璁垮", count: map.VISITOR || 0 }
  ];
  return rows.map((r) => ({ ...r, ratio: r.count / total }));
});

const recentSessions = computed(() => (activity.value.recentSessions || []).slice().reverse().slice(0, 12));
const renderedLogText = computed(() => {
  const outLines = serverLogs.value.sources?.out?.lines || [];
  const errLines = serverLogs.value.sources?.err?.lines || [];

  if (logView.value === "out") return outLines.join("\n");
  if (logView.value === "err") return errLines.join("\n");

  const chunks = [];
  if (outLines.length) {
    chunks.push("[stdout]", ...outLines);
  }
  if (errLines.length) {
    if (chunks.length) chunks.push("");
    chunks.push("[stderr]", ...errLines);
  }

  return chunks.join("\n");
});

const logUpdatedAt = computed(() => {
  const timestamp = Number(serverLogs.value.timestamp || 0);
  if (!timestamp) return "未更新";
  return new Date(timestamp).toLocaleString("zh-CN", { hour12: false });
});

async function fetchServerLogs({ silent = true } = {}) {
  if (!silent) logsLoading.value = true;

  try {
    const query = new URLSearchParams({
      type: logView.value,
      lines: String(LOG_LINE_COUNT)
    }).toString();
    const data = await apiService.request(`/admin/logs?${query}`);
    if (data?.sources) {
      serverLogs.value = data;
    }
  } catch (err) {
    console.error("fetch logs failed", err);
  } finally {
    if (!silent) logsLoading.value = false;
  }
}

function refreshServerLogs() {
  return fetchServerLogs({ silent: false });
}

async function fetchLoadConfig() {
  try {
    const data = await apiService.request("/admin/load-config");
    presets.value = data.presets || [];
    if (data.simulator) {
      metrics.value = {
        ...metrics.value,
        simulator: {
          ...metrics.value.simulator,
          ...data.simulator
        }
      };
      selectedPresetId.value = data.simulator.presetId || "";
      syncStagedPreset();
    }
  } catch (err) {
    console.error("load config failed", err);
  }
}

function startPolling() {
  async function fetchData() {
    try {
      const logQuery = new URLSearchParams({
        type: logView.value,
        lines: String(LOG_LINE_COUNT)
      }).toString();
      const [mRes, aRes, lRes] = await Promise.allSettled([
        apiService.request("/admin/metrics"),
        apiService.request("/admin/activity"),
        apiService.request(`/admin/logs?${logQuery}`)
      ]);

      if (mRes.status === "fulfilled" && mRes.value) {
        metrics.value = mRes.value;
        selectedPresetId.value = metrics.value.simulator?.presetId || selectedPresetId.value;
        syncStagedPreset();
      }

      if (aRes.status === "fulfilled" && aRes.value) {
        activity.value = aRes.value;
      }

      if (lRes.status === "fulfilled" && lRes.value?.sources) {
        serverLogs.value = lRes.value;
      }
    } catch (err) {
      console.error("admin poll failed", err);
    }
  }

  fetchData();
  intervalId = setInterval(fetchData, 3000);
}

async function applyPreset(presetId) {
  if (!presetId || presetId === selectedPresetId.value || savingConfig.value) return;
  savingConfig.value = true;
  try {
    const data = await apiService.request("/admin/load-config/preset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ presetId })
    });
    selectedPresetId.value = presetId;
    stagedPresetId.value = presetId;
    if (data.simulator) {
      metrics.value = {
        ...metrics.value,
        simulator: {
          ...metrics.value.simulator,
          ...data.simulator
        }
      };
    }
  } catch (err) {
    console.error("apply preset failed", err);
    setAdminNotice("鍒囨崲棰勮澶辫触");
  } finally {
    savingConfig.value = false;
  }
}

async function controlSimulator(action) {
  if (!action || simulatorActionLoading.value) return;
  simulatorActionLoading.value = action;
  try {
    const data = await apiService.request("/admin/simulator/control", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ action })
    });
    if (data?.simulator) {
      metrics.value = {
        ...metrics.value,
        simulator: {
          ...metrics.value.simulator,
          ...data.simulator
        }
      };
      selectedPresetId.value = data.simulator.presetId || selectedPresetId.value;
      syncStagedPreset();
    }
  } catch (err) {
    console.error("control simulator failed", err);
    setAdminNotice("模拟器控制失败");
  } finally {
    simulatorActionLoading.value = "";
  }
}

function toPercent(value) {
  return Math.max(0, Math.min(100, (value || 0) * 100));
}

function formatPct(value) {
  return `${toPercent(value).toFixed(1)}%`;
}

function formatMs(value) {
  if (!value) return "0 ms";
  return `${Math.round(value)} ms`;
}

function formatDuration(ms) {
  if (!ms || ms <= 0) return "0 秒";
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec} 秒`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} 分 ${sec % 60} 秒`;
  const hour = Math.floor(min / 60);
  return `${hour} 小时 ${min % 60} 分`;
}

function num(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n.toLocaleString("zh-CN") : "0";
}

function typeLabel(type) {
  const labels = {
    ACTIVE_VETERAN: "活跃老用户",
    SILENT_VETERAN: "沉默老用户",
    NEW_USER: "新用户",
    VISITOR: "璁垮"
  };
  return labels[type] || type || "鏈煡";
}

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
  if (adminNoticeTimer) {
    clearTimeout(adminNoticeTimer);
    adminNoticeTimer = null;
  }
});

watch(logView, () => {
  fetchServerLogs({ silent: false });
});

onMounted(async () => {
  if (!authStore.isLoggedIn && authStore.token) {
    await authStore.fetchUser();
  }

  if (!authStore.isAdmin) {
    return;
  }

  startPolling();
  fetchLoadConfig();
  fetchServerLogs({ silent: false });
});
</script>

<style scoped>
.admin-page {
  max-width: var(--layout-max-width);
  margin: 0 auto;
  padding: 28px var(--layout-gutter) calc(108px + var(--safe-bottom));
}

.admin-notice {
  margin-bottom: 12px;
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, #c44536 30%, var(--color-border-light));
  background: color-mix(in srgb, #c44536 10%, var(--color-surface));
  color: #b23a2f;
  font-size: 13px;
  font-weight: 600;
  padding: 10px 12px;
}

.admin-notice-fade-enter-active,
.admin-notice-fade-leave-active {
  transition: opacity var(--motion-base) var(--motion-smooth), transform var(--motion-fast) var(--motion-spring);
}

.admin-notice-fade-enter-from,
.admin-notice-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.admin-hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(260px, 0.85fr);
  gap: 24px;
  padding: 26px var(--panel-padding);
  margin-bottom: 26px;
  background:
    radial-gradient(circle at top right, var(--color-accent-subtle) 0, transparent 38%),
    linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-elevated) 100%);
  border-radius: var(--panel-radius);
  box-shadow: none;
  overflow: hidden;
}

.hero-copy,
.hero-aside {
  position: relative;
  z-index: 1;
}

.hero-kicker,
.section-kicker {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-text-tertiary);
}

.hero-title {
  margin-top: 10px;
  font-size: clamp(36px, 5vw, 58px);
  line-height: 1.06;
  letter-spacing: -0.04em;
  color: var(--color-text-primary);
}

.hero-subtitle {
  max-width: 36rem;
  margin-top: 16px;
  font-size: 16px;
  line-height: 1.8;
  color: var(--color-text-secondary);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;
}

.hero-pill {
  display: inline-flex;
  align-items: center;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid var(--color-border-light);
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(10px);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.hero-pill-neutral {
  color: var(--color-accent);
}

.hero-pill.ok {
  color: #0f8a63;
  border-color: color-mix(in srgb, #0f8a63 24%, var(--color-border-light));
}

.hero-pill.warn {
  color: #b76a10;
  border-color: color-mix(in srgb, #b76a10 24%, var(--color-border-light));
}

.hero-pill.danger {
  color: #c44536;
  border-color: color-mix(in srgb, #c44536 24%, var(--color-border-light));
}

.hero-aside {
  display: grid;
  align-items: end;
  min-height: 220px;
}

.hero-status-card {
  align-self: end;
  display: grid;
  gap: 8px;
  padding: 22px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-light);
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  box-shadow: var(--shadow-sm);
}

.status-label,
.status-meta {
  color: var(--color-text-secondary);
}

.status-label {
  font-size: 13px;
}

.status-value {
  font-size: clamp(28px, 4vw, 42px);
  line-height: 1;
  color: var(--color-text-primary);
}

.status-meta {
  font-size: 13px;
}

.hero-orb {
  position: absolute;
  border-radius: 50%;
  background: var(--color-accent);
  opacity: 0.08;
  filter: blur(4px);
}

.hero-orb-large {
  width: 180px;
  height: 180px;
  top: 6px;
  right: 24px;
}

.hero-orb-small {
  width: 92px;
  height: 92px;
  right: 140px;
  bottom: 70px;
}

.tab-bar {
  display: inline-flex;
  gap: 8px;
  padding: 0 10px;
  margin-bottom: 26px;
  border-radius: var(--panel-radius);
  box-shadow: var(--shadow-sm);
}

.tab-button {
  min-height: 36px;
  padding: 0 14px;
  color: var(--color-text-secondary);
  font-size: 14px;
  font-weight: 600;
  transition: all var(--transition-fast);
}

.tab-button.active {
  background: transparent;
  color: var(--color-text-primary);
  box-shadow: none;
}

.login-card,
.profile-card,
.metric-card,
.panel-card {
  border-radius: var(--panel-radius);
  box-shadow: none;
}

.profile-card {
  display: grid;
  gap: 14px;
  padding: var(--panel-padding);
  margin-bottom: 22px;
}

.profile-grid {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.profile-title {
  margin-top: 6px;
  font-size: 28px;
  letter-spacing: -0.03em;
  color: var(--color-text-primary);
}

.profile-meta,
.profile-note {
  color: var(--color-text-secondary);
}

.profile-meta {
  margin-top: 8px;
  font-size: 14px;
}

.profile-note {
  font-size: 14px;
  line-height: 1.7;
}

.profile-stats {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.profile-stats span {
  padding: 8px 12px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-surface) 84%, var(--color-accent-subtle));
  border: 1px solid var(--color-border-light);
  font-size: 13px;
  color: var(--color-text-secondary);
}

.profile-switcher {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.simulator-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--color-surface) 92%, var(--color-accent-subtle));
}

.simulator-state {
  display: grid;
  gap: 4px;
}

.state-label {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.state-value {
  font-size: 14px;
}

.state-value.running {
  color: #0f8a63;
}

.state-value.paused {
  color: #b76a10;
}

.state-value.stopped {
  color: #c44536;
}

.simulator-buttons {
  display: flex;
  gap: 10px;
}

.preset-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--color-surface) 92%, var(--color-accent-subtle));
}

.preset-state {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.preset-action-buttons {
  display: flex;
  gap: 10px;
}

.profile-button {
  min-width: 88px;
  padding: 12px 20px;
  border-radius: 999px;
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border-light);
  color: var(--color-text-secondary);
  font-size: 15px;
  font-weight: 600;
  transition: all var(--transition-fast);
}

.profile-button.active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: #fff;
  box-shadow: 0 10px 24px color-mix(in srgb, var(--color-accent) 28%, transparent);
}

.profile-button:disabled {
  opacity: 0.6;
  cursor: wait;
}

.ghost-button,
.apply-button {
  min-height: 40px;
  padding: 0 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  transition: all var(--transition-fast);
}

.ghost-button {
  border: 1px solid var(--color-border-light);
  background: var(--color-surface);
  color: var(--color-text-secondary);
}

.apply-button {
  border: 1px solid var(--color-accent);
  background: var(--color-accent);
  color: #fff;
}

.ghost-button:disabled,
.apply-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
}

.preset-card {
  display: grid;
  gap: 10px;
  padding: 16px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--color-surface) 90%, var(--color-accent-subtle));
}

.preset-card.active {
  border-color: var(--color-accent);
  box-shadow: 0 14px 28px color-mix(in srgb, var(--color-accent) 12%, transparent);
}

.preset-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.preset-card-head strong {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: var(--color-text-primary);
}

.preset-badge {
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--color-accent) 32%, var(--color-border-light));
  font-style: normal;
  font-size: 11px;
  color: var(--color-accent);
}

.preset-card-head span,
.preset-card p,
.preset-card-meta {
  color: var(--color-text-secondary);
}

.preset-card p {
  font-size: 14px;
  line-height: 1.6;
}

.preset-card-meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.preset-card-meta span {
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid var(--color-border-light);
  font-size: 12px;
}

.login-card {
  display: grid;
  gap: 28px;
  padding: 32px;
}

.section-heading h2 {
  margin-top: 8px;
  font-size: 32px;
  letter-spacing: -0.03em;
  color: var(--color-text-primary);
}

.section-heading p:last-child {
  margin-top: 10px;
  color: var(--color-text-secondary);
}

.login-form {
  display: grid;
  gap: 12px;
}

.field-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.auth-row {
  display: flex;
  gap: 12px;
}

.auth-row input {
  flex: 1;
  min-width: 0;
  padding: 14px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-elevated);
  color: var(--color-text-primary);
  font-size: 15px;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.auth-row input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 4px var(--color-accent-subtle);
}

.auth-row button {
  padding: 14px 20px;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--color-accent) 0%, color-mix(in srgb, var(--color-accent) 68%, #ffffff) 100%);
  color: #fff;
  font-weight: 600;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.auth-row button:hover,
.tab-button:hover {
  transform: translateY(-1px);
}

.auth-row button:hover {
  box-shadow: var(--shadow-md);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 18px;
  margin-bottom: 22px;
}

.metric-card {
  padding: var(--panel-padding);
  transition: transform var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.metric-card:hover,
.panel-card:hover {
  transform: translateY(-3px);
  border-color: var(--color-accent-subtle);
  box-shadow: var(--shadow-md);
}

.feature-card {
  background: linear-gradient(135deg, var(--color-surface) 0%, color-mix(in srgb, var(--color-accent) 7%, var(--color-surface)) 100%);
}

.metric-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-tertiary);
}

.metric-value {
  margin-top: 14px;
  font-size: clamp(28px, 3vw, 40px);
  line-height: 1;
  letter-spacing: -0.04em;
  color: var(--color-text-primary);
}

.metric-meta {
  margin-top: 12px;
  font-size: 14px;
  color: var(--color-text-secondary);
}

.valve-card.open .metric-value {
  color: #0f8a63;
}

.valve-card.steady .metric-value {
  color: #188a72;
}

.valve-card.tight .metric-value {
  color: #b76a10;
}

.valve-card.closed .metric-value {
  color: #c44536;
}

.panel-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.wide-panel {
  grid-column: span 2;
}

.panel-card {
  display: grid;
  gap: 22px;
  padding: var(--panel-padding);
  transition: transform var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.panel-header h3 {
  margin-top: 6px;
  font-size: 24px;
  letter-spacing: -0.03em;
  color: var(--color-text-primary);
}

.panel-header span {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.meter-list,
.mix-list,
.kv-list,
.route-list {
  display: grid;
  gap: 14px;
  align-content: start;
}

.meter-item,
.mix-item {
  display: grid;
  gap: 8px;
  align-content: start;
}

.meter-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 14px;
  color: var(--color-text-secondary);
}

.meter-head strong {
  color: var(--color-text-primary);
}

.meter {
  height: 10px;
  border-radius: 999px;
  background: var(--color-border-light);
  overflow: hidden;
}

.fill {
  height: 100%;
  border-radius: inherit;
}

.fill.cpu {
  background: linear-gradient(90deg, #4f46e5 0%, #2563eb 100%);
}

.fill.mem {
  background: linear-gradient(90deg, #0ea5e9 0%, #06b6d4 100%);
}

.fill.online {
  background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
}

.route-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-light);
  background: color-mix(in srgb, var(--color-surface) 86%, var(--color-accent-subtle));
}

.route-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.route-meta,
.footnote,
.empty-state,
.mini-stats {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.kv {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border-light);
  font-size: 14px;
  color: var(--color-text-secondary);
}

.kv strong {
  color: var(--color-text-primary);
}

.mini-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
}

.logs-panel {
  gap: 14px;
}

.log-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.log-switch {
  display: inline-flex;
  padding: 4px;
  border-radius: 999px;
  border: 1px solid var(--color-border-light);
  background: var(--color-surface-elevated);
}

.log-switch-btn {
  min-height: 34px;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
}

.log-switch-btn.active {
  background: var(--color-accent);
  color: #fff;
}

.log-meta {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.log-shell {
  max-height: 340px;
  overflow: auto;
  border-radius: var(--radius-lg);
  border: 1px solid #23344a;
  background: #0f172a;
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.18);
}

.log-content {
  margin: 0;
  padding: 14px 16px;
  font-family: Consolas, "Courier New", Menlo, Monaco, monospace;
  font-size: 12px;
  line-height: 1.56;
  color: #dbe7ff;
  white-space: pre-wrap;
  word-break: break-word;
}

.sessions-grid {
  grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
}

.sessions-grid .panel-card {
  align-content: start;
  grid-auto-rows: min-content;
}

@media (max-width: 900px) {
  .admin-page {
    padding: 18px var(--layout-gutter-mobile) calc(84px + var(--safe-bottom));
  }

  .profile-grid {
    display: grid;
  }

  .admin-hero,
  .panel-grid,
  .sessions-grid {
    grid-template-columns: 1fr;
  }

  .profile-stats {
    justify-content: flex-start;
  }

  .preset-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .simulator-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .preset-action-buttons {
    justify-content: flex-end;
  }

  .simulator-buttons {
    justify-content: flex-end;
  }

  .wide-panel {
    grid-column: auto;
  }
}

@media (max-width: 640px) {
  .admin-hero,
  .login-card,
  .metric-card,
  .panel-card {
    padding: 20px;
    border-radius: var(--radius-lg);
  }

  .hero-title {
    font-size: 34px;
  }

  .section-heading h2,
  .panel-header h3 {
    font-size: 22px;
  }

  .auth-row,
  .panel-header,
  .route-item {
    flex-direction: column;
    align-items: stretch;
  }

  .auth-row button {
    width: 100%;
  }

  .tab-bar {
    display: flex;
    width: 100%;
    position: sticky;
    top: calc(46px + var(--safe-top));
    z-index: 12;
    background: color-mix(in srgb, var(--color-bg) 94%, transparent);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }

  .log-actions {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }

  .log-switch {
    width: 100%;
    justify-content: space-between;
  }

  .log-switch-btn {
    flex: 1;
  }

  .tab-button {
    flex: 1;
    text-align: center;
  }
}
</style>


