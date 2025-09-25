<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>发布灵感</h3>
        <button @click="$emit('close')" class="close-btn">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <form @submit.prevent="handleSubmit">
          <!-- 内容输入 -->
          <div class="form-group">
            <textarea
              v-model="form.content"
              placeholder="分享你的想法..."
              class="content-input"
              rows="4"
              maxlength="2000"
              @input="updateCharCount"
            ></textarea>
            <div class="char-count">
              {{ charCount }}/2000
            </div>
          </div>

          <!-- 图片上传 -->
          <div class="form-group">
            <div class="upload-section">
              <input
                ref="fileInput"
                type="file"
                multiple
                accept="image/*"
                @change="handleFileSelect"
                style="display: none"
              >
              
              <div class="image-preview" v-if="selectedImages.length > 0">
                <div 
                  v-for="(image, index) in selectedImages" 
                  :key="index"
                  class="image-item"
                >
                  <img :src="image.preview" :alt="`预览 ${index + 1}`">
                  <button 
                    type="button"
                    @click="removeImage(index)" 
                    class="remove-image"
                  >
                    <i class="fas fa-times"></i>
                  </button>
                </div>
                
                <button 
                  v-if="selectedImages.length < 9"
                  type="button"
                  @click="$refs.fileInput.click()" 
                  class="add-more-btn"
                >
                  <i class="fas fa-plus"></i>
                </button>
              </div>

              <button 
                v-else
                type="button"
                @click="$refs.fileInput.click()" 
                class="upload-btn"
              >
                <i class="fas fa-image"></i>
                添加图片
              </button>
            </div>
          </div>

          <!-- 标签输入 -->
          <div class="form-group">
            <div class="tags-input">
              <div class="tags-display">
                <span 
                  v-for="tag in form.tags" 
                  :key="tag"
                  class="tag-item"
                >
                  #{{ tag }}
                  <button 
                    type="button"
                    @click="removeTag(tag)"
                    class="remove-tag"
                  >
                    <i class="fas fa-times"></i>
                  </button>
                </span>
              </div>
              <input
                v-model="tagInput"
                @keyup.enter="addTag"
                @keyup.space="addTag"
                placeholder="添加标签（按回车或空格确认）"
                class="tag-input"
              >
            </div>
          </div>

          <!-- 位置输入 -->
          <div class="form-group">
            <div class="location-input">
              <i class="fas fa-map-marker-alt"></i>
              <input
                v-model="form.location"
                placeholder="添加位置（可选）"
                class="location-field"
              >
            </div>
          </div>

          <!-- 隐私设置 -->
          <div class="form-group">
            <div class="privacy-setting">
              <label class="privacy-label">
                <input
                  v-model="form.is_public"
                  type="checkbox"
                  class="privacy-checkbox"
                >
                <span class="checkmark"></span>
                公开发布
              </label>
              <span class="privacy-hint">
                {{ form.is_public ? '所有人都可以看到' : '仅自己可见' }}
              </span>
            </div>
          </div>
        </form>
      </div>

      <div class="modal-footer">
        <button 
          type="button" 
          @click="$emit('close')" 
          class="cancel-btn"
        >
          取消
        </button>
        <button 
          @click="handleSubmit" 
          :disabled="!canSubmit || loading"
          class="submit-btn"
        >
          <i v-if="loading" class="fas fa-spinner fa-spin"></i>
          <span>{{ loading ? '发布中...' : '发布' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { inspirationsAPI } from '../utils/inspirations-api'

export default {
  name: 'CreateInspirationModal',
  emits: ['close', 'created'],
  data() {
    return {
      form: {
        content: '',
        tags: [],
        location: '',
        is_public: true
      },
      selectedImages: [],
      tagInput: '',
      loading: false,
      charCount: 0
    }
  },
  computed: {
    canSubmit() {
      return this.form.content.trim().length > 0 && !this.loading
    }
  },
  methods: {
    handleOverlayClick(e) {
      if (e.target === e.currentTarget) {
        this.$emit('close')
      }
    },

    updateCharCount() {
      this.charCount = this.form.content.length
    },

    handleFileSelect(event) {
      const files = Array.from(event.target.files)
      const remainingSlots = 9 - this.selectedImages.length
      const filesToAdd = files.slice(0, remainingSlots)

      filesToAdd.forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader()
          reader.onload = (e) => {
            this.selectedImages.push({
              file,
              preview: e.target.result
            })
          }
          reader.readAsDataURL(file)
        }
      })

      // 清空input，允许重复选择同一文件
      event.target.value = ''
    },

    removeImage(index) {
      this.selectedImages.splice(index, 1)
    },

    addTag() {
      const tag = this.tagInput.trim().replace(/^#+/, '').replace(/#+$/, '')
      if (tag && !this.form.tags.includes(tag) && this.form.tags.length < 10) {
        this.form.tags.push(tag)
        this.tagInput = ''
      }
    },

    removeTag(tag) {
      const index = this.form.tags.indexOf(tag)
      if (index > -1) {
        this.form.tags.splice(index, 1)
      }
    },

    async handleSubmit() {
      if (!this.canSubmit) return

      this.loading = true

      try {
        const formData = new FormData()
        formData.append('content', this.form.content.trim())
        formData.append('tags', JSON.stringify(this.form.tags))
        formData.append('location', this.form.location)
        formData.append('is_public', this.form.is_public)

        // 添加图片文件
        this.selectedImages.forEach((image, index) => {
          formData.append('images', image.file)
        })

        const response = await inspirationsAPI.createInspiration(formData)
        
        this.$emit('created', response.data)
        
      } catch (error) {
        console.error('发布灵感失败:', error)
        this.$message?.error(error.response?.data?.message || '发布失败')
      } finally {
        this.loading = false
      }
    }
  },
  mounted() {
    // 自动聚焦到内容输入框
    this.$nextTick(() => {
      const textarea = this.$el.querySelector('.content-input')
      if (textarea) {
        textarea.focus()
      }
    })

    // ESC键关闭弹窗
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        this.$emit('close')
      }
    }
    document.addEventListener('keydown', handleEsc)
    this.$once('hook:beforeDestroy', () => {
      document.removeEventListener('keydown', handleEsc)
    })
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  color: #666;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: #f0f0f0;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.form-group {
  margin-bottom: 1.5rem;
}

.content-input {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  font-size: 1rem;
  line-height: 1.5;
  resize: vertical;
  min-height: 100px;
  outline: none;
  transition: border-color 0.3s ease;
}

.content-input:focus {
  border-color: #667eea;
}

.char-count {
  text-align: right;
  font-size: 0.8rem;
  color: #666;
  margin-top: 0.5rem;
}

.upload-section {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
  transition: all 0.3s ease;
}

.upload-section:hover {
  border-color: #667eea;
  background: #f8f9ff;
}

.upload-btn {
  background: none;
  border: none;
  color: #667eea;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 auto;
  padding: 0.5rem;
}

.image-preview {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 0.5rem;
}

.image-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-image {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
}

.add-more-btn {
  aspect-ratio: 1;
  border: 2px dashed #ddd;
  border-radius: 8px;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: all 0.3s ease;
}

.add-more-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.tags-input {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 0.5rem;
  min-height: 40px;
}

.tags-display {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.tag-item {
  background: #667eea;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.remove-tag {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0;
  font-size: 0.7rem;
}

.tag-input {
  border: none;
  outline: none;
  width: 100%;
  font-size: 0.9rem;
}

.location-input {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 0.75rem;
}

.location-input i {
  color: #666;
}

.location-field {
  border: none;
  outline: none;
  flex: 1;
  font-size: 0.9rem;
}

.privacy-setting {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.privacy-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 500;
}

.privacy-checkbox {
  width: 18px;
  height: 18px;
}

.privacy-hint {
  font-size: 0.8rem;
  color: #666;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.cancel-btn {
  background: none;
  border: 1px solid #ddd;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background: #f0f0f0;
}

.submit-btn {
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

@media (max-width: 768px) {
  .modal-overlay {
    padding: 0;
  }
  
  .modal-content {
    height: 100vh;
    max-height: none;
    border-radius: 0;
  }
  
  .image-preview {
    grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  }
}
</style>