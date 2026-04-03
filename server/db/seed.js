const mysql = require('mysql2/promise')
const bcrypt = require('bcryptjs')
const articleTemplates = require('../utils/articleTemplates')
const statusPool = require('../utils/statusPool')

async function initDatabase() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '132014'
  })

  await conn.query('CREATE DATABASE IF NOT EXISTS blog_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci')
  await conn.end()

  const pool = require('./pool')

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      email VARCHAR(200) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      avatar VARCHAR(300) DEFAULT 'U',
      headline VARCHAR(120) DEFAULT '',
      role VARCHAR(20) DEFAULT 'user',
      bio VARCHAR(500) DEFAULT '',
      location VARCHAR(100) DEFAULT '',
      company VARCHAR(200) DEFAULT '',
      website VARCHAR(300) DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_username (username),
      INDEX idx_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS articles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(300) NOT NULL,
      category VARCHAR(50) DEFAULT '未分类',
      read_time INT DEFAULT 5,
      excerpt TEXT,
      description TEXT,
      gradient VARCHAR(200),
      author_id INT NOT NULL,
      content LONGTEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_author (author_id),
      INDEX idx_category (category),
      INDEX idx_created (created_at),
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS statuses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      content TEXT NOT NULL,
      author_id INT NOT NULL,
      likes INT DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_author (author_id),
      INDEX idx_created (created_at),
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS daily_plans (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL UNIQUE,
      plan_json LONGTEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_daily_plans_updated_at (updated_at),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)

  console.log('Database tables created successfully')
  return pool
}

async function seedData() {
  const pool = await initDatabase()

  const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
  const pick = arr => arr[randomInt(0, arr.length - 1)]

  const firstNames = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超', '秀英', '华', '平', '刚', '桂英', '浩', '宇', '轩', '博', '思', '雨', '欣', '悦', '晨', '佳', '瑶', '雪', '琳', '彤', '菲', '鹏', '昊', '然', '睿', '泽', '翔', '天', '梓', '涵', '萱', '琪', '铭', '瑞', '凯', '俊', '嘉', '懿', '煜', '祺', '烨', '鑫', '淼', '焱']
  const lastNames = ['王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗', '梁', '宋', '郑', '谢', '韩', '唐', '冯', '于', '董', '萧', '程', '曹', '袁', '邓', '许', '傅', '沈', '曾', '彭', '吕', '苏', '卢', '蒋', '蔡', '贾', '丁', '魏', '薛', '叶', '阎', '余', '潘', '杜', '戴', '夏', '钟', '汪', '田', '任', '姜', '范', '方', '石', '姚', '谭', '廖', '邹', '熊', '金', '陆', '郝', '孔', '白', '崔', '康', '毛', '邱', '秦', '江', '史', '顾', '侯', '邵', '孟', '龙', '万', '段', '雷', '钱', '汤', '尹', '黎', '易', '常', '武', '乔', '贺', '赖', '龚', '文']
  const domains = ['gmail.com', 'outlook.com', 'qq.com', '163.com', 'foxmail.com', 'hotmail.com', 'yahoo.com', 'sina.com', '126.com', 'sohu.com']
  const bios = [
    '前端开发者，热爱开源', '全栈工程师，喜欢折腾新技术', 'UI设计师，追求极致体验',
    '后端开发，专注高并发架构', '移动端开发，探索跨平台方案', '技术爱好者，持续学习中',
    'DevOps工程师，自动化一切', '数据科学家，用数据说话', '产品经理，懂技术的PM',
    '自由职业者，远程办公中', '学生党，正在学习前端', '创业中，全栈打杂',
    '架构师，追求代码质量', '测试工程师，质量守护者', '安全研究员，白帽子一枚',
    '算法工程师，AI方向', '游戏开发，独立游戏制作人', '嵌入式开发，IoT爱好者',
    '云计算工程师，K8s玩家', '区块链开发，Web3探索者', '音视频开发，FFmpeg爱好者',
    '数据库DBA，性能调优专家', '技术作家，开源社区贡献者', '技术总监，团队管理者',
    'CTO，技术战略制定者', 'SRE，稳定性守护者', '前端架构师，工程化专家',
    'Node.js 开发者，服务端渲染实践者', 'Flutter 开发者，跨平台实践者',
    'Rust 爱好者，系统编程探索者', 'Go 开发者，云原生实践者',
    'Python 开发者，数据分析方向', 'Java 开发者，企业级应用', 'C++ 开发者，高性能计算',
    'Swift 开发者，iOS 应用开发', 'Kotlin 开发者，Android 应用开发',
    'PHP 开发者，Web 快速开发', 'Ruby 开发者，Rails 爱好者', '.NET 开发者，C# 专家'
  ]
  const headlines = [
    '把日常写成可回看的故事',
    '记录生活，也记录每次转变',
    '在这里整理想法、经验与灵感',
    '慢慢写，慢慢懂自己',
    '留给未来的自己一份注脚'
  ]
  const locations = ['北京', '上海', '深圳', '杭州', '广州', '成都', '南京', '武汉', '西安', '厦门', '长沙', '重庆', '苏州', '天津', '大连', '青岛', '郑州', '合肥', '济南', '福州', '昆明', '哈尔滨', '长春', '沈阳', '南昌', '贵阳', '南宁', '太原', '石家庄', '兰州', '海外', '远程']
  const companies = ['字节跳动', '阿里巴巴', '腾讯', '百度', '美团', '京东', '拼多多', '网易', '小米', '滴滴', '快手', 'B站', '华为', '蚂蚁集团', '自由职业', '携程', '小红书', '知乎', '豆瓣', '微博', '360', '金山', '联想', 'OPPO', 'vivo', '顺丰科技', '平安科技', '招商银行', '外企', '创业公司', '国企', '研究所', '高校', '未填写']

  const generateDate = (daysBack) => {
    const now = new Date()
    const past = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)
    return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()))
  }

  const hashedPassword = '$2b$10$vXOo3aQVFecTGG7UiVdcze2nExOdRFj00teN8MDISsTFVYWls4TBe'

  // Insert 100000 users in batches
  console.log('Inserting 100000 users...')
  const batchSize = 500
  for (let batch = 0; batch < 100000; batch += batchSize) {
    const values = []
    for (let i = batch; i < Math.min(batch + batchSize, 100000); i++) {
      const last = pick(lastNames)
      const first = pick(firstNames)
      const username = `${last}${first}${String(i + 1).padStart(5, '0')}`
      const domain = pick(domains)
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
      values.push([
        username,
        `${username}@${domain}`,
        hashedPassword,
        chars[randomInt(0, chars.length - 1)],
        pick(headlines),
        'user',
        pick(bios),
        pick(locations),
        pick(companies),
        Math.random() > 0.6 ? `https://${pick(['github', 'juejin', 'zhihu', 'twitter', 'personal'])}.com/${pick(['user', 'dev', 'coder', 'engineer'])}${randomInt(1, 9999)}` : '',
        generateDate(1095)
      ])
    }
    await pool.query(
      'INSERT INTO users (username, email, password, avatar, headline, role, bio, location, company, website, created_at) VALUES ?',
      [values]
    )
    console.log(`  Inserted users ${batch + 1}-${Math.min(batch + batchSize, 10000)}`)
  }

  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
    'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
    'linear-gradient(135deg, #f5576c 0%, #ff6b6b 100%)',
    'linear-gradient(135deg, #667eea 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
    'linear-gradient(135deg, #fbc2eb 0%, #a18cd1 100%)',
    'linear-gradient(135deg, #fdcbf1 0%, #e6dee9 100%)',
    'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
    'linear-gradient(135deg, #cfd9df 0%, #e2ebf0 100%)',
    'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
  ]

  // Insert articles - 5000 active users, each 0-5 articles
  console.log('Inserting articles...')
  const activeUsers = []
  const usedUserIds = new Set()
  while (activeUsers.length < 5000) {
    const uid = randomInt(1, 100000)
    if (!usedUserIds.has(uid)) {
      usedUserIds.add(uid)
      activeUsers.push(uid)
    }
  }

  const articleValues = []
  for (const userId of activeUsers) {
    const count = randomInt(0, 5)
    const usedIndices = new Set()
    for (let j = 0; j < count; j++) {
      let idx
      do { idx = randomInt(0, articleTemplates.length - 1) } while (usedIndices.has(idx) && usedIndices.size < articleTemplates.length)
      usedIndices.add(idx)
      const template = articleTemplates[idx]
      const username = `${pick(lastNames)}${pick(firstNames)}${String(userId).padStart(6, '0')}`
      articleValues.push([
        template.title,
        template.category,
        Math.max(1, Math.ceil(template.content.replace(/<[^>]*>/g, '').length / 500)),
        template.content.replace(/<[^>]*>/g, '').substring(0, 100) + '...',
        template.content.replace(/<[^>]*>/g, '').substring(0, 150),
        pick(gradients),
        userId,
        username,
        username.charAt(0),
        template.content,
        generateDate(400)
      ])
    }
  }

  for (let i = 0; i < articleValues.length; i += batchSize) {
    const batch = articleValues.slice(i, i + batchSize)
    await pool.query(
      'INSERT INTO articles (title, category, read_time, excerpt, description, gradient, author_id, author_username, author_avatar, content, created_at) VALUES ?',
      [batch]
    )
    console.log(`  Inserted articles ${i + 1}/${articleValues.length}`)
  }
  console.log(`  Total: ${articleValues.length} articles`)

  console.log('Inserting statuses...')
  const statusValues = []
  for (const userId of activeUsers) {
    const count = randomInt(0, 5)
    const usedIndices = new Set()
    for (let j = 0; j < count; j++) {
      let idx
      do { idx = randomInt(0, statusPool.length - 1) } while (usedIndices.has(idx) && usedIndices.size < statusPool.length)
      usedIndices.add(idx)
      const username = `${pick(lastNames)}${pick(firstNames)}${String(userId).padStart(6, '0')}`
      statusValues.push([
        statusPool[idx],
        userId,
        username,
        username.charAt(0),
        randomInt(0, 80),
        generateDate(400)
      ])
    }
  }

  for (let i = 0; i < statusValues.length; i += batchSize) {
    const batch = statusValues.slice(i, i + batchSize)
    await pool.query(
      'INSERT INTO statuses (content, author_id, author_username, author_avatar, likes, created_at) VALUES ?',
      [batch]
    )
    console.log(`  Inserted statuses ${i + 1}/${statusValues.length}`)
  }
  console.log(`  Total: ${statusValues.length} statuses`)

  await pool.end()
  console.log('Database seeding completed!')
}

seedData().catch(err => {
  console.error('Seeding failed:', err)
  process.exit(1)
})
