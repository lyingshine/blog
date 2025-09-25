<template>
  <div class="avatar-uploader">
    <div class="current-avatar">
      <img :src="currentAvatar" :alt="username" class="avatar-preview" />
      <div class="avatar-overlay" @click="openModal">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
          <circle cx="12" cy="13" r="4"></circle>
        </svg>
        <span>更换头像</span>
      </div>
    </div>

    <!-- 头像选择模态框 -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>选择头像</h3>
          <button @click="closeModal" class="close-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <!-- 上传选项卡 -->
          <div class="tabs">
            <button 
              :class="{ active: activeTab === 'upload' }" 
              @click="activeTab = 'upload'"
            >
              上传图片
            </button>
            <button 
              :class="{ active: activeTab === 'preset' }" 
              @click="activeTab = 'preset'"
            >
              预设头像
            </button>
          </div>

          <!-- 上传图片 -->
          <div v-if="activeTab === 'upload'" class="upload-section">
            <div class="upload-area" @click="triggerFileInput" @dragover.prevent @drop="handleDrop">
              <input 
                ref="fileInput" 
                type="file" 
                accept="image/*" 
                @change="handleFileSelect" 
                style="display: none"
              />
              
              <div v-if="!selectedFile" class="upload-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7,10 12,15 17,10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <p>点击或拖拽图片到此处</p>
                <p class="upload-hint">支持 JPG、PNG、GIF 格式，最大 5MB</p>
              </div>

              <div v-else class="file-preview">
                <img :src="previewUrl" alt="预览" />
                <p>{{ selectedFile.name }}</p>
              </div>
            </div>

            <div v-if="selectedFile" class="upload-actions">
              <button @click="clearFile" class="btn-secondary">重新选择</button>
              <button @click="uploadFile" :disabled="uploading" class="btn-primary">
                {{ uploading ? '上传中...' : '上传头像' }}
              </button>
            </div>
          </div>

          <!-- 预设头像 -->
          <div v-if="activeTab === 'preset'" class="preset-section">
            <div class="seed-input">
              <label>个性化种子（可选）：</label>
              <input 
                v-model="avatarSeed" 
                type="text" 
                placeholder="输入任意文本生成独特头像"
                @input="generatePresets"
              />
            </div>

            <div class="preset-grid">
              <div 
                v-for="preset in presets" 
                :key="preset.style"
                class="preset-item"
                @click="selectPreset(preset.url)"
              >
                <img :src="preset.url" :alt="preset.name" />
                <div class="preset-info">
                  <h4>{{ preset.name }}</h4>
                  <p>{{ preset.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
    </div>
  </div>
</template>

<script>
import message from '../utils/message.js'

export default {
  name: 'AvatarUploader',
  props: {
    currentAvatar: {
      type: String,
      default: '/default-avatar.png'
    },
    username: {
      type: String,
      default: 'User'
    }
  },
  data() {
    return {
      showModal: false,
      activeTab: 'upload',
      selectedFile: null,
      previewUrl: '',
      uploading: false,
      loading: false,
      avatarSeed: '',
      presets: []
    }
  },
  mounted() {
    this.avatarSeed = this.username || 'default'
    this.generatePresets()
  },
  methods: {
    openModal() {
      this.showModal = true
    },

    closeModal() {
      this.showModal = false
      this.clearFile()
    },

    triggerFileInput() {
      this.$refs.fileInput.click()
    },

    handleFileSelect(event) {
      const file = event.target.files[0]
      if (file) {
        this.processFile(file)
      }
    },

    handleDrop(event) {
      event.preventDefault()
      const file = event.dataTransfer.files[0]
      if (file && file.type.startsWith('image/')) {
        this.processFile(file)
      }
    },

    processFile(file) {
      // 验证文件大小
      if (file.size > 5 * 1024 * 1024) {
        message.error('文件大小不能超过 5MB')
        return
      }

      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        message.error('请选择图片文件')
        return
      }

      this.selectedFile = file
      
      // 生成预览URL
      const reader = new FileReader()
      reader.onload = (e) => {
        this.previewUrl = e.target.result
      }
      reader.readAsDataURL(file)
    },

    clearFile() {
      this.selectedFile = null
      this.previewUrl = ''
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = ''
      }
    },

    async uploadFile() {
      if (!this.selectedFile) return

      this.uploading = true
      
      try {
        const formData = new FormData()
        formData.append('avatar', this.selectedFile)

        const response = await fetch('/api/upload/avatar', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('blog_token')}`
          },
          body: formData
        })

        const data = await response.json()

        if (response.ok) {
          message.success('头像上传成功')
          this.$emit('avatar-updated', data.avatar)
          this.closeModal()
        } else {
          throw new Error(data.error || '上传失败')
        }
      } catch (error) {
        console.error('上传失败:', error)
        message.error(error.message || '头像上传失败')
      } finally {
        this.uploading = false
      }
    },

    async generatePresets() {
      try {
        const response = await fetch(`/api/upload/avatar/presets?seed=${encodeURIComponent(this.avatarSeed)}`)
        const data = await response.json()
        this.presets = data.presets
      } catch (error) {
        console.error('获取预设头像失败:', error)
      }
    },

    async selectPreset(avatarUrl) {
      this.loading = true
      
      try {
        const response = await fetch('/api/upload/avatar/preset', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('blog_token')}`
          },
          body: JSON.stringify({ avatarUrl })
        })

        const data = await response.json()

        if (response.ok) {
          message.success('头像更新成功')
          this.$emit('avatar-updated', data.avatar)
          this.closeModal()
        } else {
          throw new Error(data.error || '更新失败')
        }
      } catch (error) {
        console.error('头像更新失败:', error)
        message.error(error.message || '头像更新失败')
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.avatar-uploader {
  position: relative;
  display: inline-block;
}

.current-avatar {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.current-avatar:hover {
  transform: scale(1.05);
}

.avatar-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: opacity 0.3s ease;
  font-size: 0.875rem;
  gap: 0.5rem;
}

.current-avatar:hover .avatar-overlay {
  opacity: 1;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 1rem;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: background-color 0.3s ease;
}

.close-btn:hover {
  background: #f3f4f6;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid #e5e7eb;
}

.tabs button {
  padding: 0.75rem 1.5rem;
  border: none;
  background: none;
  cursor: pointer;
  font-weight: 500;
  color: #6b7280;
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
}

.tabs button.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 0.75rem;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 1.5rem;
}

.upload-area:hover {
  border-color: #3b82f6;
  background: #f8fafc;
}

.upload-placeholder {
  color: #6b7280;
}

.upload-placeholder svg {
  margin-bottom: 1rem;
  color: #9ca3af;
}

.upload-hint {
  font-size: 0.875rem;
  color: #9ca3af;
  margin-top: 0.5rem;
}

.file-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.file-preview img {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 0.5rem;
}

.upload-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.seed-input {
  margin-bottom: 2rem;
}

.seed-input label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.seed-input input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.preset-item {
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.preset-item:hover {
  border-color: #3b82f6;
  transform: translateY(-2px);
}

.preset-item img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin-bottom: 0.75rem;
}

.preset-info h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
}

.preset-info p {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.btn-primary, .btn-secondary {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f4f6;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
  
  .preset-grid {
    grid-template-columns: 1fr;
  }
  
  .upload-actions {
    flex-direction: column;
  }
}
</style>