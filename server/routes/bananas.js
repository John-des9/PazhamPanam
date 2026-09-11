import express from 'express'
import {
  getAllBananas,
  getBananaDetails,
  getBananaPriceHistory,
  getMarketStats,
  searchBananas
} from '../controllers/bananaController.js'

const router = express.Router()

// Public routes (no authentication required)
router.get('/', getAllBananas)
router.get('/search', searchBananas)
router.get('/stats', getMarketStats)
router.get('/:symbol', getBananaDetails)
router.get('/:symbol/history', getBananaPriceHistory)

export default router