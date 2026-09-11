import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { connectDB } from '../config/database.js'
import Banana from '../models/Banana.js'
import User from '../models/User.js'
import PriceHistory from '../models/PriceHistory.js'

dotenv.config()

const bananaData = [
  {
    name: 'Palayankodan',
    symbol: 'PLK',
    fullName: 'Palayankodan Premium',
    description: "Kerala's premium banana variety known for its exceptional taste and nutritional value. Grown primarily in Wayanad's fertile hills.",
    image: '/images/bananas/palayankodan.jpg',
    currentPrice: 128.40,
    category: 'premium',
    origin: 'Wayanad',
    season: 'Year-round',
    nutritionScore: 9.2,
    volatility: 'medium'
  },
  {
    name: 'Njalipoovan',
    symbol: 'NJP',
    fullName: 'Njalipoovan Traditional',
    description: 'Traditional Kerala banana with distinctive sweet flavor and cultural significance. A staple in Kerala households for generations.',
    image: '/images/bananas/njalipoovan.jpg',
    currentPrice: 95.20,
    category: 'traditional',
    origin: 'Palakkad',
    season: 'Year-round',
    nutritionScore: 8.8,
    volatility: 'low'
  },
  {
    name: 'Poovan',
    symbol: 'POV',
    fullName: 'Poovan Classic',
    description: 'Popular commercial variety with consistent quality and good shelf life. Widely cultivated across Kerala plains.',
    image: '/images/bananas/poovan.jpg',
    currentPrice: 112.80,
    category: 'commercial',
    origin: 'Thrissur',
    season: 'Peak: Nov-Mar',
    nutritionScore: 8.2,
    volatility: 'medium'
  },
  {
    name: 'Robusta',
    symbol: 'ROB',
    fullName: 'Robusta Giant',
    description: 'Large-sized banana variety with robust flavor, ideal for cooking applications. Perfect for traditional Kerala dishes.',
    image: '/images/bananas/robusta.jpg',
    currentPrice: 145.80,
    category: 'cooking',
    origin: 'Idukki',
    season: 'Peak: Jan-May',
    nutritionScore: 8.5,
    volatility: 'high'
  },
  {
    name: 'Rasthali',
    symbol: 'RST',
    fullName: 'Rasthali Deluxe',
    description: 'Aromatic banana variety prized for its unique fragrance and taste profile. Often used in religious ceremonies.',
    image: '/images/bananas/rasthali.jpg',
    currentPrice: 89.50,
    category: 'aromatic',
    origin: 'Kottayam',
    season: 'Year-round',
    nutritionScore: 9.0,
    volatility: 'low'
  },
  {
    name: 'Kadhali',
    symbol: 'KDH',
    fullName: 'Kadhali Special',
    description: 'Compact banana variety with intense sweetness, perfect for desserts and traditional Kerala sweets.',
    image: '/images/bananas/kadhali.jpg',
    currentPrice: 78.90,
    category: 'dessert',
    origin: 'Alappuzha',
    season: 'Peak: Jun-Oct',
    nutritionScore: 8.9,
    volatility: 'medium'
  },
  {
    name: 'Nendran',
    symbol: 'NEN',
    fullName: 'Nendran Royal',
    description: 'The king of Kerala bananas! Large, yellow variety perfect for chips and traditional recipes. A cultural icon.',
    image: '/images/bananas/nendran.jpg',
    currentPrice: 156.30,
    category: 'premium',
    origin: 'Thrissur',
    season: 'Year-round',
    nutritionScore: 9.4,
    volatility: 'low'
  },
  {
    name: 'Malbhog',
    symbol: 'MAL',
    fullName: 'Malbhog Elite',
    description: 'Exotic banana variety with creamy texture and rich flavor. Considered a delicacy in traditional Kerala cuisine.',
    image: '/images/bananas/malbhog.jpg',
    currentPrice: 134.75,
    category: 'premium',
    origin: 'Wayanad',
    season: 'Peak: Dec-Apr',
    nutritionScore: 8.7,
    volatility: 'medium'
  }
]

const defaultUsers = [
  {
    username: 'pazhampro',
    email: 'pazhampro@gmail.com',
    password: 'password123',
    virtualBalance: 15000
  },
  {
    username: 'bananatrade',
    email: 'banana@trade.com',
    password: 'password123',
    virtualBalance: 25000
  }
]

// Generate realistic price history for the last 30 days
const generatePriceHistory = (banana) => {
  const history = []
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30) // 30 days ago
  
  let currentPrice = banana.currentPrice * 0.9 // Start 10% lower
  const volatilityMultiplier = banana.volatility === 'low' ? 0.01 : 
                              banana.volatility === 'medium' ? 0.02 : 0.04
  
  // Generate 5-minute intervals for the last 30 days
  for (let i = 0; i < 30 * 24 * 12; i++) { // 30 days * 24 hours * 12 (5-min intervals)
    const timestamp = new Date(startDate.getTime() + (i * 5 * 60 * 1000))
    
    // Add some randomness with trend towards current price
    const randomChange = (Math.random() - 0.5) * 2 * volatilityMultiplier
    const trendTowardsTarget = (banana.currentPrice - currentPrice) * 0.001
    
    currentPrice *= (1 + randomChange + trendTowardsTarget)
    currentPrice = Math.max(currentPrice, banana.currentPrice * 0.7) // Floor
    currentPrice = Math.min(currentPrice, banana.currentPrice * 1.3) // Ceiling
    
    history.push({
      bananaId: null, // Will be set when banana is created
      price: Math.round(currentPrice * 100) / 100,
      volume: Math.floor(Math.random() * 50) + 10,
      timestamp: timestamp,
      interval: '5m'
    })
  }
  
  return history
}

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...')
    
    // Connect to database if not already connected
    if (mongoose.connection.readyState !== 1) {
      await connectDB()
    }
    
    // Clear existing data
    console.log('🧹 Clearing existing data...')
    await Promise.all([
      Banana.deleteMany({}),
      User.deleteMany({}),
      PriceHistory.deleteMany({})
    ])
    
    // Create bananas
    console.log('🍌 Creating banana varieties...')
    const createdBananas = []
    
    for (const bananaInfo of bananaData) {
      // Set initial price properties
      bananaInfo.previousPrice = bananaInfo.currentPrice
      bananaInfo.priceChange = 0
      bananaInfo.percentageChange = 0
      bananaInfo.high24h = bananaInfo.currentPrice * 1.05
      bananaInfo.low24h = bananaInfo.currentPrice * 0.95
      bananaInfo.volume24h = Math.floor(Math.random() * 1000) + 500
      bananaInfo.marketCap = bananaInfo.currentPrice * bananaInfo.volume24h
      
      const banana = await Banana.create(bananaInfo)
      createdBananas.push(banana)
      console.log(`  ✅ Created ${banana.name} (${banana.symbol}) at ₹${banana.currentPrice}`)
    }
    
    // Generate price history for each banana
    console.log('📊 Generating price history...')
    for (const banana of createdBananas) {
      const history = generatePriceHistory(banana)
      
      // Set banana ID for each history point
      const historyWithBananaId = history.map(point => ({
        ...point,
        bananaId: banana._id
      }))
      
      await PriceHistory.insertMany(historyWithBananaId)
      console.log(`  📈 Generated ${history.length} price points for ${banana.name}`)
    }
    
    // Create default users
    console.log('👥 Creating default users...')
    for (const userData of defaultUsers) {
      const user = await User.create(userData)
      console.log(`  👤 Created user: ${user.username}`)
    }
    
    // Update banana prices based on latest history
    console.log('💰 Updating current banana prices...')
    for (const banana of createdBananas) {
      const latestPrice = await PriceHistory
        .findOne({ bananaId: banana._id })
        .sort({ timestamp: -1 })
      
      if (latestPrice) {
        banana.updatePrice(latestPrice.price)
        await banana.save()
      }
    }
    
    console.log('✅ Database seeding completed successfully!')
    console.log(`
📊 Seeding Summary:
🍌 Bananas: ${createdBananas.length} varieties
👥 Users: ${defaultUsers.length} accounts  
📈 Price Points: ${createdBananas.length * 30 * 24 * 12} historical records
💰 Total Market Cap: ₹${createdBananas.reduce((sum, b) => sum + b.marketCap, 0).toFixed(2)}
`)
    
    return { createdBananas, defaultUsers }
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    throw error
  }
}

// Run seeding if this file is executed directly
const isDirectExecution = process.argv[1] && (
  process.argv[1].endsWith('seedData.js') || 
  process.argv[1].endsWith('seedData')
)

if (isDirectExecution) {
  seedDatabase().then(() => process.exit(0)).catch(() => process.exit(1))
}

export { seedDatabase, bananaData, generatePriceHistory }