import express from 'express'
import {
  buyBanana,
  sellBanana,
  getPortfolio,
  getTransactionHistory
} from '../controllers/tradingController.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// All trading routes require authentication
router.use(authenticateToken)

// Trading routes
router.post('/buy', buyBanana)
router.post('/sell', sellBanana)

// Portfolio routes
router.get('/portfolio', getPortfolio)
router.get('/history', getTransactionHistory)

export default router