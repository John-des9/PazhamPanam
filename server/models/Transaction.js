import mongoose from 'mongoose'

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bananaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Banana',
    required: true
  },
  type: {
    type: String,
    enum: ['buy', 'sell'],
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0.01
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  totalValue: {
    type: Number,
    required: true,
    min: 0
  },
  fees: {
    type: Number,
    default: 0
  },
  netValue: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'completed'
  },
  notes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
})

// Index for efficient queries
transactionSchema.index({ userId: 1, createdAt: -1 })
transactionSchema.index({ bananaId: 1, createdAt: -1 })
transactionSchema.index({ type: 1, createdAt: -1 })

// Calculate transaction fees (if any)
transactionSchema.methods.calculateFees = function() {
  // For now, no fees - but can be implemented later
  return 0
}

// Get transaction summary
transactionSchema.methods.getSummary = function() {
  return {
    id: this._id,
    type: this.type,
    banana: this.bananaId?.name || 'Unknown',
    symbol: this.bananaId?.symbol || 'N/A',
    quantity: this.quantity,
    price: this.price,
    totalValue: this.totalValue,
    date: this.createdAt,
    status: this.status
  }
}

// Static method to get user's transaction history
transactionSchema.statics.getUserHistory = async function(userId, options = {}) {
  const { 
    limit = 50, 
    page = 1, 
    type = null, 
    bananaId = null,
    startDate = null,
    endDate = null 
  } = options
  
  let query = { userId }
  
  if (type) query.type = type
  if (bananaId) query.bananaId = bananaId
  
  if (startDate || endDate) {
    query.createdAt = {}
    if (startDate) query.createdAt.$gte = new Date(startDate)
    if (endDate) query.createdAt.$lte = new Date(endDate)
  }
  
  const skip = (page - 1) * limit
  
  const transactions = await this
    .find(query)
    .populate('bananaId', 'name symbol image')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
  
  const total = await this.countDocuments(query)
  
  return {
    transactions,
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      hasMore: skip + transactions.length < total
    }
  }
}

// Static method to get trading volume statistics
transactionSchema.statics.getVolumeStats = async function(bananaId, timeframe = '24h') {
  const timeFrames = {
    '1h': 1 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000
  }
  
  const timeLimit = new Date(Date.now() - timeFrames[timeframe])
  
  const stats = await this.aggregate([
    {
      $match: {
        bananaId: new mongoose.Types.ObjectId(bananaId),
        createdAt: { $gte: timeLimit },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        totalVolume: { $sum: '$quantity' },
        totalValue: { $sum: '$totalValue' },
        buyVolume: {
          $sum: {
            $cond: [{ $eq: ['$type', 'buy'] }, '$quantity', 0]
          }
        },
        sellVolume: {
          $sum: {
            $cond: [{ $eq: ['$type', 'sell'] }, '$quantity', 0]
          }
        },
        transactionCount: { $sum: 1 }
      }
    }
  ])
  
  return stats[0] || {
    totalVolume: 0,
    totalValue: 0,
    buyVolume: 0,
    sellVolume: 0,
    transactionCount: 0
  }
}

export default mongoose.model('Transaction', transactionSchema)