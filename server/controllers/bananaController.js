import mongoose from 'mongoose'
import Banana from '../models/Banana.js'
import PriceHistory from '../models/PriceHistory.js'
import Transaction from '../models/Transaction.js'

// Get all bananas with market data
export const getAllBananas = async (req, res) => {
  try {
    const { 
      category, 
      origin, 
      sortBy = 'marketCap', 
      sortOrder = 'desc',
      limit = 50,
      search 
    } = req.query

    // Build query
    let query = { isActive: true }
    
    if (category) {
      query.category = category
    }
    
    if (origin) {
      query.origin = new RegExp(origin, 'i')
    }
    
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { symbol: new RegExp(search, 'i') },
        { fullName: new RegExp(search, 'i') }
      ]
    }

    // Build sort
    const sort = {}
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1

    const bananas = await Banana
      .find(query)
      .sort(sort)
      .limit(parseInt(limit))

    // Get 24h volume stats for each banana
    const bananasWithStats = await Promise.all(
      bananas.map(async (banana) => {
        const volumeStats = await Transaction.getVolumeStats(banana._id, '24h')
        
        return {
          ...banana.toObject(),
          volume24h: volumeStats.totalVolume,
          tradeValue24h: volumeStats.totalValue,
          tradeCount24h: volumeStats.transactionCount
        }
      })
    )

    res.json({
      bananas: bananasWithStats,
      count: bananasWithStats.length,
      success: true
    })

  } catch (error) {
    console.error('Get bananas error:', error)
    res.status(500).json({
      error: 'Failed to fetch bananas',
      message: 'Bananas load cheyyan pattiyilla! 🍌😭'
    })
  }
}

// Get single banana details
export const getBananaDetails = async (req, res) => {
  try {
    const { symbol } = req.params
    const isId = mongoose.isValidObjectId(symbol)
    
    const banana = await Banana.findOne({ 
      ...(isId 
        ? { $or: [{ _id: symbol }, { symbol: symbol.toUpperCase() }] } 
        : { symbol: symbol.toUpperCase() }),
      isActive: true 
    })

    if (!banana) {
      return res.status(404).json({
        error: 'Banana not found',
        message: 'Ee banana illa da! 🍌❓'
      })
    }

    // Get volume stats
    const volumeStats = await Transaction.getVolumeStats(banana._id, '24h')
    
    // Get recent price history
    const priceHistory = await PriceHistory.getChartData(banana._id, '1d', '5m')

    res.json({
      banana: {
        ...banana.toObject(),
        volume24h: volumeStats.totalVolume,
        tradeValue24h: volumeStats.totalValue,
        tradeCount24h: volumeStats.transactionCount
      },
      priceHistory,
      success: true
    })

  } catch (error) {
    console.error('Get banana details error:', error)
    res.status(500).json({
      error: 'Failed to fetch banana details',
      message: 'Banana details load cheyyan pattiyilla! 🍌😭'
    })
  }
}

// Get banana price history for charts
export const getBananaPriceHistory = async (req, res) => {
  try {
    const { symbol } = req.params
    const { 
      timeframe = '1d', 
      interval = '5m',
      chartType = 'line' 
    } = req.query

    const isId = mongoose.isValidObjectId(symbol)
    const banana = await Banana.findOne({ 
      ...(isId 
        ? { $or: [{ _id: symbol }, { symbol: symbol.toUpperCase() }] } 
        : { symbol: symbol.toUpperCase() }),
      isActive: true 
    })

    if (!banana) {
      return res.status(404).json({
        error: 'Banana not found',
        message: 'Ee banana illa da! 🍌❓'
      })
    }

    let priceData

    if (chartType === 'candlestick') {
      priceData = await PriceHistory.getOHLCVData(banana._id, timeframe, interval)
    } else {
      priceData = await PriceHistory.getChartData(banana._id, timeframe, interval)
    }

    res.json({
      symbol: banana.symbol,
      name: banana.name,
      timeframe,
      interval,
      chartType,
      data: priceData,
      count: priceData.length,
      success: true
    })

  } catch (error) {
    console.error('Get price history error:', error)
    res.status(500).json({
      error: 'Failed to fetch price history',
      message: 'Price history load cheyyan pattiyilla! 📊😭'
    })
  }
}

// Get market statistics
export const getMarketStats = async (req, res) => {
  try {
    const bananas = await Banana.find({ isActive: true })
    
    // Calculate market stats
    const totalMarketCap = bananas.reduce((sum, banana) => sum + banana.marketCap, 0)
    const avgPriceChange = bananas.reduce((sum, banana) => sum + banana.percentageChange, 0) / bananas.length
    
    // Top gainers and losers
    const topGainers = bananas
      .filter(b => b.percentageChange > 0)
      .sort((a, b) => b.percentageChange - a.percentageChange)
      .slice(0, 5)
    
    const topLosers = bananas
      .filter(b => b.percentageChange < 0)
      .sort((a, b) => a.percentageChange - b.percentageChange)
      .slice(0, 5)
    
    // Most active (by market cap)
    const mostActive = bananas
      .sort((a, b) => b.marketCap - a.marketCap)
      .slice(0, 5)

    res.json({
      stats: {
        totalBananas: bananas.length,
        totalMarketCap,
        avgPriceChange,
        bananasUp: bananas.filter(b => b.percentageChange > 0).length,
        bananasDown: bananas.filter(b => b.percentageChange < 0).length,
        bananasFlat: bananas.filter(b => b.percentageChange === 0).length
      },
      topGainers,
      topLosers,
      mostActive,
      success: true
    })

  } catch (error) {
    console.error('Get market stats error:', error)
    res.status(500).json({
      error: 'Failed to fetch market stats',
      message: 'Market stats load cheyyan pattiyilla! 📊😭'
    })
  }
}

// Search bananas
export const searchBananas = async (req, res) => {
  try {
    const { q: query, limit = 10 } = req.query
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        error: 'Search query too short',
        message: 'Koode type cheyu da! 🔍'
      })
    }

    const searchRegex = new RegExp(query.trim(), 'i')
    
    const bananas = await Banana
      .find({
        isActive: true,
        $or: [
          { name: searchRegex },
          { symbol: searchRegex },
          { fullName: searchRegex },
          { origin: searchRegex },
          { category: searchRegex }
        ]
      })
      .select('name symbol fullName currentPrice percentageChange image')
      .sort({ marketCap: -1 })
      .limit(parseInt(limit))

    res.json({
      query: query.trim(),
      results: bananas,
      count: bananas.length,
      success: true
    })

  } catch (error) {
    console.error('Search bananas error:', error)
    res.status(500).json({
      error: 'Search failed',
      message: 'Search cheyyan pattiyilla! 🔍😭'
    })
  }
}

export default {
  getAllBananas,
  getBananaDetails,
  getBananaPriceHistory,
  getMarketStats,
  searchBananas
}