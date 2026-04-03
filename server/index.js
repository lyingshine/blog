const express = require('express')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const session = require('express-session')
const path = require('path')
const http = require('http')
require('dotenv').config({ path: path.resolve(__dirname, '.env') })

// Routes
const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/users')
const articleRoutes = require('./routes/articles')
const statusRoutes = require('./routes/statuses')
const adminRoutes = require('./routes/admin')
const notificationRoutes = require('./routes/notifications')

// DB
const pool = require('./db/pool')
const ensureSchema = require('./db/initSchema')

// Utils
const cache = require('./utils/cache')
const scheduler = require('./utils/scheduler')
const telemetry = require('./utils/telemetry')

const app = express()

const corsOriginsFromEnv = String(process.env.CORS_ORIGINS || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean)

const allowAllOriginsInProd = String(process.env.CORS_ALLOW_ALL || '').toLowerCase() === 'true'

// Middleware
app.use(cors({
  origin(origin, callback) {
    // Requests like curl/Postman may have no Origin header.
    if (!origin) return callback(null, true)

    // Development defaults to allow all for easier local/mobile testing.
    if (process.env.NODE_ENV !== 'production') return callback(null, true)

    // Explicit opt-in to allow all origins in production.
    if (allowAllOriginsInProd) return callback(null, true)

    // Production allow-list from env.
    if (corsOriginsFromEnv.includes(origin)) return callback(null, true)

    return callback(null, false)
  },
  credentials: true
}))

// Rate limiting for general API
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  skip: (req, res) => {
    // Skip rate limiting for admin endpoints since they're protected by basic auth
    if (req.url.startsWith('/api/admin')) {
      return true
    }

    // Skip rate limiting for local development and simulator
    const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress ||
               (req.connection.socket ? req.connection.socket.remoteAddress : null)
    if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') {
      return true // Skip rate limiting for localhost
    }

    return false
  }
})

// No separate admin limiter needed since we're skipping admin routes
app.use(generalLimiter)

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret_for_dev',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}))

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(telemetry.middleware)

// Cache middleware
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store')
  next()
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/articles', articleRoutes)
app.use('/api/statuses', statusRoutes)
app.use('/api/admin', adminRoutes) // Apply without additional rate limiting
app.use('/api/notifications', notificationRoutes)

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')))
  app.get('*', (req, res, next) => {
    // Do not fallback static asset requests to index.html.
    // If a hashed css/js file is missing, return 404 so the issue is visible.
    if (path.extname(req.path)) {
      return res.status(404).end()
    }

    // API routes should never be handled by SPA fallback.
    if (req.path.startsWith('/api/')) {
      return next()
    }

    res.sendFile(path.join(__dirname, '../dist/index.html'))
  })
}

const PORT = process.env.PORT || 3000

async function startServer({ port = PORT, onStarted } = {}) {
  await ensureSchema()

  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      console.log(`Server running on port ${port}`)
      console.log('Simulator is idle by default. Control it from Admin page.')
      if (typeof onStarted === 'function') onStarted(server)
      resolve(server)
    })

    server.on('error', reject)
  })
}

if (require.main === module) {
  startServer()
    .then((server) => {
      // Graceful shutdown
      process.on('SIGTERM', () => {
        console.log('SIGTERM received, shutting down gracefully')
        server.close(async () => {
          console.log('Server closed')
          await pool.end()
          console.log('Database connections closed')
          process.exit(0)
        })

        // Force close after 10 seconds if needed
        setTimeout(() => {
          console.error('Could not close connections in time, forcefully shutting down')
          process.exit(1)
        }, 10000)
      })

      // Error handling
      process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason)
        server.close(() => {
          process.exit(1)
        })
      })

      process.on('uncaughtException', (err) => {
        console.error('Uncaught Exception:', err)
        process.exit(1)
      })
    })
    .catch((error) => {
      console.error('Server startup failed:', error)
      process.exit(1)
    })
}

module.exports = app
module.exports.startServer = startServer
