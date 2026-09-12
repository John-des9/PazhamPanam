import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'

// Import routes
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import bananaRoutes from './routes/bananas.js'
import tradingRoutes from './routes/trading.js'
import marketRoutes from './routes/market.js'

// Import services
import PriceSimulationService from './services/PriceSimulationService.js'
import { connectDB, getMemoryServer } from './config/database.js'

// Load environment variables
dotenv.config()

const app = express()
const server = createServer(app)

// Socket.IO setup with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
})

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
    },
  },
}))

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}))

app.use(morgan('combined'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000, // allow active real-time updates and multiple user testing
  skip: (req) => process.env.NODE_ENV === 'development' || req.ip === '127.0.0.1' || req.ip === '::1',
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
})
app.use('/api/', limiter)

// Trading rate limit
const tradingLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 300, // allow rapid continuous trading
  skip: (req) => process.env.NODE_ENV === 'development' || req.ip === '127.0.0.1' || req.ip === '::1',
  message: {
    error: 'Eda, kooduthal trading cheyyalle! Try again in a minute.',
    code: 'TRADING_RATE_LIMIT'
  }
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Pazham Panam server is running!',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/bananas', bananaRoutes)
app.use('/api/trading', tradingLimiter, tradingRoutes)
app.use('/api/market', marketRoutes)

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error)
  
  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => err.message)
    return res.status(400).json({
      error: 'Validation failed',
      details: errors,
      message: 'Bro, data correct aanu?'
    })
  }
  
  // Mongoose duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0]
    return res.status(400).json({
      error: 'Duplicate entry',
      message: `${field} already exists da!`,
      field
    })
  }
  
  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Login cheyyittu vaa bro!'
    })
  }
  
  // Default error
  res.status(error.status || 500).json({
    error: error.message || 'Internal server error',
    message: 'Something went wrong da! 😭',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: 'Eda, ee route illa! 🤔',
    path: req.originalUrl
  })
})

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`)
  
  // Join market room for price updates
  socket.join('market')
  
  // Send initial market data
  socket.emit('market:initial', {
    message: 'Welcome to Pazham Panam! 🍌',
    timestamp: new Date().toISOString()
  })
  
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`)
  })
})

// Initialize price simulation service
let priceSimulationService

// Start database connection and simulation
const startServices = async () => {
  try {
    await connectDB()
    console.log('📊 Starting price simulation service...')
    priceSimulationService = new PriceSimulationService(io)
    priceSimulationService.start()
  } catch (err) {
    console.error('❌ Failed to initialize database and services:', err)
  }
}

startServices()

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 ${signal} received. Starting graceful shutdown...`)
  
  if (priceSimulationService) {
    priceSimulationService.stop()
  }
  
  server.close(async () => {
    console.log('🔌 HTTP server closed')
    
    try {
      await mongoose.connection.close()
      console.log('📦 MongoDB connection closed')

      const memServer = getMemoryServer()
      if (memServer) {
        await memServer.stop()
        console.log('📦 In-Memory MongoDB stopped')
      }
      
      console.log('✅ Graceful shutdown completed')
      process.exit(0)
    } catch (error) {
      console.error('❌ Error during shutdown:', error)
      process.exit(1)
    }
  })
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('⚠️ Forced shutdown after timeout')
    process.exit(1)
  }, 10000)
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error)
  gracefulShutdown('UNCAUGHT_EXCEPTION')
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason)
  gracefulShutdown('UNHANDLED_REJECTION')
})

const PORT = process.env.PORT || 5000

server.listen(PORT, () => {
  console.log(`
🍌 Pazham Panam Server Started!
🌐 Server: http://localhost:${PORT}
📊 Socket.IO: Ready for real-time updates
🍃 Environment: ${process.env.NODE_ENV}
📅 Started: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
`)
})