import React, { useState, useEffect } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts'
import { TrendingUp, TrendingDown, Clock, BarChart2 } from 'lucide-react'

// Generate initial realistic technical chart data starting at 09:15 AM
const generateInitialChartData = (basePrice = 156.30, timeframe = '1D') => {
  const points = []
  const count = timeframe === '1D' ? 26 : timeframe === '1W' ? 35 : 45
  let current = basePrice * 0.96

  // Starting at 09:15 AM with 15-minute increments for 1D
  const startHour = 9
  const startMin = 15

  for (let i = 0; i < count; i++) {
    const totalMinutes = startMin + i * 15
    const h = Math.floor(startHour + totalMinutes / 60)
    const m = totalMinutes % 60
    const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`

    // Realistic random walk with slight upward drift
    const delta = (Math.random() - 0.48) * (basePrice * 0.008)
    current = Math.max(basePrice * 0.85, Math.min(basePrice * 1.15, current + delta))
    const vol = Math.floor(1200 + Math.random() * 2800)

    points.push({
      time: timeStr,
      price: Number(current.toFixed(2)),
      volume: vol
    })
  }

  // Ensure last point matches basePrice
  points[points.length - 1].price = basePrice
  return points
}

const TerminalChart = ({
  banana = null,
  currentPrice = 156.30,
  percentageChange = 2.84,
  isMarketOpen = true
}) => {
  const [timeframe, setTimeframe] = useState('1D')
  const [chartData, setChartData] = useState(() => generateInitialChartData(currentPrice, '1D'))
  const [activePoint, setActivePoint] = useState(null)

  // Re-generate base data when banana or timeframe changes
  useEffect(() => {
    setChartData(generateInitialChartData(currentPrice, timeframe))
  }, [banana?.symbol, timeframe])

  // React live to price movement: append or update latest point
  useEffect(() => {
    if (!currentPrice) return

    setChartData((prev) => {
      if (!prev || prev.length === 0) return prev
      const updated = [...prev]
      const lastIndex = updated.length - 1

      // Update the last point with the new live price
      updated[lastIndex] = {
        ...updated[lastIndex],
        price: Number(currentPrice.toFixed(2)),
        volume: (updated[lastIndex].volume || 1500) + Math.floor(Math.random() * 50)
      }
      return updated
    })
  }, [currentPrice])

  const isPositive = (percentageChange || 0) >= 0
  const lineColor = isPositive ? '#10b981' : '#ef4444'

  // Determine min and max for clean Y-axis padding
  const prices = chartData.map((d) => d.price)
  const minPrice = Math.floor(Math.min(...prices) * 0.995)
  const maxPrice = Math.ceil(Math.max(...prices) * 1.005)

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload
      return (
        <div className="bg-[#0b0f17] border border-slate-700/80 rounded-lg p-2.5 shadow-2xl font-mono text-xs z-50">
          <div className="text-slate-400 flex items-center justify-between space-x-3 mb-1 text-[11px]">
            <span>TIME:</span>
            <span className="text-slate-200 font-bold">{data.time} IST</span>
          </div>
          <div className="flex items-center justify-between space-x-3 mb-1">
            <span className="text-slate-400">PRICE:</span>
            <span className="text-banana-400 font-bold text-sm">
              ₹{Number(data.price).toFixed(2)} <span className="text-[10px] text-slate-400 font-sans">/ KG</span>
            </span>
          </div>
          <div className="flex items-center justify-between space-x-3 text-[11px]">
            <span className="text-slate-400">VOL TRADED:</span>
            <span className="text-slate-300 font-bold">{data.volume.toLocaleString('en-IN')} KG</span>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full bg-[#0d121c] border border-slate-800 rounded-xl p-4 flex flex-col justify-between select-none">
      {/* Chart Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-2 border-b border-slate-800/80">
        {/* Left: Active asset stats */}
        <div className="flex items-center space-x-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base sm:text-lg font-black font-mono text-white tracking-tight">
                {banana?.name?.toUpperCase() || 'NENDRAN'}
              </span>
              <span className="text-xs font-mono font-bold bg-slate-800 text-banana-400 px-1.5 py-0.5 rounded border border-slate-700">
                {banana?.symbol || 'NDR'}
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Grade-A Kerala Spot
              </span>
            </div>
            <div className="flex items-baseline space-x-2 mt-0.5">
              <span className="text-xl sm:text-2xl font-black font-mono text-white">
                ₹{Number(currentPrice).toFixed(2)}{' '}
                <span className="text-xs text-slate-400 font-sans font-normal">/ KG</span>
              </span>
              <span className={`text-xs font-mono font-bold ${
                isPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {isPositive ? '+' : ''}{Number(percentageChange).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Right: Timeframe Switcher */}
        <div className="flex items-center space-x-1 bg-slate-900/90 border border-slate-800 p-1 rounded-lg">
          {['1D', '1W', '1M', '1Y'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 text-xs font-mono font-bold rounded transition-all ${
                timeframe === tf
                  ? 'bg-slate-800 text-banana-400 shadow-sm border border-slate-700/80'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chart Graphic */}
      <div className="w-full h-56 sm:h-64 lg:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -18, bottom: 0 }}
            onMouseMove={(state) => {
              if (state.activePayload && state.activePayload.length) {
                setActivePoint(state.activePayload[0].payload)
              }
            }}
            onMouseLeave={() => setActivePoint(null)}
          >
            <CartesianGrid stroke="#1a2333" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#64748b"
              tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={{ stroke: '#1e293b' }}
              interval="preserveStartEnd"
              minTickGap={35}
            />
            <YAxis
              domain={[minPrice, maxPrice]}
              stroke="#64748b"
              tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={{ stroke: '#1e293b' }}
              tickFormatter={(val) => `₹${val}`}
              orientation="right"
            />
            <Tooltip content={<CustomTooltip />} isAnimationActive={false} />
            <Line
              type="monotone"
              dataKey="price"
              stroke={lineColor}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, fill: lineColor, stroke: '#0b0f17', strokeWidth: 2 }}
              isAnimationActive={false}
            />
            {/* Horizontal baseline */}
            <ReferenceLine
              y={chartData[0]?.price}
              stroke="#475569"
              strokeDasharray="3 3"
              strokeWidth={1}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Chart Footer Status */}
      <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-800/80 text-[10px] font-mono text-slate-400">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>SESSION: 09:15 - 15:30 IST</span>
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline">UNIT: INR (₹) / KG</span>
        </div>
        <div className="flex items-center space-x-2 text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>FEED: {isMarketOpen ? 'LIVE 5S TICKS' : 'STATIC EOD'}</span>
        </div>
      </div>
    </div>
  )
}

export default TerminalChart
