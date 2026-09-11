import mongoose from 'mongoose'

const priceHistorySchema = new mongoose.Schema({
  bananaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Banana',
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  volume: {
    type: Number,
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  interval: {
    type: String,
    enum: ['1m', '5m', '15m', '1h', '4h', '1d'],
    default: '5m'
  }
}, {
  timestamps: false
})

// Compound indexes for efficient queries
priceHistorySchema.index({ bananaId: 1, timestamp: -1 })
priceHistorySchema.index({ bananaId: 1, interval: 1, timestamp: -1 })

// TTL index to automatically remove old data (keep 1 year)
priceHistorySchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 })

// Static method to get price history for chart
priceHistorySchema.statics.getChartData = async function(bananaId, timeframe = '1d', interval = '5m') {
  const timeFrames = {
    '1h': 1 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '1w': 7 * 24 * 60 * 60 * 1000,
    '1m': 30 * 24 * 60 * 60 * 1000,
    '3m': 90 * 24 * 60 * 60 * 1000
  }
  
  const startTime = new Date(Date.now() - timeFrames[timeframe])
  
  const data = await this
    .find({
      bananaId: new mongoose.Types.ObjectId(bananaId),
      interval,
      timestamp: { $gte: startTime }
    })
    .sort({ timestamp: 1 })
    .select('price timestamp volume')
    .lean()
  
  return data.map(point => ({
    time: point.timestamp,
    price: point.price,
    volume: point.volume
  }))
}

// Static method to add price point
priceHistorySchema.statics.addPricePoint = async function(bananaId, price, volume = 0, interval = '5m') {
  const pricePoint = new this({
    bananaId,
    price,
    volume,
    interval,
    timestamp: new Date()
  })
  
  return await pricePoint.save()
}

// Static method to get OHLCV data for candlestick charts
priceHistorySchema.statics.getOHLCVData = async function(bananaId, timeframe = '1d', candleInterval = '1h') {
  const timeFrames = {
    '1d': 24 * 60 * 60 * 1000,
    '1w': 7 * 24 * 60 * 60 * 1000,
    '1m': 30 * 24 * 60 * 60 * 1000,
    '3m': 90 * 24 * 60 * 60 * 1000
  }
  
  const startTime = new Date(Date.now() - timeFrames[timeframe])
  
  // Group by time intervals to create candlesticks
  const intervalMs = {
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000
  }
  
  const groupInterval = intervalMs[candleInterval] || intervalMs['1h']
  
  const pipeline = [
    {
      $match: {
        bananaId: new mongoose.Types.ObjectId(bananaId),
        timestamp: { $gte: startTime }
      }
    },
    {
      $group: {
        _id: {
          $subtract: [
            '$timestamp',
            { $mod: [{ $subtract: ['$timestamp', new Date(0)] }, groupInterval] }
          ]
        },
        open: { $first: '$price' },
        high: { $max: '$price' },
        low: { $min: '$price' },
        close: { $last: '$price' },
        volume: { $sum: '$volume' }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]
  
  const result = await this.aggregate(pipeline)
  
  return result.map(candle => ({
    time: candle._id,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: candle.volume
  }))
}

// Static method to clean old data
priceHistorySchema.statics.cleanOldData = async function(daysToKeep = 90) {
  const cutoffDate = new Date(Date.now() - (daysToKeep * 24 * 60 * 60 * 1000))
  
  const result = await this.deleteMany({
    timestamp: { $lt: cutoffDate }
  })
  
  console.log(`Cleaned ${result.deletedCount} old price history records`)
  return result
}

export default mongoose.model('PriceHistory', priceHistorySchema)