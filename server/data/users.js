const pool = require('../db/pool')
const bcrypt = require('bcryptjs')
const fs = require('fs')
const path = require('path')

const NEW_USERS_FILE = path.join(__dirname, 'new_users.json')

let newUsers = []
const SPECIAL_ADMIN_USERNAMES = new Set(['lyingshine'])
let userSchemaReadyPromise = null

try {
  if (fs.existsSync(NEW_USERS_FILE)) {
    newUsers = JSON.parse(fs.readFileSync(NEW_USERS_FILE, 'utf-8'))
  }
} catch (e) {
  newUsers = []
}

async function ensureUserSchema() {
  if (userSchemaReadyPromise) return userSchemaReadyPromise

  userSchemaReadyPromise = (async () => {
    try {
      await pool.write("ALTER TABLE users ADD COLUMN headline VARCHAR(120) DEFAULT ''")
    } catch (error) {
      if (error?.code !== 'ER_DUP_FIELDNAME') {
        throw error
      }
    }
  })()

  return userSchemaReadyPromise
}

const findByUsername = async (username) => {
  await ensureUserSchema()
  const [rows] = await pool.read('SELECT * FROM users WHERE username = ? LIMIT 1', [username])
  return applySpecialRoles(rows[0] || null)
}

const findByEmail = async (email) => {
  await ensureUserSchema()
  const [rows] = await pool.read('SELECT * FROM users WHERE email = ? LIMIT 1', [email])
  return applySpecialRoles(rows[0] || null)
}

const findById = async (id) => {
  await ensureUserSchema()
  const [rows] = await pool.read('SELECT * FROM users WHERE id = ? LIMIT 1', [id])
  return applySpecialRoles(rows[0] || null)
}

const createUser = async ({ username, email, password }) => {
  await ensureUserSchema()
  const hashedPassword = await bcrypt.hash(password, 10)
  const role = resolveInitialRole(username)
  const [result] = await pool.write(
    'INSERT INTO users (username, email, password, avatar, role, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
    [username, email, hashedPassword, username.charAt(0).toUpperCase(), role]
  )
  const newUser = await findById(result.insertId)
  newUsers.push(newUser)
  persistNewUsers()
  return newUser
}

function resolveInitialRole(username) {
  return SPECIAL_ADMIN_USERNAMES.has(String(username || '').toLowerCase()) ? 'admin' : 'user'
}

function persistNewUsers() {
  try {
    fs.writeFileSync(NEW_USERS_FILE, JSON.stringify(newUsers, null, 2))
  } catch (e) {
    console.error('Failed to save new user:', e)
  }
}

async function updateUserRole(id, role) {
  await pool.write('UPDATE users SET role = ? WHERE id = ?', [role, id])
  const cached = newUsers.find((user) => user.id === id)
  if (cached) {
    cached.role = role
    persistNewUsers()
  }
}

async function applySpecialRoles(user) {
  if (!user) return null
  const targetRole = resolveInitialRole(user.username)
  if (targetRole !== user.role) {
    await updateUserRole(user.id, targetRole)
    user.role = targetRole
  }
  return user
}

const verifyPassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword)
}

const sanitizeUser = (user) => {
  if (!user) return null
  const { password, ...safeUser } = user
  return safeUser
}

const getUsers = async (page = 1, limit = 50) => {
  await ensureUserSchema()
  const offset = (page - 1) * limit
  const [rows] = await pool.read(
    'SELECT id, username, email, avatar, role, headline, bio, location, company, website, created_at FROM users ORDER BY id DESC LIMIT ? OFFSET ?',
    [parseInt(limit), offset]
  )
  const [[{ total }]] = await pool.read('SELECT COUNT(*) as total FROM users')
  return { users: rows, total }
}

const trimField = (value, maxLen) => {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, maxLen)
}

const updateUserProfile = async (id, payload = {}) => {
  await ensureUserSchema()

  const headline = trimField(payload.headline, 120)
  const bio = trimField(payload.bio, 500)
  const location = trimField(payload.location, 100)
  const company = trimField(payload.company, 200)
  const website = trimField(payload.website, 300)

  await pool.write(
    'UPDATE users SET headline = ?, bio = ?, location = ?, company = ?, website = ? WHERE id = ?',
    [headline, bio, location, company, website, id]
  )

  const cached = newUsers.find((user) => user.id === id)
  if (cached) {
    cached.headline = headline
    cached.bio = bio
    cached.location = location
    cached.company = company
    cached.website = website
    persistNewUsers()
  }

  return findById(id)
}

const updateUserAvatar = async (id, avatar) => {
  await ensureUserSchema()
  const normalizedAvatar = trimField(avatar, 300)

  await pool.write('UPDATE users SET avatar = ? WHERE id = ?', [normalizedAvatar, id])

  const cached = newUsers.find((user) => user.id === id)
  if (cached) {
    cached.avatar = normalizedAvatar
    persistNewUsers()
  }

  return findById(id)
}

module.exports = {
  findByUsername,
  findByEmail,
  findById,
  createUser,
  verifyPassword,
  sanitizeUser,
  getUsers,
  updateUserProfile,
  updateUserAvatar
}
