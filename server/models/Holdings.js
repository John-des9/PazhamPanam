import mongoose from 'mongoose'

const holdingsSchema = new mongoose.Schema({
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
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  averageBuyPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalInvested: {
    type: Number,
    required: true,
    min: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Compound index for efficient queries
holdingsSchema.index({ userId: 1, bananaId: 1 }, { unique: true })

// Calculate current value of holding
holdingsSchema.methods.getCurrentValue = async function() {
  await this.populate('bananaId')
  return this.quantity * this.bananaId.currentPrice
}

// Calculate profit/loss
holdingsSchema.methods.getProfitLoss = async function() {
  const currentValue = await this.getCurrentValue()
  return currentValue - this.totalInvested
}

// Calculate profit/loss percentage
holdingsSchema.methods.getProfitLossPercentage = async function() {
  const profitLoss = await this.getProfitLoss()
  return (profitLoss / this.totalInvested) * 100
}

// Update holding after purchase
holdingsSchema.methods.addPurchase = function(quantity, price) {
  const newTotalInvested = this.totalInvested + (quantity * price)
  const newQuantity = this.quantity + quantity
  
  // Update average buy price
  this.averageBuyPrice = newTotalInvested / newQuantity
  this.quantity = newQuantity
  this.totalInvested = newTotalInvested
  this.lastUpdated = new Date()
}

// Update holding after sale
holdingsSchema.methods.addSale = function(quantity, price) {
  if (quantity > this.quantity) {
    throw new Error('Cannot sell more than owned quantity')
  }
  
  const saleValue = quantity * price
  const investmentReduction = (quantity / this.quantity) * this.totalInvested
  
  this.quantity -= quantity
  this.totalInvested -= investmentReduction
  this.lastUpdated = new Date()
  
  // If all sold, reset average price
  if (this.quantity === 0) {
    this.averageBuyPrice = 0
    this.totalInvested = 0
  }
  
  return saleValue
}

export default mongoose.model('Holdings', holdingsSchema)