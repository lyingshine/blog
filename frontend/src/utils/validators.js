import { VALIDATION_RULES } from '../constants'

// 验证用户名
export const validateUsername = (username) => {
  const result = new ValidationResult()
  
  if (!username || username.trim().length === 0) {
    result.addError('username', '用户名不能为空')
    return result
  }
  
  const trimmedUsername = username.trim()
  
  if (trimmedUsername.length < VALIDATION_RULES.USERNAME.MIN_LENGTH) {
    result.addError('username', `用户名至少需要${VALIDATION_RULES.USERNAME.MIN_LENGTH}个字符`)
  }
  
  if (trimmedUsername.length > VALIDATION_RULES.USERNAME.MAX_LENGTH) {
    result.addError('username', `用户名不能超过${VALIDATION_RULES.USERNAME.MAX_LENGTH}个字符`)
  }
  
  if (!VALIDATION_RULES.USERNAME.PATTERN.test(trimmedUsername)) {
    result.addError('username', '用户名只能包含字母、数字和下划线')
  }
  
  return result
}

// 验证邮箱
export const validateEmail = (email) => {
  const result = new ValidationResult()
  
  if (!email || email.trim().length === 0) {
    result.addError('email', '邮箱不能为空')
    return result
  }
  
  const trimmedEmail = email.trim()
  
  if (!VALIDATION_RULES.EMAIL.PATTERN.test(trimmedEmail)) {
    result.addError('email', '请输入有效的邮箱地址')
  }
  
  return result
}

// 验证密码
export const validatePassword = (password) => {
  const result = new ValidationResult()
  
  if (!password) {
    result.addError('password', '密码不能为空')
    return result
  }
  
  if (password.length < VALIDATION_RULES.PASSWORD.MIN_LENGTH) {
    result.addError('password', `密码至少需要${VALIDATION_RULES.PASSWORD.MIN_LENGTH}个字符`)
  }
  
  if (password.length > VALIDATION_RULES.PASSWORD.MAX_LENGTH) {
    result.addError('password', `密码不能超过${VALIDATION_RULES.PASSWORD.MAX_LENGTH}个字符`)
  }
  
  return result
}

// 验证确认密码
export const validateConfirmPassword = (password, confirmPassword) => {
  const result = new ValidationResult()
  
  if (!confirmPassword) {
    result.addError('confirmPassword', '请确认密码')
    return result
  }
  
  if (password !== confirmPassword) {
    result.addError('confirmPassword', '两次输入的密码不一致')
  }
  
  return result
}

// 验证文章标题
export const validateTitle = (title) => {
  const result = new ValidationResult()
  
  if (!title || title.trim().length === 0) {
    result.addError('title', '标题不能为空')
    return result
  }
  
  const trimmedTitle = title.trim()
  
  if (trimmedTitle.length < VALIDATION_RULES.TITLE.MIN_LENGTH) {
    result.addError('title', `标题至少需要${VALIDATION_RULES.TITLE.MIN_LENGTH}个字符`)
  }
  
  if (trimmedTitle.length > VALIDATION_RULES.TITLE.MAX_LENGTH) {
    result.addError('title', `标题不能超过${VALIDATION_RULES.TITLE.MAX_LENGTH}个字符`)
  }
  
  return result
}

// 验证文章内容
export const validateContent = (content) => {
  const result = new ValidationResult()
  
  if (!content || content.trim().length === 0) {
    result.addError('content', '内容不能为空')
    return result
  }
  
  const trimmedContent = content.trim()
  
  if (trimmedContent.length < VALIDATION_RULES.CONTENT.MIN_LENGTH) {
    result.addError('content', `内容至少需要${VALIDATION_RULES.CONTENT.MIN_LENGTH}个字符`)
  }
  
  if (trimmedContent.length > VALIDATION_RULES.CONTENT.MAX_LENGTH) {
    result.addError('content', `内容不能超过${VALIDATION_RULES.CONTENT.MAX_LENGTH}个字符`)
  }
  
  return result
}

// 验证文件上传
export const validateFile = (file) => {
  const result = new ValidationResult()
  
  if (!file) {
    result.addError('file', '请选择文件')
    return result
  }
  
  // 检查文件大小
  if (file.size > UPLOAD_CONFIG.MAX_SIZE) {
    result.addError('file', `文件大小不能超过${UPLOAD_CONFIG.MAX_SIZE / 1024 / 1024}MB`)
  }
  
  // 检查文件类型
  if (!UPLOAD_CONFIG.ALLOWED_TYPES.includes(file.type)) {
    result.addError('file', '不支持的文件类型')
  }
  
  return result
}

// 验证登录表单
export const validateLoginForm = (formData) => {
  const result = new ValidationResult()
  
  // 验证用户名或邮箱
  if (!formData.username || formData.username.trim().length === 0) {
    result.addError('username', '请输入用户名或邮箱')
  }
  
  // 验证密码
  const passwordResult = validatePassword(formData.password)
  if (!passwordResult.isValid) {
    Object.assign(result.errors, passwordResult.errors)
    result.isValid = false
  }
  
  return result
}

// 验证注册表单
export const validateRegisterForm = (formData) => {
  const result = new ValidationResult()
  
  // 验证用户名
  const usernameResult = validateUsername(formData.username)
  if (!usernameResult.isValid) {
    Object.assign(result.errors, usernameResult.errors)
    result.isValid = false
  }
  
  // 验证邮箱
  const emailResult = validateEmail(formData.email)
  if (!emailResult.isValid) {
    Object.assign(result.errors, emailResult.errors)
    result.isValid = false
  }
  
  // 验证密码
  const passwordResult = validatePassword(formData.password)
  if (!passwordResult.isValid) {
    Object.assign(result.errors, passwordResult.errors)
    result.isValid = false
  }
  
  // 验证确认密码
  const confirmPasswordResult = validateConfirmPassword(formData.password, formData.confirmPassword)
  if (!confirmPasswordResult.isValid) {
    Object.assign(result.errors, confirmPasswordResult.errors)
    result.isValid = false
  }
  
  return result
}

// 验证文章表单
export const validateArticleForm = (formData) => {
  const result = new ValidationResult()
  
  // 验证标题
  const titleResult = validateTitle(formData.title)
  if (!titleResult.isValid) {
    Object.assign(result.errors, titleResult.errors)
    result.isValid = false
  }
  
  // 验证内容
  const contentResult = validateContent(formData.content)
  if (!contentResult.isValid) {
    Object.assign(result.errors, contentResult.errors)
    result.isValid = false
  }
  
  // 验证分类
  if (!formData.category || formData.category.trim().length === 0) {
    result.addError('category', '请选择分类')
  }
  
  return result
}

// 通用验证函数
export const validate = (value, rules) => {
  const result = new ValidationResult()
  
  for (const rule of rules) {
    const ruleResult = rule(value)
    if (!ruleResult.isValid) {
      Object.assign(result.errors, ruleResult.errors)
      result.isValid = false
    }
  }
  
  return result
}

// 验证规则工厂函数
export const createValidationRules = {
  required: (message = '此字段为必填项') => (value) => {
    const result = new ValidationResult()
    if (!value || (typeof value === 'string' && value.trim().length === 0)) {
      result.addError('required', message)
    }
    return result
  },
  
  minLength: (min, message) => (value) => {
    const result = new ValidationResult()
    if (value && value.length < min) {
      result.addError('minLength', message || `至少需要${min}个字符`)
    }
    return result
  },
  
  maxLength: (max, message) => (value) => {
    const result = new ValidationResult()
    if (value && value.length > max) {
      result.addError('maxLength', message || `不能超过${max}个字符`)
    }
    return result
  },
  
  pattern: (regex, message) => (value) => {
    const result = new ValidationResult()
    if (value && !regex.test(value)) {
      result.addError('pattern', message || '格式不正确')
    }
    return result
  }
}