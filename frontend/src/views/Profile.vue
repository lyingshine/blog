<template>
  <div class="profile-page">
    <div class="container">
      <!-- 页面标题 -->
      <header class="page-header">
        <h1>个人设置</h1>
        <p>管理你的个人信息和偏好设置</p>
      </header>

      <div class="profile-content">
        <!-- 左侧导航 -->
        <aside class="profile-sidebar">
          <nav class="profile-nav">
            <button 
              :class="{ active: activeTab === 'basic' }"
              @click="activeTab = 'basic'"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              基本信息
            </button>
            
            <button 
              :class="{ active: activeTab === 'avatar' }"
              @click="activeTab = 'avatar'"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
              头像设置
            </button>
            
            <button 
              :class="{ active: activeTab === 'security' }"
              @click="activeTab = 'security'"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <circle cx="12" cy="16" r="1"></circle>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              安全设置
            </button>
          </nav>
        </aside>

        <!-- 右侧内容 -->
        <main class="profile-main">
          <!-- 基本信息 -->
          <div v-if="activeTab === 'basic'" class="tab-content">
            <div class="card">
              <div class="card-header">
                <h2>基本信息</h2>
                <p>更新你的个人基本信息</p>
              </div>
              
              <form @submit.prevent="updateProfile" class="profile-form">
                <div class="form-group">
                  <label for="username">用户名</label>
                  <input 
                    id="username"
                    v-model="profileForm.username" 
                    type="text" 
                    readonly
                    class="form-input readonly"
                  />
                  <small class="form-hint">用户名不可修改</small>
                </div>

                <div class="form-group">
                  <label for="email">邮箱地址</label>
                  <input 
                    id="email"
                    v-model="profileForm.email" 
                    type="email" 
                    class="form-input"
                    required
                  />
                </div>

                <div class="form-group">
                  <label for="bio">个人简介</label>
                  <textarea 
                    id="bio"
                    v-model="profileForm.bio" 
                    class="form-textarea"
                    rows="4"
                    placeholder="介绍一下你自己..."
                  ></textarea>
                </div>

                <div class="form-actions">
                  <button type="submit" :disabled="updating" class="btn-primary">
                    {{ updating ? '保存中...' : '保存更改' }}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- 头像设置 -->
          <div v-if="activeTab === 'avatar'" class="tab-content">
            <div class="card">
              <div class="card-header">
                <h2>头像设置</h2>
                <p>上传自定义头像或选择预设头像</p>
              </div>
              
              <div class="avatar-section">
                <AvatarUploader 
                  :current-avatar="user.avatar" 
                  :username="user.username"
                  @avatar-updated="handleAvatarUpdate"
                />
                
                <div class="avatar-info">
                  <h3>当前头像</h3>
                  <p>点击头像可以更换新的头像</p>
                  <ul class="avatar-tips">
                    <li>支持 JPG、PNG、GIF 格式</li>
                    <li>文件大小不超过 5MB</li>
                    <li>建议尺寸 200x200 像素</li>
                    <li>也可以选择系统预设头像</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- 安全设置 -->
          <div v-if="activeTab === 'security'" class="tab-content">
            <div class="card">
              <div class="card-header">
                <h2>安全设置</h2>
                <p>管理你的账户安全</p>
              </div>
              
              <form @submit.prevent="changePassword" class="security-form">
                <div class="form-group">
                  <label for="currentPassword">当前密码</label>
                  <input 
                    id="currentPassword"
                    v-model="passwordForm.currentPassword" 
                    type="password" 
                    class="form-input"
                    required
                  />
                </div>

                <div class="form-group">
                  <label for="newPassword">新密码</label>
                  <input 
                    id="newPassword"
                    v-model="passwordForm.newPassword" 
                    type="password" 
                    class="form-input"
                    minlength="6"
                    required
                  />
                  <small class="form-hint">密码长度至少6位</small>
                </div>

                <div class="form-group">
                  <label for="confirmPassword">确认新密码</label>
                  <input 
                    id="confirmPassword"
                    v-model="passwordForm.confirmPassword" 
                    type="password" 
                    class="form-input"
                    required
                  />
                </div>

                <div class="form-actions">
                  <button type="submit" :disabled="changingPassword" class="btn-primary">
                    {{ changingPassword ? '修改中...' : '修改密码' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script>
import AvatarUploader from '../components/AvatarUploader.vue'
import message from '../utils/message.js'
import { useAuth } from '../composables/useAuth.js'
import { refreshAllAvatars } from '../utils/cache-buster.js'

export default {
  name: 'Profile',
  components: {
    AvatarUploader
  },
  setup() {
    const { user: authUser, refreshUser, updateAvatar } = useAuth()
    return {
      authUser,
      refreshUser,
      updateAvatar
    }
  },
  data() {
    return {
      activeTab: 'basic',
      user: {
        username: '',
        email: '',
        avatar: '',
        bio: ''
      },
      profileForm: {
        username: '',
        email: '',
        bio: ''
      },
      passwordForm: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      updating: false,
      changingPassword: false
    }
  },
  async created() {
    await this.loadUserProfile()
  },
  methods: {
    async loadUserProfile() {
      try {
        const token = localStorage.getItem('blog_token')
        console.log('当前token:', token)
        
        if (!token) {
          message.error('请先登录')
          this.$router.push('/login')
          return
        }

        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        console.log('API响应状态:', response.status)
        console.log('API响应头:', response.headers)

        if (response.ok) {
          const data = await response.json()
          console.log('用户数据:', data)
          this.user = data.user
          this.profileForm = {
            username: data.user.username,
            email: data.user.email,
            bio: data.user.bio || ''
          }
        } else {
          const errorText = await response.text()
          console.error('API错误响应:', errorText)
          throw new Error('获取用户信息失败')
        }
      } catch (error) {
        console.error('加载用户信息失败:', error)
        message.error('加载用户信息失败')
        
        // 如果是认证错误，跳转到登录页
        if (error.message.includes('401') || error.message.includes('token')) {
          this.$router.push('/login')
        }
      }
    },

    async updateProfile() {
      this.updating = true
      
      try {
        const response = await fetch('/api/auth/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('blog_token')}`
          },
          body: JSON.stringify({
            email: this.profileForm.email,
            bio: this.profileForm.bio
          })
        })

        const data = await response.json()

        if (response.ok) {
          message.success('个人信息更新成功')
          this.user.email = this.profileForm.email
          this.user.bio = this.profileForm.bio
        } else {
          throw new Error(data.error || '更新失败')
        }
      } catch (error) {
        console.error('更新个人信息失败:', error)
        message.error(error.message || '更新个人信息失败')
      } finally {
        this.updating = false
      }
    },

    async changePassword() {
      // 验证密码
      if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
        message.error('两次输入的密码不一致')
        return
      }

      if (this.passwordForm.newPassword.length < 6) {
        message.error('新密码长度至少6位')
        return
      }

      this.changingPassword = true
      
      try {
        const response = await fetch('/api/auth/password', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('blog_token')}`
          },
          body: JSON.stringify({
            currentPassword: this.passwordForm.currentPassword,
            newPassword: this.passwordForm.newPassword
          })
        })

        const data = await response.json()

        if (response.ok) {
          message.success('密码修改成功')
          this.passwordForm = {
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          }
        } else {
          throw new Error(data.error || '密码修改失败')
        }
      } catch (error) {
        console.error('密码修改失败:', error)
        message.error(error.message || '密码修改失败')
      } finally {
        this.changingPassword = false
      }
    },

    async handleAvatarUpdate(newAvatar) {
      // 更新本地用户信息
      this.user.avatar = newAvatar
      
      // 使用 useAuth 更新全局状态
      this.updateAvatar(newAvatar)
      
      // 刷新用户信息以确保同步
      await this.refreshUser()
      
      // 如果全局用户状态已更新，同步到本地
      if (this.authUser) {
        this.user = { ...this.authUser }
      }
      
      // 强制刷新所有头像图片，清理缓存
      setTimeout(() => {
        refreshAllAvatars()
      }, 100)
      
      // 强制刷新页面上的头像显示
      this.$forceUpdate()
      
      // 触发全局事件，通知其他组件更新头像
      window.dispatchEvent(new CustomEvent('avatar-updated', { 
        detail: { avatar: newAvatar } 
      }))
      
      message.success('头像更新成功')
    }
  }
}
</script>

<style scoped>
.profile-page {
  padding: 2rem 0;
  min-height: calc(100vh - 200px);
}

.page-header {
  text-align: center;
  margin-bottom: 3rem;
}

.page-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #1f2937;
}

.page-header p {
  font-size: 1.125rem;
  color: #6b7280;
}

.profile-content {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.profile-sidebar {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  height: fit-content;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.profile-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.profile-nav button {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  color: #6b7280;
  transition: all 0.3s ease;
  text-align: left;
  width: 100%;
}

.profile-nav button:hover {
  background: #f3f4f6;
  color: #374151;
}

.profile-nav button.active {
  background: #eff6ff;
  color: #3b82f6;
}

.profile-main {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card {
  padding: 2rem;
}

.card-header {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.card-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #1f2937;
}

.card-header p {
  color: #6b7280;
}

.profile-form,
.security-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: #374151;
}

.form-input,
.form-textarea {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input.readonly {
  background: #f9fafb;
  color: #6b7280;
  cursor: not-allowed;
}

.form-hint {
  font-size: 0.875rem;
  color: #6b7280;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 1rem;
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.avatar-section {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
}

.avatar-info {
  flex: 1;
}

.avatar-info h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #1f2937;
}

.avatar-info p {
  color: #6b7280;
  margin-bottom: 1rem;
}

.avatar-tips {
  list-style: none;
  padding: 0;
  margin: 0;
}

.avatar-tips li {
  padding: 0.25rem 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.avatar-tips li:before {
  content: '•';
  color: #3b82f6;
  margin-right: 0.5rem;
}

@media (max-width: 768px) {
  .profile-content {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .profile-sidebar {
    order: 2;
  }
  
  .profile-nav {
    flex-direction: row;
    overflow-x: auto;
  }
  
  .profile-nav button {
    white-space: nowrap;
    min-width: 120px;
  }
  
  .avatar-section {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .card {
    padding: 1.5rem;
  }
}
</style>