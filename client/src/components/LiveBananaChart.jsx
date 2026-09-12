import React, { useMemo } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts'
import { TrendingUp, TrendingDown, Clock, Scale, Sparkles } from 'lucide-react'
import { useMarket, CANONICAL_BANANAS } from '../hooks/useMarket'

export const VARIETY_METADATA = {
  NDR: {
    range: [148.50, 164.80],
    mood: 'Kuthichu kayari 📈',
    moodSub: 'Chip industry bulk wholesale procurement driving rally'
  },
  POV: {
    range: [88.50, 96.20],
    mood: 'Poovan innu strong aanu 💪',
    moodSub: 'Daily retail consumption holding high mandi support'
  },
  KDH: {
    range: [102.10, 112.50],
    mood: 'Kadhali chathichu da 📉',
    moodSub: 'Mild mandi correction after festival peak orders'
  },
  PLK: {
    range: [121.20, 134.80],
    mood: 'Vamban demand 🔥',
    moodSub: 'Wayanad arrivals absorbed instantly at spot auction'
  },
  CKD: {
    range: [136.00, 148.50],
    mood: 'Red superhit 🚀',
    moodSub: 'Chenkadali red variety seeing heavy buyer volume'
  },
  ROB: {
    range: [132.20, 141.00],
    mood: 'Mandi stable ⚖️',
    moodSub: 'Steady kitchen demand across Idukki wholesale belt'
  },
  MAT: {
    range: [158.00, 172.50],
    mood: 'Usharaanu mone 🍌',
    moodSub: 'Aromatic baby banana scarcity fueling spot markup'
  },
  RSK: {
    range: [100.80, 108.40],
    mood: 'Pazham panam hit ✨',
    moodSub: 'Sweet heirloom variety maintaining positive sentiment'
  }
}

// Name and symbol alias normalizer
const normalizeSymbol = (symOrName) => {
  if (!symOrName) return 'NDR'
  const str = String(symOrName).trim().toUpperCase()
  if (['NDR', 'NEN', 'NENDRAN'].includes(str)) return 'NDR'
  if (['POV', 'POOVAN'].includes(str)) return 'POV'
  if (['KDH', 'KADHALI'].includes(str)) return 'KDH'
  if (['PLK', 'PALAYANKODAN'].includes(str)) return 'PLK'
  if (['CKD', 'MAL', 'CHENKADALI'].includes(str)) return 'CKD'
  if (['ROB', 'ROBUSTA'].includes(str)) return 'ROB'
  if (['MAT', 'NJP', 'MATTI'].includes(str)) return 'MAT'
  if (['RSK', 'RST', 'RASAKADALI'].includes(str)) return 'RSK'
  return str
}

/**
 * LiveBananaChart
 * One single reusable real-time chart component for all sections:
 * - LIVE MANDI TERMINAL
 * - MARKET
 * - TOP GAINERS
 * - TOP LOSERS
 * 
 * Usage:
 *   <LiveBananaChart banana="NENDRAN" />
 *   <LiveBananaChart banana={activeBanana} />
 */
const LiveBananaChart = ({
  banana = 'NDR',
  currentPrice: explicitPrice = null,
  percentageChange: explicitPct = null,
  height = 320,
  showHeader = true,
  showFooter = true,
  className = ''
}) => {
  const { bananas = [], getBananaHistory, priceHistories } = useMarket()

  // Resolve banana whether passed as string or object
  const resolvedBanana = useMemo(() => {
    let sym = 'NDR'
    if (typeof banana === 'string') {
      sym = normalizeSymbol(banana)
    } else if (banana && typeof banana === 'object') {
      sym = normalizeSymbol(banana.symbol || banana.name)
    }

    // Find live banana in current market state
    const live = bananas.find((b) => normalizeSymbol(b.symbol) === sym)
    if (live) return live

    // Fallback to canonical list
    const canon = CANONICAL_BANANAS.find((b) => normalizeSymbol(b.symbol) === sym)
    if (canon) return canon

    return typeof banana === 'object' ? banana : { symbol: sym, name: sym, currentPrice: 120, percentageChange: 0 }
  }, [banana, bananas])

  const symbol = normalizeSymbol(resolvedBanana.symbol)
  const meta = VARIETY_METADATA[symbol] || VARIETY_METADATA.NDR

  const livePrice = explicitPrice !== null ? explicitPrice : resolvedBanana.currentPrice || 120
  const livePercentage = explicitPct !== null ? explicitPct : resolvedBanana.percentageChange || 0
  const isPositive = Number(livePercentage) >= 0

  // Persistent live history from central useMarket state
  const chartData = useMemo(() => {
    return getBananaHistory(symbol)
  }, [getBananaHistory, symbol, priceHistories, livePrice])

  // Dynamic min and max for price axis with comfortable padding
  const prices = chartData.map((d) => d.price)
  const minPrice = Math.floor(Math.min(...prices) * 0.985)
  const maxPrice = Math.ceil(Math.max(...prices) * 1.015)

  const totalVolumeKg = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + (curr.volume || 1200), 0)
  }, [chartData])

  const gradientId = `bananaChartGradient_${symbol}`

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload
      return (
        <div className="bg-white border-2 border-amber-300 rounded-2xl p-3.5 shadow-xl font-sans text-xs z-50">
          <div className="flex items-center justify-between space-x-4 mb-1 text-slate-500 text-[11px] font-bold border-b border-amber-100 pb-1">
            <span className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>TIME:</span>
            </span>
            <span className="text-slate-800 font-extrabold">{data.time} IST</span>
          </div>

          <div className="flex items-center justify-between space-x-4 mb-1">
            <span className="text-slate-600 font-bold">PRICE:</span>
            <span className="text-amber-800 font-black text-sm">
              ₹{Number(data.price).toFixed(2)}{' '}
              <span className="text-[10px] text-slate-500 font-normal">/ KG</span>
            </span>
          </div>

          <div className="flex items-center justify-between space-x-4 text-[11px]">
            <span className="text-slate-500 font-medium">KG TRADED:</span>
            <span className="text-slate-900 font-bold">
              {(data.volume || 1500).toLocaleString('en-IN')} KG
            </span>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div
      className={`w-full bg-white border-2 border-amber-200/90 rounded-3xl p-5 sm:p-7 shadow-sm flex flex-col justify-between select-none ${className}`}
    >
      {/* Top Header: Cultivar Info + Live Spot Price / KG + % Change */}
      {showHeader && (
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-amber-100">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <h3 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                {resolvedBanana?.name?.toUpperCase() || symbol}
              </h3>
              <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-mono">
                {symbol}
              </span>
            </div>

            <div className="flex items-baseline space-x-3 mt-1.5">
              <div className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                ₹{Number(livePrice).toFixed(2)}
                <span className="text-sm sm:text-base font-semibold text-slate-500 ml-1">
                  / KG
                </span>
              </div>

              <div
                className={`inline-flex items-center space-x-1 text-xs font-black px-2 py-0.5 rounded-lg ${
                  isPositive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                    : 'bg-rose-50 text-rose-700 border border-rose-300'
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="w-3.5 h-3.5 mr-0.5 stroke-[2.5]" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 mr-0.5 stroke-[2.5]" />
                )}
                <span>
                  {isPositive ? '+' : ''}
                  {Number(livePercentage).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center space-x-2 text-xs font-bold text-amber-900 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>24/7 SPOT FEED</span>
          </div>
        </div>
      )}

      {/* Main Banana-Themed Area Chart */}
      <div className="w-full my-2" style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 12, right: 12, left: 10, bottom: 8 }}>
            <defs>
              {/* Warm Golden Banana Gradient */}
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#facc15" stopOpacity={0.65} />
                <stop offset="50%" stopColor="#fde047" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#fef08a" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#fef3c7" vertical={false} />

            <XAxis
              dataKey="time"
              stroke="#64748b"
              fontSize={11}
              fontWeight={600}
              tickLine={false}
              axisLine={{ stroke: '#fde68a' }}
              dy={6}
            />

            <YAxis
              domain={[minPrice, maxPrice]}
              stroke="#64748b"
              fontSize={11}
              fontWeight={700}
              tickLine={false}
              axisLine={{ stroke: '#fde68a' }}
              tickFormatter={(val) => `₹${val}`}
              orientation="right"
              dx={4}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Banana Market Area Curve */}
            <Area
              type="monotone"
              dataKey="price"
              stroke="#d97706"
              strokeWidth={3.5}
              fill={`url(#${gradientId})`}
              isAnimationActive={false}
              activeDot={{
                r: 7,
                fill: '#b45309',
                stroke: '#fef08a',
                strokeWidth: 3
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Footer: Supporting Information (Requirement 6) */}
      {showFooter && (
        <div className="flex flex-wrap items-center justify-between pt-3 mt-1 border-t border-amber-100 text-xs text-slate-600 font-medium gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-slate-900">Volume:</span>
            <span>{(totalVolumeKg || 4820).toLocaleString('en-IN')} KG</span>
            <span className="text-amber-400">•</span>
            <span className="font-extrabold text-slate-900">Market status:</span>
            <span className="text-emerald-700 font-bold inline-flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
              ON AANU
            </span>
          </div>

          <div className="flex items-center space-x-3 text-[11px]">
            <span className="text-slate-500">
              Range: <strong className="text-slate-800">₹{meta.range[0].toFixed(2)} — ₹{meta.range[1].toFixed(2)}</strong>
            </span>
            <span className="text-amber-400">•</span>
            <span className="text-amber-900 font-bold">{meta.mood}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default LiveBananaChart
