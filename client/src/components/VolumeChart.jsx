import React, { useState } from 'react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'

const VolumeChart = ({ 
  data = [], 
  timeframe = '1d', 
  onTimeframeChange, 
  loading = false 
}) => {
  const [hoveredData, setHoveredData] = useState(null)

  const timeframes = [
    { value: '1h', label: '1H' },
    { value: '1d', label: '1D' }, 
    { value: '1w', label: '1W' },
    { value: '1m', label: '1M' }
  ]

  // Format volume data by aggregating based on timeframe
  const formatVolumeData = (priceData) => {
    if (!priceData || priceData.length === 0) return []
    
    const volumeData = []
    const interval = Math.max(1, Math.floor(priceData.length / 30)) // Max 30 bars
    
    for (let i = 0; i < priceData.length; i += interval) {
      const chunk = priceData.slice(i, i + interval)
      if (chunk.length === 0) continue
      
      const totalVolume = chunk.reduce((sum, d) => sum + (d.volume || Math.floor(Math.random() * 1000) + 100), 0)
      const avgPrice = chunk.reduce((sum, d) => sum + d.price, 0) / chunk.length
      const startPrice = chunk[0].price
      const endPrice = chunk[chunk.length - 1].price
      const isPositive = endPrice >= startPrice
      
      volumeData.push({
        time: chunk[Math.floor(chunk.length / 2)].time,
        timeDisplay: formatTime(chunk[Math.floor(chunk.length / 2)].time, timeframe),
        volume: totalVolume,
        avgPrice,
        isPositive,
        startPrice,
        endPrice,
        change: endPrice - startPrice,
        changePercent: ((endPrice - startPrice) / startPrice * 100)
      })
    }
    
    return volumeData
  }

  const volumeData = formatVolumeData(data)

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

  // Custom bar component for volume bars
  const VolumeBar = (props) => {
    const { payload, x, y, width, height } = props
    if (!payload) return null

    const color = payload.isPositive ? '#10b981' : '#ef4444'
    const opacity = 0.7
    
    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
        opacity={opacity}
        rx={2}
      />
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
          
          <div className="space-y-2">
            <div>
              <div className="text-sm text-gray-600">Volume</div>
              <div className="text-lg font-bold">
                {data.volume.toLocaleString()}
              </div>
            </div>
            
            <div>
              <div className="text-sm text-gray-600">Average Price</div>
              <div className="font-semibold">₹{data.avgPrice.toFixed(2)}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Start</div>
                <div className="font-medium">₹{data.startPrice.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-gray-600">End</div>
                <div className={`font-medium ${data.isPositive ? 'text-success' : 'text-danger'}`}>
                  ₹{data.endPrice.toFixed(2)}
                </div>
              </div>
            </div>
            
            <div>
              <div className="text-sm text-gray-600">Change</div>
              <div className={`font-semibold ${data.isPositive ? 'text-success' : 'text-danger'}`}>
                {data.isPositive ? '+' : ''}₹{data.change.toFixed(2)} ({data.changePercent.toFixed(2)}%)
              </div>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center bg-white rounded-lg">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-banana-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-gray-600">Loading volume data...</div>
        </div>
      </div>
    )
  }

  if (!volumeData || volumeData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-white rounded-lg">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-4">📊</div>
          <div>No volume data available</div>
        </div>
      </div>
    )
  }

  const totalVolume = volumeData.reduce((sum, d) => sum + d.volume, 0)
  const avgVolume = totalVolume / volumeData.length
  const maxVolume = Math.max(...volumeData.map(d => d.volume))

  return (
    <div className="bg-white rounded-lg p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Trading Volume
          </h3>
          
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <div>
              <span className="font-medium">Total: </span>
              {totalVolume.toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Avg: </span>
              {Math.round(avgVolume).toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Peak: </span>
              {maxVolume.toLocaleString()}
            </div>
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
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={volumeData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="timeDisplay"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickFormatter={(value) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
                if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
                return value.toString()
              }}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Bar
              dataKey="volume"
              shape={<VolumeBar />}
              maxBarSize={50}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Volume Analysis */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
        <div className="text-center">
          <div className="text-sm text-gray-600">Bullish Periods</div>
          <div className="font-semibold text-success">
            {volumeData.filter(d => d.isPositive).length}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600">Bearish Periods</div>
          <div className="font-semibold text-danger">
            {volumeData.filter(d => !d.isPositive).length}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600">High Volume</div>
          <div className="font-semibold">
            {volumeData.filter(d => d.volume > avgVolume * 1.5).length}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600">Low Volume</div>
          <div className="font-semibold">
            {volumeData.filter(d => d.volume < avgVolume * 0.5).length}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VolumeChart