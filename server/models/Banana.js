import mongoose from 'mongoose'

const bananaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  symbol: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    maxlength: 5
  },
  fullName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  currentPrice: {
    type: Number,
    required: true,
    min: 0
  },
  previousPrice: {
    type: Number,
    default: function() { return this.currentPrice }
  },
  priceChange: {
    type: Number,
    default: 0
  },
  percentageChange: {
    type: Number,
    default: 0
  },
  high24h: {
    type: Number,
    default: function() { return this.currentPrice }
  },
  low24h: {
    type: Number,
    default: function() { return this.currentPrice }
  },
  volume24h: {
    type: Number,
    default: 0
  },
  marketCap: {
    type: Number,
    default: 0
  },
  volatility: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['premium', 'traditional', 'commercial', 'cooking', 'dessert', 'aromatic'],
    required: true
  },
  origin: {
    type: String,
    required: true
  },
  season: {
    type: String,
    default: 'Year-round'
  },
  nutritionScore: {
    type: Number,
    min: 0,
    max: 10,
    default: 8
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tradingStatus: {
    type: String,
    enum: ['open', 'closed', 'halted'],
    default: 'open'
  }
}, {
  timestamps: true
})

// Calculate market cap based on price and volume
bananaSchema.methods.calculateMarketCap = function() {
  this.marketCap = this.currentPrice * this.volume24h
  return this.marketCap
}

// Update price and calculate changes
bananaSchema.methods.updatePrice = function(newPrice) {
  this.previousPrice = this.currentPrice
  this.currentPrice = newPrice
  this.priceChange = newPrice - this.previousPrice
  this.percentageChange = ((this.priceChange / this.previousPrice) * 100)
  
  // Update 24h high/low
  this.high24h = Math.max(this.high24h, newPrice)
  this.low24h = Math.min(this.low24h, newPrice)
  
  // Calculate market cap
  this.calculateMarketCap()
}

// Get volatility multiplier for price simulation
bananaSchema.methods.getVolatilityMultiplier = function() {
  const multipliers = {
    low: 0.01,
    medium: 0.02,
    high: 0.04
  }
  return multipliers[this.volatility] || 0.02
}

export default mongoose.model('Banana', bananaSchema)