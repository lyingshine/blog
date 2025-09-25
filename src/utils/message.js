import { createApp } from 'vue'
import Message from '../components/Message.vue'

let messageContainer = null
let messageInstances = []

// 创建消息容器
function createMessageContainer() {
  if (!messageContainer) {
    messageContainer = document.createElement('div')
    messageContainer.id = 'message-container'
    messageContainer.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      z-index: 9999;
      pointer-events: none;
    `
    document.body.appendChild(messageContainer)
  }
  return messageContainer
}

// 显示消息
function showMessage(options) {
  const container = createMessageContainer()
  
  // 创建消息元素
  const messageEl = document.createElement('div')
  messageEl.style.cssText = `
    pointer-events: auto;
    margin-bottom: 10px;
  `
  
  container.appendChild(messageEl)
  
  // 创建Vue应用实例
  const app = createApp(Message, {
    ...options,
    onClose: () => {
      // 移除消息
      app.unmount()
      if (messageEl.parentNode) {
        messageEl.parentNode.removeChild(messageEl)
      }
      
      // 移除实例引用
      const index = messageInstances.indexOf(app)
      if (index > -1) {
        messageInstances.splice(index, 1)
      }
      
      // 如果没有消息了，移除容器
      if (messageInstances.length === 0 && messageContainer) {
        document.body.removeChild(messageContainer)
        messageContainer = null
      }
    }
  })
  
  app.mount(messageEl)
  messageInstances.push(app)
  
  return app
}

// 消息类型方法
const message = {
  success(text, options = {}) {
    return showMessage({
      type: 'success',
      message: text,
      ...options
    })
  },
  
  error(text, options = {}) {
    return showMessage({
      type: 'error',
      message: text,
      duration: 5000, // 错误消息显示更久
      ...options
    })
  },
  
  warning(text, options = {}) {
    return showMessage({
      type: 'warning',
      message: text,
      ...options
    })
  },
  
  info(text, options = {}) {
    return showMessage({
      type: 'info',
      message: text,
      ...options
    })
  }
}

// 清除所有消息
message.clear = () => {
  messageInstances.forEach(app => {
    app.unmount()
  })
  messageInstances = []
  
  if (messageContainer) {
    document.body.removeChild(messageContainer)
    messageContainer = null
  }
}

export default message