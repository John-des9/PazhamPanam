import jwt from 'jsonwebtoken'
import User from '../models/User.js'

// Generate JWT token
export const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  })
}

// Middleware to verify JWT token
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null

    if (!token) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Login cheyyittu vaa bro! 🔐'
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.userId).select('-password')
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'User not found or inactive',
        message: 'Account inactive aanu da! 😕'
      })
    }

    req.user = user
    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token expired aayatho? Login again! 🔄'
      })
    }
    
    console.error('Auth middleware error:', error)
    res.status(500).json({
      error: 'Authentication error',
      message: 'Something went wrong with auth! 😭'
    })
  }
}

// Middleware to check if user has sufficient balance
export const checkBalance = (requiredAmount) => {
  return (req, res, next) => {
    if (req.user.virtualBalance < requiredAmount) {
      return res.status(400).json({
        error: 'Insufficient balance',
        message: 'Paisa illa bro! Balance add cheyu! 💸',
        currentBalance: req.user.virtualBalance,
        required: requiredAmount
      })
    }
    next()
  }
}

// Middleware for admin-only routes (if needed)
export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        error: 'Admin access required',
        message: 'Admin permissions illa da! 👮‍♂️'
      })
    }
    next()
  } catch (error) {
    res.status(500).json({
      error: 'Authorization error',
      message: 'Permission check failed! 😅'
    })
  }
}

export default {
  generateToken,
  authenticateToken,
  checkBalance,
  requireAdmin
}