import express from 'express'
import Banana from '../models/Banana.js'
import PriceHistory from '../models/PriceHistory.js'

const router = express.Router()

// Get market overview
router.get('/overview', async (req, res) => {
  try {
    const bananas = await Banana.find({ isActive: true })
    
    const marketCap = bananas.reduce((sum, banana) => sum + banana.marketCap, 0)
    const avgChange = bananas.reduce((sum, banana) => sum + banana.percentageChange, 0) / bananas.length
    
    const gainers = bananas.filter(b => b.percentageChange > 0).length
    const losers = bananas.filter(b => b.percentageChange < 0).length
    const unchanged = bananas.filter(b => b.percentageChange === 0).length

    res.json({
      overview: {
        totalBananas: bananas.length,
        totalMarketCap: marketCap,
        avgPriceChange: avgChange,
        gainers,
        losers,
        unchanged,
        marketSentiment: avgChange > 0 ? 'bullish' : avgChange < 0 ? 'bearish' : 'neutral'
      },
      success: true
    })
  } catch (error) {
    console.error('Market overview error:', error)
    res.status(500).json({
      error: 'Failed to fetch market overview',
      message: 'Market overview load cheyyan pattiyilla! 📊😭'
    })
  }
})

// Get market movers
router.get('/movers', async (req, res) => {
  try {
    const { limit = 5 } = req.query
    const limitNum = parseInt(limit)

    const bananas = await Banana.find({ isActive: true })

    const gainers = bananas
      .filter(b => b.percentageChange > 0)
      .sort((a, b) => b.percentageChange - a.percentageChange)
      .slice(0, limitNum)

    const losers = bananas
      .filter(b => b.percentageChange < 0)
      .sort((a, b) => a.percentageChange - b.percentageChange)
      .slice(0, limitNum)

    const mostActive = bananas
      .sort((a, b) => b.volume24h - a.volume24h)
      .slice(0, limitNum)

    res.json({
      movers: {
        gainers: gainers.map(b => ({
          symbol: b.symbol,
          name: b.name,
          price: b.currentPrice,
          change: b.percentageChange,
          image: b.image
        })),
        losers: losers.map(b => ({
          symbol: b.symbol,
          name: b.name,
          price: b.currentPrice,
          change: b.percentageChange,
          image: b.image
        })),
        mostActive: mostActive.map(b => ({
          symbol: b.symbol,
          name: b.name,
          price: b.currentPrice,
          volume: b.volume24h,
          image: b.image
        }))
      },
      success: true
    })
  } catch (error) {
    console.error('Market movers error:', error)
    res.status(500).json({
      error: 'Failed to fetch market movers',
      message: 'Market movers load cheyyan pattiyilla! 📈😭'
    })
  }
})

export default router