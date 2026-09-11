import mongoose from 'mongoose'
import Banana from '../models/Banana.js'
import Holdings from '../models/Holdings.js'
import Transaction from '../models/Transaction.js'
import User from '../models/User.js'
import Joi from 'joi'

// Validation schemas
const tradeSchema = Joi.object({
  bananaSymbol: Joi.string().alphanum().min(3).max(5).uppercase().required(),
  quantity: Joi.number().positive().precision(2).required(),
  type: Joi.string().valid('buy', 'sell').required()
})

// Buy bananas
export const buyBanana = async (req, res) => {
  try {
    // Validate input
    const { error, value } = tradeSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Trade details correct aano? 🤔',
        details: error.details.map(detail => detail.message)
      })
    }

    const { bananaSymbol, quantity } = value
    const userId = req.user._id

    // Find banana
    const banana = await Banana.findOne({ 
      symbol: bananaSymbol,
      isActive: true,
      tradingStatus: 'open'
    })

    if (!banana) {
      return res.status(404).json({
        error: 'Banana not found or trading halted',
        message: 'Ee banana illa or trading stopped aanu! 🍌❌'
      })
    }

    const totalCost = quantity * banana.currentPrice
    
    // Check user balance
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account kandilla bro!'
      })
    }

    if (user.virtualBalance < totalCost) {
      return res.status(400).json({
        error: 'Insufficient balance',
        message: `Paisa illa bro! ₹${totalCost.toFixed(2)} venam, but ₹${user.virtualBalance.toFixed(2)} mathrame ullu! 💸`,
        required: totalCost,
        available: user.virtualBalance
      })
    }

    // Update user balance
    user.virtualBalance -= totalCost
    await user.save()

    // Find or create holding
    let holding = await Holdings.findOne({
      userId,
      bananaId: banana._id
    })

    if (holding) {
      // Update existing holding
      holding.addPurchase(quantity, banana.currentPrice)
      await holding.save()
    } else {
      // Create new holding
      holding = new Holdings({
        userId,
        bananaId: banana._id,
        quantity,
        averageBuyPrice: banana.currentPrice,
        totalInvested: totalCost
      })
      await holding.save()
    }

    // Create transaction record
    const transaction = new Transaction({
      userId,
      bananaId: banana._id,
      type: 'buy',
      quantity,
      price: banana.currentPrice,
      totalValue: totalCost,
      netValue: totalCost,
      balanceAfter: user.virtualBalance,
      status: 'completed'
    })
    await transaction.save()

    // Update banana volume
    banana.volume24h += quantity
    banana.calculateMarketCap()
    await banana.save()

    res.json({
      message: `Pazham vaangi da! 🍌 ${quantity} ${banana.name} for ₹${totalCost.toFixed(2)}`,
      transaction: {
        id: transaction._id,
        type: 'buy',
        banana: banana.name,
        symbol: banana.symbol,
        quantity,
        price: banana.currentPrice,
        totalValue: totalCost,
        balanceAfter: user.virtualBalance
      },
      holding: {
        quantity: holding.quantity,
        averageBuyPrice: holding.averageBuyPrice,
        totalInvested: holding.totalInvested
      },
      balance: user.virtualBalance,
      success: true
    })

  } catch (error) {
    console.error('Buy banana error:', error)
    res.status(500).json({
      error: 'Purchase failed',
      message: 'Pazham vaangan pattiyilla! Try again! 😭'
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
        message: 'Trade details correct aano? 🤔',
        details: error.details.map(detail => detail.message)
      })
    }

    const { bananaSymbol, quantity } = value
    const userId = req.user._id

    // Find banana
    const banana = await Banana.findOne({ 
      symbol: bananaSymbol,
      isActive: true,
      tradingStatus: 'open'
    })

    if (!banana) {
      return res.status(404).json({
        error: 'Banana not found or trading halted',
        message: 'Ee banana illa or trading stopped aanu! 🍌❌'
      })
    }

    // Find user's holding
    const holding = await Holdings.findOne({
      userId,
      bananaId: banana._id
    })

    if (!holding || holding.quantity < quantity) {
      return res.status(400).json({
        error: 'Insufficient holdings',
        message: `Eda, ${quantity} ${banana.name} ninte kayyil illa! You have only ${holding?.quantity || 0}! 🍌❌`,
        available: holding?.quantity || 0,
        requested: quantity
      })
    }

    const saleValue = quantity * banana.currentPrice
    
    // Update user balance
    const user = await User.findById(userId)
    user.virtualBalance += saleValue
    await user.save()

    // Update holding
    const previousTotalInvested = holding.totalInvested
    holding.addSale(quantity, banana.currentPrice)
    
    if (holding.quantity === 0) {
      // Remove holding if all sold
      await Holdings.deleteOne({ _id: holding._id })
    } else {
      await holding.save()
    }

    // Calculate P&L for this sale
    const investmentReduction = (quantity / (holding.quantity + quantity)) * previousTotalInvested
    const profitLoss = saleValue - investmentReduction

    // Create transaction record
    const transaction = new Transaction({
      userId,
      bananaId: banana._id,
      type: 'sell',
      quantity,
      price: banana.currentPrice,
      totalValue: saleValue,
      netValue: saleValue,
      balanceAfter: user.virtualBalance,
      status: 'completed',
      notes: `P&L: ₹${profitLoss.toFixed(2)}`
    })
    await transaction.save()

    // Update banana volume
    banana.volume24h += quantity
    banana.calculateMarketCap()
    await banana.save()

    res.json({
      message: `Pazham vitteda! 💸 Sold ${quantity} ${banana.name} for ₹${saleValue.toFixed(2)}`,
      transaction: {
        id: transaction._id,
        type: 'sell',
        banana: banana.name,
        symbol: banana.symbol,
        quantity,
        price: banana.currentPrice,
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
      message: 'Pazham vikkan pattiyilla! Try again! 😭'
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

    const portfolioHoldings = holdings.map(holding => {
      const invested = holding.totalInvested
      const current = holding.quantity * holding.bananaId.currentPrice
      const pnl = current - invested
      const pnlPercentage = (pnl / invested) * 100
      
      // Calculate today's P&L (assuming percentageChange is today's change)
      const todayChange = (holding.bananaId.percentageChange / 100) * current
      
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