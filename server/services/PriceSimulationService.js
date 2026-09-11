import Banana from '../models/Banana.js'
import PriceHistory from '../models/PriceHistory.js'

class PriceSimulationService {
  constructor(io) {
    this.io = io
    this.intervalId = null
    this.isRunning = false
    this.updateInterval = parseInt(process.env.PRICE_UPDATE_INTERVAL) || 5000
    this.baseVolatility = parseFloat(process.env.MARKET_VOLATILITY) || 0.02
    this.marketSentiment = 0 // -1 (bearish) to 1 (bullish)
    this.sentimentChangeInterval = 30000 // Change sentiment every 30 seconds
    this.lastSentimentUpdate = Date.now()
  }

  start() {
    if (this.isRunning) {
      console.log('⚠️ Price simulation already running')
      return
    }

    this.isRunning = true
    console.log(`🚀 Price simulation started (${this.updateInterval}ms intervals)`)
    
    // Start immediate update
    this.updatePrices()
    
    // Set up interval
    this.intervalId = setInterval(() => {
      this.updatePrices()
    }, this.updateInterval)
  }

  stop() {
    if (!this.isRunning) {
      return
    }

    clearInterval(this.intervalId)
    this.intervalId = null
    this.isRunning = false
    console.log('🛑 Price simulation stopped')
  }

  async updatePrices() {
    try {
      // Update market sentiment occasionally
      this.updateMarketSentiment()
      
      const bananas = await Banana.find({ 
        isActive: true, 
        tradingStatus: 'open' 
      })

      const priceUpdates = []
      
      for (const banana of bananas) {
        const newPrice = this.calculateNewPrice(banana)
        const oldPrice = banana.currentPrice
        
        // Update banana price
        banana.updatePrice(newPrice)
        
        // Save to database
        await banana.save()
        
        // Add to price history
        await PriceHistory.addPricePoint(
          banana._id,
          newPrice,
          Math.floor(Math.random() * 20) + 5, // Random volume
          '5m'
        )

        priceUpdates.push({
          id: banana._id,
          symbol: banana.symbol,
          name: banana.name,
          price: newPrice,
          previousPrice: oldPrice,
          change: banana.priceChange,
          percentageChange: banana.percentageChange,
          marketCap: banana.marketCap,
          volume24h: banana.volume24h,
          direction: newPrice > oldPrice ? 'up' : newPrice < oldPrice ? 'down' : 'same'
        })
      }
      
      // Emit price updates to all connected clients
      this.io.to('market').emit('price:update', {
        timestamp: new Date().toISOString(),
        marketSentiment: this.getMarketSentimentText(),
        updates: priceUpdates
      })
      
      // Log update (only in development)
      if (process.env.NODE_ENV === 'development') {
        const avgChange = priceUpdates.reduce((sum, update) => 
          sum + Math.abs(update.percentageChange), 0) / priceUpdates.length
        console.log(`📊 Price update: ${priceUpdates.length} bananas, avg change: ${avgChange.toFixed(2)}%`)
      }

    } catch (error) {
      console.error('❌ Price simulation error:', error.message)
    }
  }

  calculateNewPrice(banana) {
    const currentPrice = banana.currentPrice
    const volatilityMultiplier = banana.getVolatilityMultiplier()
    
    // Base random change
    const randomChange = (Math.random() - 0.5) * 2 * volatilityMultiplier
    
    // Market sentiment influence (10% weight)
    const sentimentInfluence = this.marketSentiment * 0.1 * volatilityMultiplier
    
    // Time-based patterns (simulate market hours, weekends etc.)
    const timeInfluence = this.getTimeBasedInfluence()
    
    // Banana-specific trends (some bananas have momentum)
    const momentumInfluence = this.getMomentumInfluence(banana)
    
    // Mean reversion (prices tend to revert to long-term average)
    const meanReversionInfluence = this.getMeanReversionInfluence(banana)
    
    // Combine all influences
    const totalChange = randomChange + 
                       sentimentInfluence + 
                       timeInfluence + 
                       momentumInfluence + 
                       meanReversionInfluence
    
    // Apply change
    let newPrice = currentPrice * (1 + totalChange)
    
    // Ensure price doesn't go below ₹10 or above ₹1000
    newPrice = Math.max(10, Math.min(1000, newPrice))
    
    // Round to 2 decimal places
    return Math.round(newPrice * 100) / 100
  }

  updateMarketSentiment() {
    const now = Date.now()
    if (now - this.lastSentimentUpdate > this.sentimentChangeInterval) {
      // Gradually change sentiment
      const sentimentChange = (Math.random() - 0.5) * 0.3
      this.marketSentiment += sentimentChange
      
      // Keep sentiment between -1 and 1
      this.marketSentiment = Math.max(-1, Math.min(1, this.marketSentiment))
      
      this.lastSentimentUpdate = now
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🎭 Market sentiment: ${this.getMarketSentimentText()} (${this.marketSentiment.toFixed(2)})`)
      }
    }
  }

  getMarketSentimentText() {
    if (this.marketSentiment > 0.3) return 'Market is getting ripe! 🚀'
    if (this.marketSentiment > 0.1) return 'Bullish pazham vibes 📈'
    if (this.marketSentiment > -0.1) return 'Market is stable 😐'
    if (this.marketSentiment > -0.3) return 'Bearish banana market 📉'
    return 'Market going overripe! 🍌💔'
  }

  getTimeBasedInfluence() {
    const now = new Date()
    const hour = now.getHours()
    const dayOfWeek = now.getDay()
    
    // Simulate market hours effect (9 AM - 3:30 PM IST)
    let timeInfluence = 0
    
    if (hour >= 9 && hour <= 15) {
      // Market hours - more activity
      timeInfluence = (Math.random() - 0.5) * 0.005
    } else {
      // After hours - less volatility
      timeInfluence = (Math.random() - 0.5) * 0.002
    }
    
    // Weekend effect
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      timeInfluence *= 0.5 // Reduced activity on weekends
    }
    
    return timeInfluence
  }

  getMomentumInfluence(banana) {
    // If banana has been trending, continue the trend slightly
    const momentum = banana.percentageChange / 100
    return momentum * 0.1 // 10% momentum continuation
  }

  getMeanReversionInfluence(banana) {
    // Calculate deviation from some baseline (e.g., ₹100 for most bananas)
    const baselinePrice = 100
    const deviation = (banana.currentPrice - baselinePrice) / baselinePrice
    
    // Pull back towards baseline (mean reversion)
    return -deviation * 0.01 // 1% reversion force
  }

  // Get current market status for API endpoints
  getMarketStatus() {
    return {
      sentiment: this.marketSentiment,
      sentimentText: this.getMarketSentimentText(),
      isRunning: this.isRunning,
      updateInterval: this.updateInterval,
      lastUpdate: new Date().toISOString()
    }
  }

  // Manual price update trigger (for testing)
  async triggerUpdate() {
    if (this.isRunning) {
      await this.updatePrices()
      return { message: 'Price update triggered manually' }
    }
    return { error: 'Price simulation is not running' }
  }
}

export default PriceSimulationService