import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  virtualBalance: {
    type: Number,
    default: 10000, // ₹10,000 starting virtual balance
    min: 0
  },
  totalInvested: {
    type: Number,
    default: 0
  },
  totalProfitLoss: {
    type: Number,
    default: 0
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

// Get user's portfolio value
userSchema.methods.getPortfolioValue = async function() {
  const Holdings = mongoose.model('Holdings')
  const Banana = mongoose.model('Banana')
  
  const holdings = await Holdings.find({ userId: this._id }).populate('bananaId')
  let totalValue = 0
  
  for (const holding of holdings) {
    totalValue += holding.quantity * holding.bananaId.currentPrice
  }
  
  return totalValue
}

// Calculate total P&L
userSchema.methods.getTotalPnL = async function() {
  const Holdings = mongoose.model('Holdings')
  
  const holdings = await Holdings.find({ userId: this._id }).populate('bananaId')
  let totalPnL = 0
  
  for (const holding of holdings) {
    const currentValue = holding.quantity * holding.bananaId.currentPrice
    const investedValue = holding.quantity * holding.averageBuyPrice
    totalPnL += (currentValue - investedValue)
  }
  
  return totalPnL
}

export default mongoose.model('User', userSchema)