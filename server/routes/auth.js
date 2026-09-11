import express from 'express'
import {
  register,
  login,
  demoLogin,
  getProfile,
  updateProfile,
  logout
} from '../controllers/authController.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Public routes
router.post('/register', register)
router.post('/login', login)
router.post('/demo-login', demoLogin)

// Protected routes
router.use(authenticateToken) // Apply auth middleware to all routes below

router.get('/profile', getProfile)
router.put('/profile', updateProfile)
router.post('/logout', logout)

export default router