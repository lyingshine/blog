<template>
  <div class="about-page">
    <header class="about-header ux-card">
      <div class="avatar-wrapper">
        <div class="avatar">
          <img
            v-if="isImageAvatar(authStore.user?.avatar)"
            :src="resolveAssetUrl(authStore.user?.avatar)"
            alt="avatar"
            class="avatar-image"
          />
          <span v-else>{{ avatarFallback }}</span>
        </div>
        <input
          ref="avatarInputRef"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          class="avatar-input"
          @change="handleAvatarSelect"
        />
        <button class="avatar-upload-btn chip-button" type="button" :disabled="uploadingAvatar" @click="triggerAvatarInput">
          {{ uploadingAvatar ? '上传中...' : '上传头像' }}
        </button>
        <p class="avatar-tip">支持 png/jpg/webp/gif，文件大小不超过 2MB</p>
        <p v-if="avatarError" class="avatar-error">{{ avatarError }}</p>
      </div>

      <h1 class="about-title">{{ authStore.user?.username || '个人资料' }}</h1>
      <p class="about-subtitle">完善你的公开信息，让主页展示更完整、更有温度。</p>

      <div class="profile-badges">
        <span class="profile-badge">资料完整度 {{ profileCompletion }}%</span>
        <span class="profile-badge">{{ joinDateLabel }}</span>
        <span class="profile-badge">{{ authStore.user?.role === 'admin' ? '管理员账号' : '普通账号' }}</span>
      </div>

      <div class="profile-progress" aria-label="资料完整度">
        <span :style="{ width: `${profileCompletion}%` }"></span>
      </div>
    </header>

    <section class="about-card ux-card">
      <template v-if="authStore.isLoggedIn">
        <form class="profile-form" @submit.prevent="handleSave">
          <section class="form-section ux-card">
            <h2 class="section-title">公开展示</h2>

            <label class="field">
              <span class="label">个人标语</span>
              <input
                v-model="form.headline"
                type="text"
                maxlength="120"
                placeholder="例如：记录生活，分享思考"
              />
              <div class="headline-suggestions">
                <button
                  v-for="item in headlineSuggestions"
                  :key="item"
                  type="button"
                  class="suggestion-btn chip-button"
                  @click="applyHeadline(item)"
                >
                  {{ item }}
                </button>
              </div>
              <span class="hint">主页 Hero 区域会优先展示这句标语</span>
            </label>

            <label class="field">
              <span class="label">个人简介</span>
              <textarea
                v-model="form.bio"
                maxlength="500"
                rows="5"
                placeholder="你在关注什么、在做什么、希望在这里记录什么"
              ></textarea>
            </label>
          </section>

          <section class="form-section ux-card">
            <h2 class="section-title">联系与身份</h2>

            <div class="grid">
              <label class="field">
                <span class="label">所在地</span>
                <input v-model="form.location" type="text" maxlength="100" placeholder="城市 / 地区" />
              </label>

              <label class="field">
                <span class="label">职业或身份</span>
                <input v-model="form.company" type="text" maxlength="200" placeholder="例如：产品设计 / 独立开发" />
              </label>
            </div>

            <label class="field">
              <span class="label">个人链接</span>
              <input v-model="form.website" type="url" maxlength="300" placeholder="https://..." />
            </label>
          </section>

          <div class="actions">
            <button class="save-btn chip-button" type="submit" :disabled="saving">
              {{ saving ? '保存中...' : '保存资料' }}
            </button>
            <span class="status" :class="{ error: saveError }">{{ statusText }}</span>
          </div>
        </form>
      </template>

      <template v-else>
        <div class="guest-empty">
          <h3>登录后可编辑个人资料</h3>
          <p>设置标语和简介后，你的主页会更完整，也更有个人风格。</p>
          <router-link to="/login" class="login-link chip-button">去登录</router-link>
        </div>
      </template>
    </section>
  </div>
</template>

<script setup>
import { reactive, computed, watch, ref } from 'vue'
import apiService, { resolveAssetUrl } from '../api'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const saving = ref(false)
const saveError = ref('')
const saveSuccess = ref(false)
const uploadingAvatar = ref(false)
const avatarError = ref('')
const avatarInputRef = ref(null)

const form = reactive({
  headline: '',
  bio: '',
  location: '',
  company: '',
  website: ''
})

const headlineSuggestions = [
  '记录日常，也记录每次成长',
  '把灵感、经验和热爱写下来',
  '在变化里长期做一件事',
  '认真生活，持续表达',
  '写给当下，也写给未来'
]

const isImageAvatar = (avatar) =>
  typeof avatar === 'string' &&
  /^(https?:\/\/|\/uploads\/|data:image\/)/i.test(avatar)

const avatarFallback = computed(() => {
  const rawAvatar = authStore.user?.avatar
  if (isImageAvatar(rawAvatar)) {
    return (authStore.user?.username || 'U').charAt(0).toUpperCase()
  }
  const trimmed = typeof rawAvatar === 'string' ? rawAvatar.trim() : ''
  if (trimmed) return trimmed.charAt(0).toUpperCase()
  return (authStore.user?.username || 'U').charAt(0).toUpperCase()
})

const joinDateLabel = computed(() => {
  const rawDate = authStore.user?.created_at
  if (!rawDate) return '加入时间暂未记录'

  const parsed = new Date(rawDate)
  if (Number.isNaN(parsed.getTime())) return '加入时间暂未记录'

  const yyyy = parsed.getFullYear()
  const mm = `${parsed.getMonth() + 1}`.padStart(2, '0')
  const dd = `${parsed.getDate()}`.padStart(2, '0')
  return `加入于 ${yyyy}-${mm}-${dd}`
})

const profileCompletion = computed(() => {
  const checks = [
    form.headline,
    form.bio,
    form.location,
    form.company,
    form.website,
    authStore.user?.avatar
  ]
  const completed = checks.filter((item) => typeof item === 'string' && item.trim()).length
  return Math.round((completed / checks.length) * 100)
})

const fillForm = (user = {}) => {
  form.headline = user.headline || ''
  form.bio = user.bio || ''
  form.location = user.location || ''
  form.company = user.company || ''
  form.website = user.website || ''
}

watch(
  () => authStore.user,
  (user) => {
    fillForm(user || {})
  },
  { immediate: true }
)

const statusText = computed(() => {
  if (saveError.value) return saveError.value
  if (saveSuccess.value) return '资料已更新'
  return '支持随时修改，保存后立即生效'
})

const handleSave = async () => {
  saveError.value = ''
  saveSuccess.value = false
  saving.value = true

  try {
    const response = await apiService.updateMyProfile({
      headline: form.headline,
      bio: form.bio,
      location: form.location,
      company: form.company,
      website: form.website
    })

    authStore.setUser(response.data)
    saveSuccess.value = true
  } catch (error) {
    saveError.value = error.message || '保存失败，请稍后重试'
  } finally {
    saving.value = false
  }
}

const applyHeadline = (text) => {
  form.headline = text
}

const triggerAvatarInput = () => {
  avatarInputRef.value?.click()
}

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('读取头像文件失败'))
    reader.readAsDataURL(file)
  })

const handleAvatarSelect = async (event) => {
  avatarError.value = ''
  const file = event?.target?.files?.[0]
  if (!file) return

  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    avatarError.value = '文件格式不支持，请上传 png/jpg/webp/gif 图片'
    event.target.value = ''
    return
  }

  if (file.size > 2 * 1024 * 1024) {
    avatarError.value = '头像文件过大，请控制在 2MB 以内'
    event.target.value = ''
    return
  }

  uploadingAvatar.value = true
  try {
    const avatarData = await readFileAsDataUrl(file)
    const response = await apiService.uploadMyAvatar(avatarData)
    authStore.setUser(response.data)
  } catch (error) {
    avatarError.value = error.message || '上传失败，请稍后重试'
  } finally {
    uploadingAvatar.value = false
    event.target.value = ''
  }
}
</script>

<style scoped>
.about-page {
  max-width: var(--layout-max-width);
  margin: 0 auto;
  padding: 22px var(--layout-gutter) calc(76px + var(--safe-bottom));
}

.about-header {
  text-align: center;
  padding: 30px var(--panel-padding);
  border-radius: 16px;
  background:
    radial-gradient(circle at 15% 15%, color-mix(in srgb, var(--color-accent) 12%, transparent), transparent 58%),
    radial-gradient(circle at 85% 18%, color-mix(in srgb, var(--color-accent) 8%, transparent), transparent 55%),
    var(--surface-panel);
  box-shadow: none;
}

.avatar-wrapper {
  position: relative;
  width: fit-content;
  margin: 0 auto 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 2px solid color-mix(in srgb, var(--color-accent) 24%, #fff);
  background: linear-gradient(145deg, var(--color-surface-elevated), var(--color-surface));
  color: var(--color-text-primary);
  font-size: 34px;
  font-weight: 650;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-input {
  display: none;
}

.avatar-upload-btn {
  margin-top: 12px;
  min-height: 34px;
  padding: 0 12px;
}

.avatar-tip {
  margin-top: 6px;
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.avatar-error {
  margin-top: 6px;
  font-size: 12px;
  color: #d04848;
}

.about-title {
  font-size: clamp(30px, 3.6vw, 36px);
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin: 0;
}

.about-title + .about-subtitle {
  margin-top: 10px;
  margin-bottom: 6px;
}

.about-subtitle {
  color: var(--color-text-secondary);
  font-size: 15px;
}

.profile-badges {
  margin-top: 14px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.profile-badge {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--color-accent) 20%, var(--color-border-light));
  background: color-mix(in srgb, var(--color-accent) 10%, var(--color-surface));
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 600;
}

.profile-progress {
  width: min(360px, 82%);
  height: 8px;
  margin: 12px auto 0;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-accent) 10%, var(--color-surface-elevated));
  overflow: hidden;
}

.profile-progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 60%, #66b0ff));
  transition: width var(--transition-fast);
}

.about-card {
  border-radius: var(--panel-radius);
  box-shadow: none;
  padding: var(--panel-padding);
  margin-top: 12px;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-section {
  border-radius: var(--panel-radius);
  padding: var(--panel-padding);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  font-size: 14px;
  color: var(--color-text-secondary);
  letter-spacing: 0.02em;
  margin: 0;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label {
  font-size: 13px;
  color: var(--color-text-secondary);
  font-weight: 600;
}

input,
textarea {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 11px 12px;
  background: var(--color-surface-elevated);
  color: var(--color-text-primary);
  font-size: 14px;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast), background var(--transition-fast);
}

input:hover,
textarea:hover {
  border-color: color-mix(in srgb, var(--color-accent) 30%, var(--color-border));
}

input:focus,
textarea:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-subtle);
  outline: none;
}

textarea {
  resize: vertical;
  min-height: 120px;
}

.hint {
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.headline-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.suggestion-btn {
  min-height: 30px;
  font-size: 12px;
  line-height: 1;
  padding: 0 10px;
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 2px;
}

.save-btn {
  min-height: 38px;
  padding: 0 16px;
  background: var(--color-accent);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
}

.save-btn:hover:enabled {
  background: var(--color-accent-hover);
}

.status {
  font-size: 13px;
  color: var(--color-text-tertiary);
}

.status.error {
  color: #d04848;
}

.guest-empty {
  text-align: center;
  padding: 28px 10px;
}

.guest-empty h3 {
  font-size: 20px;
  margin-bottom: 8px;
}

.guest-empty p {
  color: var(--color-text-secondary);
  margin-bottom: 18px;
}

.login-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 0 16px;
  background: var(--color-accent);
  color: #fff;
}

@media (max-width: 768px) {
  .about-page {
    padding: 16px var(--layout-gutter-mobile) calc(64px + var(--safe-bottom));
  }

  .about-header {
    padding: 24px var(--panel-padding);
  }

  .avatar {
    width: 92px;
    height: 92px;
    font-size: 32px;
  }

  .about-title {
    font-size: 30px;
  }

  .about-subtitle {
    font-size: 14px;
  }

  .profile-badges {
    margin-top: 12px;
    gap: 6px;
  }

  .profile-badge {
    font-size: 11px;
    padding: 0 10px;
    height: 26px;
  }

  .profile-progress {
    width: 88%;
    margin-top: 10px;
  }

  .grid {
    grid-template-columns: 1fr;
  }

  .actions {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .save-btn {
    width: 100%;
  }
}
</style>
