import React, { useState } from 'react'
import { 
  ComposedChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'

const CandlestickChart = ({ 
  data = [], 
  timeframe = '1d', 
  onTimeframeChange, 
  loading = false,
  banana = null 
}) => {
  const [hoveredData, setHoveredData] = useState(null)

  const timeframes = [
    { value: '1h', label: '1H' },
    { value: '1d', label: '1D' }, 
    { value: '1w', label: '1W' },
    { value: '1m', label: '1M' }
  ]

  // Format candlestick data
  const formatCandlestickData = (priceData) => {
    if (!priceData || priceData.length < 4) return []
    
    const candlesticks = []
    const interval = Math.max(1, Math.floor(priceData.length / 50)) // Max 50 candles
    
    for (let i = 0; i < priceData.length; i += interval) {
      const chunk = priceData.slice(i, i + interval)
      if (chunk.length === 0) continue
      
      const open = chunk[0].price
      const close = chunk[chunk.length - 1].price
      const high = Math.max(...chunk.map(d => d.price))
      const low = Math.min(...chunk.map(d => d.price))
      const volume = chunk.reduce((sum, d) => sum + (d.volume || 0), 0)
      
      candlesticks.push({
        time: chunk[Math.floor(chunk.length / 2)].time,
        timeDisplay: formatTime(chunk[Math.floor(chunk.length / 2)].time, timeframe),
        open,
        high,
        low,
        close,
        volume,
        isGreen: close >= open,
        wickHeight: high - low,
        bodyHeight: Math.abs(close - open),
        bodyTop: Math.max(open, close),
        bodyBottom: Math.min(open, close)
      })
    }
    
    return candlesticks
  }

  const candlestickData = formatCandlestickData(data)

  function formatTime(timestamp, timeframe) {
    const date = new Date(timestamp)
    
    switch (timeframe) {
      case '1h':
        return date.toLocaleTimeString('en-IN', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        })
      case '1d':
        return date.toLocaleTimeString('en-IN', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        })
      case '1w':
        return date.toLocaleDateString('en-IN', { 
          weekday: 'short',
          day: 'numeric'
        })
      case '1m':
        return date.toLocaleDateString('en-IN', { 
          month: 'short', 
          day: 'numeric' 
        })
      default:
        return date.toLocaleTimeString('en-IN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
    }
  }

  // Custom candlestick shape
  const CandlestickBar = (props) => {
    const { payload, x, width } = props
    if (!payload) return null

    const { high, low, open, close, isGreen } = payload
    const color = isGreen ? '#10b981' : '#ef4444'
    
    // Calculate positions
    const yScale = props.yAxisMap[props.yAxisId]
    if (!yScale) return null
    
    const highY = yScale.scale(high)
    const lowY = yScale.scale(low)
    const openY = yScale.scale(open)
    const closeY = yScale.scale(close)
    
    const bodyTop = Math.min(openY, closeY)
    const bodyHeight = Math.abs(closeY - openY)
    const wickX = x + width / 2
    
    return (
      <g>
        {/* Wick line */}
        <line
          x1={wickX}
          y1={highY}
          x2={wickX}
          y2={lowY}
          stroke={color}
          strokeWidth="1"
        />
        
        {/* Body rectangle */}
        <rect
          x={x + width * 0.2}
          y={bodyTop}
          width={width * 0.6}
          height={Math.max(bodyHeight, 1)}
          fill={isGreen ? color : '#ffffff'}
          stroke={color}
          strokeWidth="1"
        />
      </g>
    )
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload
      setHoveredData(data)
      
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border">
          <div className="text-sm text-gray-600 mb-2">
            {new Date(data.time).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Open</div>
              <div className="font-semibold">₹{data.open.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-gray-600">High</div>
              <div className="font-semibold">₹{data.high.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-gray-600">Low</div>
              <div className="font-semibold">₹{data.low.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-gray-600">Close</div>
              <div className={`font-semibold ${data.isGreen ? 'text-success' : 'text-danger'}`}>
                ₹{data.close.toFixed(2)}
              </div>
            </div>
          </div>
          
          {data.volume > 0 && (
            <div className="mt-2 text-sm">
              <div className="text-gray-600">Volume</div>
              <div className="font-semibold">{data.volume.toLocaleString()}</div>
            </div>
          )}
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center bg-white rounded-lg">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-banana-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-gray-600">Loading candlestick data...</div>
        </div>
      </div>
    )
  }

  if (!candlestickData || candlestickData.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center bg-white rounded-lg">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-4">🕯️</div>
          <div>No candlestick data available</div>
          <div className="text-sm mt-2">Need at least 4 price points</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          {banana && (
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {banana.name} Candlestick Chart
            </h3>
          )}
          
          <div className="text-sm text-gray-600">
            Showing {candlestickData.length} candles • {timeframe.toUpperCase()} intervals
          </div>
        </div>

        {/* Time Selector */}
        <div className="flex items-center space-x-1 mt-4 sm:mt-0">
          {timeframes.map((tf) => (
            <button
              key={tf.value}
              onClick={() => onTimeframeChange?.(tf.value)}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                timeframe === tf.value
                  ? 'bg-banana-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={candlestickData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="timeDisplay"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
            />
            <YAxis 
              domain={['dataMin - 5', 'dataMax + 5']}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickFormatter={(value) => `₹${value.toFixed(0)}`}
            />
            
            {/* Current price reference */}
            {banana && (
              <ReferenceLine 
                y={banana.currentPrice} 
                stroke="#fbbf24" 
                strokeDasharray="5 5" 
                strokeWidth={2}
              />
            )}
            
            <Tooltip content={<CustomTooltip />} />
            
            <Bar
              dataKey="high"
              shape={<CandlestickBar />}
              fill="transparent"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 mt-4 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-success rounded mr-2"></div>
          <span>Bullish (Green)</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-danger rounded mr-2"></div>
          <span>Bearish (Red)</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-1 bg-banana-500 mr-2"></div>
          <span>Current Price</span>
        </div>
      </div>
    </div>
  )
}

export default CandlestickChart