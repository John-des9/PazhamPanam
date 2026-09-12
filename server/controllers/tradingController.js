import mongoose from 'mongoose'
import Banana from '../models/Banana.js'
import Holdings from '../models/Holdings.js'
import Transaction from '../models/Transaction.js'
import User from '../models/User.js'
import Joi from 'joi'

// Validation schemas
const tradeSchema = Joi.object({
  bananaSymbol: Joi.string().min(2).max(10).required(),
  quantity: Joi.number().positive().required(),
  type: Joi.string().valid('buy', 'sell').optional()
}).unknown(true)

// Buy bananas
export const buyBanana = async (req, res) => {
  try {
    // Validate input
    const { error, value } = tradeSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Trade details correct aano? (> 0 KG enter cheyyu) 🤔',
        details: error.details.map(detail => detail.message),
        success: false
      })
    }

    const { bananaSymbol, quantity } = value
    const userId = req.user._id || req.user.id

    const qty = Number(quantity)
    if (!qty || isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        error: 'Invalid quantity',
        message: 'Valid quantity enter cheyyu mone! (> 0 KG)',
        success: false
      })
    }

    const SYMBOL_ALIASES = {
      NDR: 'NEN',
      NEN: 'NEN',
      POV: 'POV',
      PVN: 'POV',
      KDH: 'KDH',
      PLK: 'PLK',
      CKD: 'MAL',
      MAL: 'MAL',
      ROB: 'ROB',
      RBS: 'ROB',
      MAT: 'NJP',
      NJP: 'NJP',
      RSK: 'RST',
      RST: 'RST'
    }
    const sym = String(bananaSymbol).trim().toUpperCase()
    const targetSymbol = SYMBOL_ALIASES[sym] || sym

    // Find banana by primary symbol, alias, or case-insensitive name
    const banana = await Banana.findOne({ 
      $or: [
        { symbol: sym },
        { symbol: targetSymbol },
        { name: new RegExp('^' + sym + '$', 'i') },
        { name: new RegExp(sym, 'i') },
        { name: new RegExp(String(bananaSymbol).trim(), 'i') }
      ],
      isActive: true
    })

    if (!banana) {
      return res.status(404).json({
        error: 'Banana not found or trading halted',
        message: 'Ee banana illa or trading stopped aanu! 🍌❌',
        success: false
      })
    }

    // Live price calculation from central price engine
    const pricePerKg = Number(banana.currentPrice)
    const totalCost = Number((qty * pricePerKg).toFixed(2))

    // Check user balance
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account kandilla bro!',
        success: false
      })
    }

    // Ensure starting virtual balance defaults to 10,000 if not initialized
    if (user.virtualBalance === undefined || user.virtualBalance === null || (user.virtualBalance === 0 && (!user.totalInvested || user.totalInvested === 0))) {
      user.virtualBalance = 10000
      await user.save()
    }

    // Insufficient funds check
    if (user.virtualBalance < totalCost) {
      return res.status(400).json({
        error: 'Insufficient balance',
        message: 'Paisa illa mone 😭 Balance kuravaanu.',
        required: totalCost,
        available: user.virtualBalance,
        success: false
      })
    }

    // Deduct totalCost from user's virtual balance
    user.virtualBalance = Number((user.virtualBalance - totalCost).toFixed(2))
    user.totalInvested = Number(((user.totalInvested || 0) + totalCost).toFixed(2))
    await user.save()

    // Find or create holding
    let holding = await Holdings.findOne({
      userId,
      bananaId: banana._id
    })

    if (holding) {
      // Update existing holding
      holding.addPurchase(qty, pricePerKg)
      await holding.save()
    } else {
      // Create new holding
      holding = new Holdings({
        userId,
        bananaId: banana._id,
        quantity: qty,
        averageBuyPrice: pricePerKg,
        totalInvested: totalCost
      })
      await holding.save()
    }

    // Create transaction record
    const transaction = new Transaction({
      userId,
      bananaId: banana._id,
      type: 'buy',
      quantity: qty,
      price: pricePerKg,
      totalValue: totalCost,
      netValue: totalCost,
      balanceAfter: user.virtualBalance,
      status: 'completed'
    })
    await transaction.save()

    // Update banana volume
    banana.volume24h = (banana.volume24h || 0) + qty
    banana.calculateMarketCap()
    await banana.save()

    return res.json({
      success: true,
      message: 'ADICHU MONE! 🍌 Pazham vangiyeda!',
      transaction: {
        id: transaction._id,
        type: 'buy',
        banana: banana.name,
        symbol: banana.symbol,
        quantity: qty,
        price: pricePerKg,
        totalValue: totalCost,
        balanceAfter: user.virtualBalance
      },
      holding: {
        quantity: holding.quantity,
        averageBuyPrice: holding.averageBuyPrice,
        totalInvested: holding.totalInvested
      },
      balance: user.virtualBalance
    })

  } catch (error) {
    console.error('Buy banana error:', error)
    res.status(500).json({
      error: 'Purchase failed',
      message: 'Pazham vaangan pattiyilla! Try again! 😭',
      success: false
    })
  }
}

// Sell bananas
export const sellBanana = async (req, res) => {
  try {
    // Validate input
    const { error, value } = tradeSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Trade details correct aano? (> 0 KG enter cheyyu) 🤔',
        details: error.details.map(detail => detail.message),
        success: false
      })
    }

    const { bananaSymbol, quantity } = value
    const userId = req.user._id || req.user.id

    const qty = Number(quantity)
    if (!qty || isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        error: 'Invalid quantity',
        message: 'Valid quantity enter cheyyu mone! (> 0 KG)',
        success: false
      })
    }

    const SYMBOL_ALIASES = {
      NDR: 'NEN',
      NEN: 'NEN',
      POV: 'POV',
      PVN: 'POV',
      KDH: 'KDH',
      PLK: 'PLK',
      CKD: 'MAL',
      MAL: 'MAL',
      ROB: 'ROB',
      RBS: 'ROB',
      MAT: 'NJP',
      NJP: 'NJP',
      RSK: 'RST',
      RST: 'RST'
    }
    const sym = String(bananaSymbol).trim().toUpperCase()
    const targetSymbol = SYMBOL_ALIASES[sym] || sym

    // Find banana by primary symbol, alias, or case-insensitive name
    const banana = await Banana.findOne({ 
      $or: [
        { symbol: sym },
        { symbol: targetSymbol },
        { name: new RegExp('^' + sym + '$', 'i') },
        { name: new RegExp(sym, 'i') },
        { name: new RegExp(String(bananaSymbol).trim(), 'i') }
      ],
      isActive: true
    })

    if (!banana) {
      return res.status(404).json({
        error: 'Banana not found or trading halted',
        message: 'Ee banana illa or trading stopped aanu! 🍌❌',
        success: false
      })
    }

    // Find user's holding
    const holding = await Holdings.findOne({
      userId,
      bananaId: banana._id
    })

    if (!holding || holding.quantity < qty) {
      return res.status(400).json({
        error: 'Insufficient holdings',
        message: `Ithra KG kayyil illa mone! You have only ${holding?.quantity || 0} KG.`,
        available: holding?.quantity || 0,
        requested: qty,
        success: false
      })
    }

    const pricePerKg = Number(banana.currentPrice)
    const saleValue = Number((qty * pricePerKg).toFixed(2))
    
    // Update user balance
    const user = await User.findById(userId)
    user.virtualBalance = Number(((user.virtualBalance || 0) + saleValue).toFixed(2))
    await user.save()

    // Update holding
    const previousTotalInvested = holding.totalInvested
    holding.addSale(qty, pricePerKg)
    
    if (holding.quantity === 0) {
      // Remove holding if all sold
      await Holdings.deleteOne({ _id: holding._id })
    } else {
      await holding.save()
    }

    // Calculate P&L for this sale
    const investmentReduction = (qty / (holding.quantity + qty)) * previousTotalInvested
    const profitLoss = Number((saleValue - investmentReduction).toFixed(2))
    user.totalProfitLoss = Number(((user.totalProfitLoss || 0) + profitLoss).toFixed(2))
    await user.save()

    // Create transaction record
    const transaction = new Transaction({
      userId,
      bananaId: banana._id,
      type: 'sell',
      quantity: qty,
      price: pricePerKg,
      totalValue: saleValue,
      netValue: saleValue,
      balanceAfter: user.virtualBalance,
      status: 'completed',
      notes: `P&L: ₹${profitLoss.toFixed(2)}`
    })
    await transaction.save()

    // Update banana volume
    banana.volume24h = (banana.volume24h || 0) + qty
    banana.calculateMarketCap()
    await banana.save()

    return res.json({
      message: `Pazham vitteda! 💸 Sold ${qty} KG ${banana.name} for ₹${saleValue.toFixed(2)}`,
      transaction: {
        id: transaction._id,
        type: 'sell',
        banana: banana.name,
        symbol: banana.symbol,
        quantity: qty,
        price: pricePerKg,
        totalValue: saleValue,
        profitLoss,
        balanceAfter: user.virtualBalance
      },
      holding: holding.quantity > 0 ? {
        quantity: holding.quantity,
        averageBuyPrice: holding.averageBuyPrice,
        totalInvested: holding.totalInvested
      } : null,
      balance: user.virtualBalance,
      success: true
    })

  } catch (error) {
    console.error('Sell banana error:', error)
    res.status(500).json({
      error: 'Sale failed',
      message: 'Pazham vikkan pattiyilla! Try again! 😭',
      success: false
    })
  }
}

// Get user's holdings (portfolio)
export const getPortfolio = async (req, res) => {
  try {
    const userId = req.user._id
    
    const holdings = await Holdings
      .find({ userId })
      .populate('bananaId', 'name symbol image currentPrice percentageChange')
      .sort({ totalInvested: -1 })

    // Calculate portfolio stats
    let totalInvested = 0
    let currentValue = 0
    let todaysPnL = 0

    const validHoldings = holdings.filter(h => h.bananaId)
    const portfolioHoldings = validHoldings.map(holding => {
      const invested = Number(holding.totalInvested || 0)
      const currentPrice = Number(holding.bananaId?.currentPrice || holding.averageBuyPrice || 0)
      const current = holding.quantity * currentPrice
      const pnl = current - invested
      const pnlPercentage = invested > 0 ? (pnl / invested) * 100 : 0
      
      // Calculate today's P&L (assuming percentageChange is today's change)
      const pctChange = Number(holding.bananaId?.percentageChange || 0)
      const todayChange = (pctChange / 100) * current
      
      totalInvested += invested
      currentValue += current
      todaysPnL += todayChange

      return {
        id: holding._id,
        banana: {
          id: holding.bananaId._id,
          name: holding.bananaId.name,
          symbol: holding.bananaId.symbol,
          image: holding.bananaId.image,
          currentPrice: holding.bananaId.currentPrice,
          percentageChange: holding.bananaId.percentageChange
        },
        quantity: holding.quantity,
        averageBuyPrice: holding.averageBuyPrice,
        totalInvested: invested,
        currentValue: current,
        profitLoss: pnl,
        profitLossPercentage: pnlPercentage,
        todaysChange: todayChange
      }
    })

    const totalPnL = currentValue - totalInvested
    const totalPnLPercentage = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0

    res.json({
      portfolio: {
        totalInvested,
        currentValue,
        totalPnL,
        totalPnLPercentage,
        todaysPnL,
        todaysPnLPercentage: currentValue > 0 ? (todaysPnL / currentValue) * 100 : 0,
        holdingsCount: holdings.length
      },
      holdings: portfolioHoldings,
      success: true
    })

  } catch (error) {
    console.error('Get portfolio error:', error)
    res.status(500).json({
      error: 'Failed to fetch portfolio',
      message: 'Portfolio load cheyyan pattiyilla! 📊😭'
    })
  }
}

// Get user's transaction history
export const getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user._id
    const {
      page = 1,
      limit = 20,
      type,
      bananaSymbol,
      startDate,
      endDate
    } = req.query

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      type,
      startDate,
      endDate
    }

    // If banana symbol provided, find banana ID
    if (bananaSymbol) {
      const banana = await Banana.findOne({ symbol: bananaSymbol.toUpperCase() })
      if (banana) {
        options.bananaId = banana._id
      }
    }

    const result = await Transaction.getUserHistory(userId, options)

    res.json({
      transactions: result.transactions.map(t => ({
        id: t._id,
        type: t.type,
        banana: {
          name: t.bananaId.name,
          symbol: t.bananaId.symbol,
          image: t.bananaId.image
        },
        quantity: t.quantity,
        price: t.price,
        totalValue: t.totalValue,
        balanceAfter: t.balanceAfter,
        status: t.status,
        date: t.createdAt
      })),
      pagination: result.pagination,
      success: true
    })

  } catch (error) {
    console.error('Get transaction history error:', error)
    res.status(500).json({
      error: 'Failed to fetch transaction history',
      message: 'Transaction history load cheyyan pattiyilla! 📋😭'
    })
  }
}

export default {
  buyBanana,
  sellBanana,
  getPortfolio,
  getTransactionHistory
}