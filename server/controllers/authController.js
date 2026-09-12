import User from '../models/User.js'
import { generateToken } from '../middleware/auth.js'
import Joi from 'joi'

// Validation schemas
const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(20).required()
    .messages({
      'string.alphanum': 'Username should contain only letters and numbers',
      'string.min': 'Username should be at least 3 characters',
      'string.max': 'Username should not exceed 20 characters'
    }),
  email: Joi.string().email().required()
    .messages({
      'string.email': 'Please provide a valid email'
    }),
  password: Joi.string().min(6).required()
    .messages({
      'string.min': 'Password should be at least 6 characters'
    })
})

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
})

// Register new user
export const register = async (req, res) => {
  try {
    // Validate input
    const { error, value } = registerSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Details correct aano? 🤔',
        details: error.details.map(detail => detail.message)
      })
    }

    const { username, email, password } = value

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    })

    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'username'
      return res.status(400).json({
        error: 'User already exists',
        message: `Ee ${field} already use cheyyunnundu da! 😅`,
        field
      })
    }

    // Create new user with starting ₹10,000 virtual balance
    const user = new User({
      username,
      email,
      password,
      virtualBalance: 10000 // Starting balance ₹10,000
    })

    await user.save()

    // Generate token
    const token = generateToken(user._id)

    // Remove password from response
    const userResponse = user.toObject()
    delete userResponse.password

    res.status(201).json({
      message: 'Welcome to Pazham Panam! Ready to trade? 🍌🚀',
      user: userResponse,
      token,
      success: true
    })

  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({
      error: 'Registration failed',
      message: 'Account create cheyyan pattiyilla! Try again! 😭'
    })
  }
}

// Login user
export const login = async (req, res) => {
  try {
    // Validate input
    const { error, value } = loginSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Email and password correct aano? 🤔',
        details: error.details.map(detail => detail.message)
      })
    }

    const { email, password } = value

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password')
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password thett aanu! 🔐'
      })
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid credentials', 
        message: 'Password thett aanu da! 🔑'
      })
    }

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    // Generate token
    const token = generateToken(user._id)

    // Remove password from response
    const userResponse = user.toObject()
    delete userResponse.password

    res.json({
      message: 'Login successful! Welcome back! 🎉',
      user: userResponse,
      token,
      success: true
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      error: 'Login failed',
      message: 'Login cheyyan pattiyilla! Try again! 😭'
    })
  }
}

// Get current user profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password')
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User kanaan illa! 👻'
      })
    }

    // Ensure starting balance of ₹10,000 if not set or legacy 0 with no investments
    if (user.virtualBalance === undefined || user.virtualBalance === null || (user.virtualBalance === 0 && (!user.totalInvested || user.totalInvested === 0))) {
      user.virtualBalance = 10000
      await user.save()
    }

    // Calculate portfolio stats
    const portfolioValue = await user.getPortfolioValue()
    const totalPnL = await user.getTotalPnL()

    res.json({
      user: {
        ...user.toObject(),
        portfolioValue,
        totalPnL,
        totalNetWorth: user.virtualBalance + portfolioValue
      },
      success: true
    })

  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({
      error: 'Failed to fetch profile',
      message: 'Profile load cheyyan pattiyilla! 😅'
    })
  }
}

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const allowedUpdates = ['username', 'virtualBalance']
    const updates = {}
    
    // Filter allowed updates
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key]
      }
    })

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'No valid updates provided',
        message: 'Valid update illa da! 🤷‍♂️',
        allowedFields: allowedUpdates
      })
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password')

    res.json({
      message: 'Profile updated successfully! ✅',
      user,
      success: true
    })

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'Username already taken',
        message: 'Ee username already taken aanu! 😅'
      })
    }
    
    console.error('Update profile error:', error)
    res.status(500).json({
      error: 'Failed to update profile',
      message: 'Profile update cheyyan pattiyilla! 😭'
    })
  }
}

// Logout (mainly for token blacklisting in production)
export const logout = async (req, res) => {
  try {
    // In a production app, you'd typically blacklist the token here
    // For now, we'll just send a success message
    
    res.json({
      message: 'Logged out successfully! Vendum enkil വാ! 👋',
      success: true
    })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({
      error: 'Logout failed',
      message: 'Logout cheyyan pattiyilla! 😅'
    })
  }
}

// Instant Demo Login for hackathon testing
export const demoLogin = async (req, res) => {
  try {
    let user = await User.findOne({ username: 'pazhampro' })
    if (!user) {
      user = await User.findOne({})
    }
    if (!user) {
      user = new User({
        username: 'pazhampro',
        email: 'pazhampro@gmail.com',
        password: 'password123',
        virtualBalance: 10000
      })
      await user.save()
    } else if (user.virtualBalance === undefined || user.virtualBalance === null || (user.virtualBalance === 0 && (!user.totalInvested || user.totalInvested === 0))) {
      user.virtualBalance = 10000
      await user.save()
    }
    const token = generateToken(user._id)
    const userResponse = user.toObject()
    delete userResponse.password

    res.json({
      message: 'Demo login successful! Pazham trader aayi maarikko! 🍌💼',
      user: userResponse,
      token,
      success: true
    })
  } catch (error) {
    console.error('Demo login error:', error)
    res.status(500).json({
      error: 'Demo login failed',
      message: 'Demo login cheyyan pattiyilla! 😭'
    })
  }
}

export default {
  register,
  login,
  demoLogin,
  getProfile,
  updateProfile,
  logout
}