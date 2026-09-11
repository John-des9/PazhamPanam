import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import Banana from '../models/Banana.js'
import { seedDatabase } from '../scripts/seedData.js'

let memoryServerInstance = null

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pazham-panam'
  
  // Try connecting to external / local MongoDB first
  try {
    console.log(`🍃 Attempting connection to MongoDB at: ${uri}...`)
    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 2500, // 2.5 second timeout
    })

    console.log(`🍃 MongoDB Connected: ${conn.connection.host}`)
    console.log(`📦 Database: ${conn.connection.name}`)
  } catch (err) {
    console.warn(`⚠️ Could not connect to MongoDB on ${uri} (${err.message}).`)
    console.log(`🚀 Starting high-performance embedded in-memory MongoDB...`)
    
    try {
      memoryServerInstance = await MongoMemoryServer.create()
      const memUri = memoryServerInstance.getUri()
      
      const conn = await mongoose.connect(memUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      
      console.log(`🍃 In-Memory MongoDB Connected: ${conn.connection.host}`)
      console.log(`📦 Database: ${conn.connection.name}`)
    } catch (memErr) {
      console.error('❌ Failed to start In-Memory MongoDB:', memErr.message)
      throw memErr
    }
  }

  // Set up connection event listeners
  mongoose.connection.on('error', (error) => {
    console.error('❌ MongoDB connection error:', error)
  })
  
  mongoose.connection.on('disconnected', () => {
    console.log('📦 MongoDB disconnected')
  })
  
  mongoose.connection.on('reconnected', () => {
    console.log('🔄 MongoDB reconnected')
  })

  // Auto-seed if database is empty
  try {
    const count = await Banana.countDocuments()
    if (count === 0) {
      console.log('🍌 No bananas found in database. Auto-seeding initial market data...')
      await seedDatabase()
    } else {
      console.log(`🍌 Found ${count} banana varieties already seeded in market.`)
    }
  } catch (seedErr) {
    console.error('⚠️ Auto-seed check error:', seedErr.message)
  }
}

export const getMemoryServer = () => memoryServerInstance

export default { connectDB, getMemoryServer }