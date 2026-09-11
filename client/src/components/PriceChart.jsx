import React, { useState, useEffect } from 'react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import { TrendingUp, TrendingDown } from 'lucide-react'

const PriceChart = ({ 
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
    { value: '1m', label: '1M' },
    { value: '3m', label: '3M' }
  ]

  // Format data for chart
  const formattedData = data.map((point, index) => ({
    ...point,
    time: new Date(point.time).getTime(),
    timeDisplay: formatTime(point.time, timeframe),
    index
  }))

  // Determine chart color based on trend
  const isPositive = data.length > 1 ? 
    data[data.length - 1].price > data[0].price : true
  
  const chartColor = isPositive ? '#10b981' : '#ef4444'
  const fillColor = isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload
      setHoveredData(data)
      
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border">
          <div className="text-sm text-gray-600 mb-2">
            {formatDetailedTime(new Date(data.time))}
          </div>
          <div className="text-xl font-bold mb-1">
            ₹{data.price.toFixed(2)}
          </div>
          {data.volume && (
            <div className="text-sm text-gray-600">
              Volume: {data.volume.toLocaleString()}
            </div>
          )}
        </div>
      )
    }
    return null
  }

  // Format time based on timeframe
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
          hour: '2-digit'
        })
      case '1m':
      case '3m':
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

  function formatDetailedTime(date) {
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center bg-white rounded-lg">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-banana-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-gray-600">Loading chart data...</div>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center bg-white rounded-lg">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-4">📊</div>
          <div>No chart data available</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg p-6">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          {banana && (
            <div className="mb-2">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                {banana.name}
                <span className="ml-2 text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  {banana.symbol}
                </span>
              </h3>
            </div>
          )}
          
          {/* Price Display */}
          <div className="flex items-center space-x-4">
            <div className="text-3xl font-bold text-gray-900">
              ₹{hoveredData?.price.toFixed(2) || data[data.length - 1]?.price.toFixed(2) || '0.00'}
            </div>
            
            {banana && (
              <div className={`flex items-center text-lg font-medium ${
                banana.percentageChange >= 0 ? 'text-success' : 'text-danger'
              }`}>
                {banana.percentageChange >= 0 ? (
                  <TrendingUp className="w-5 h-5 mr-1" />
                ) : (
                  <TrendingDown className="w-5 h-5 mr-1" />
                )}
                <span>
                  {banana.percentageChange >= 0 ? '+' : ''}
                  ₹{Math.abs(banana.priceChange || 0).toFixed(2)} ({banana.percentageChange.toFixed(2)}%)
                </span>
              </div>
            )}
          </div>
          
          {hoveredData && (
            <div className="text-sm text-gray-600 mt-1">
              {formatDetailedTime(new Date(hoveredData.time))}
            </div>
          )}
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
          <LineChart
            data={formattedData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="timeDisplay"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              interval="preserveStartEnd"
            />
            <YAxis 
              domain={['dataMin - 5', 'dataMax + 5']}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickFormatter={(value) => `₹${value.toFixed(0)}`}
            />
            
            {/* Current price reference line */}
            {banana && (
              <ReferenceLine 
                y={banana.currentPrice} 
                stroke="#fbbf24" 
                strokeDasharray="5 5" 
                strokeWidth={2}
              />
            )}
            
            <Tooltip content={<CustomTooltip />} />
            
            <Line
              type="monotone"
              dataKey="price"
              stroke={chartColor}
              strokeWidth={3}
              dot={false}
              activeDot={{ 
                r: 6, 
                fill: chartColor,
                stroke: '#ffffff',
                strokeWidth: 2
              }}
              fill={fillColor}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
        <div className="text-center">
          <div className="text-sm text-gray-600">High</div>
          <div className="font-semibold">
            ₹{Math.max(...data.map(d => d.price)).toFixed(2)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600">Low</div>
          <div className="font-semibold">
            ₹{Math.min(...data.map(d => d.price)).toFixed(2)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600">Volume</div>
          <div className="font-semibold">
            {data.reduce((sum, d) => sum + (d.volume || 0), 0).toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600">Change</div>
          <div className={`font-semibold ${isPositive ? 'text-success' : 'text-danger'}`}>
            {((data[data.length - 1]?.price - data[0]?.price) / data[0]?.price * 100).toFixed(2)}%
          </div>
        </div>
      </div>
    </div>
  )
}

export default PriceChart