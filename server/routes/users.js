import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import User from '../models/User.js'

const router = express.Router()

// All routes require authentication
router.use(authenticateToken)

// Get user balance and stats
router.get('/balance', async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    const portfolioValue = await user.getPortfolioValue()
    const totalPnL = await user.getTotalPnL()

    res.json({
      balance: {
        virtual: user.virtualBalance,
        portfolio: portfolioValue,
        total: user.virtualBalance + portfolioValue,
        totalPnL,
        totalPnLPercentage: portfolioValue > 0 ? (totalPnL / portfolioValue) * 100 : 0
      },
      success: true
    })
  } catch (error) {
    console.error('Get balance error:', error)
    res.status(500).json({
      error: 'Failed to fetch balance',
      message: 'Balance load cheyyan pattiyilla! 💰😭'
    })
  }
})

export default router