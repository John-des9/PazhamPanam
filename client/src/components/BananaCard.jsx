import React from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, BarChart3, ShoppingCart, ArrowUpRight, ArrowDownRight } from 'lucide-react'

// Generate smooth SVG sparkline path
const generateSparkline = (isPositive, symbol) => {
  // Deterministic seed based on symbol
  const seed = symbol.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const points = []
  const width = 120
  const height = 36
  const numPoints = 8

  for (let i = 0; i < numPoints; i++) {
    const x = (i / (numPoints - 1)) * width
    // Base trend according to isPositive
    const trendProgress = isPositive ? (i / (numPoints - 1)) : 1 - (i / (numPoints - 1))
    const pseudoRandom = Math.sin(seed * (i + 1)) * 6
    const y = height - (trendProgress * 22 + 6 + pseudoRandom)
    points.push(`${x.toFixed(1)},${Math.max(4, Math.min(height - 4, y)).toFixed(1)}`)
  }

  return `M ${points.join(' L ')}`
}

const BananaCard = ({ banana, priceUpdate, onQuickTrade }) => {
  const currentPrice = priceUpdate?.price || banana.currentPrice
  const percentageChange = priceUpdate?.percentageChange !== undefined 
    ? priceUpdate.percentageChange 
    : banana.percentageChange
  const priceChange = priceUpdate?.change !== undefined 
    ? priceUpdate.change 
    : banana.priceChange || (currentPrice - (banana.previousPrice || currentPrice))

  const isPositive = percentageChange >= 0
  const isUpdating = priceUpdate?.isNew
  const direction = priceUpdate?.direction || (isPositive ? 'up' : 'down')
  
  const sparklinePath = generateSparkline(isPositive, banana.symbol)

  return (
    <div 
      className={`card relative bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-banana-400/80 transition-all duration-300 flex flex-col justify-between group overflow-hidden ${
        isUpdating 
          ? direction === 'up' 
            ? 'ring-2 ring-emerald-500/40 bg-emerald-50/20' 
            : 'ring-2 ring-rose-500/40 bg-rose-50/20' 
          : ''
      }`}
    >
      {/* Top Banner: Banana Identity & Status */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-100 group-hover:scale-105 transition-transform duration-300">
              <img 
                src={banana.image || `/images/bananas/${banana.symbol.toLowerCase()}.jpg`}
                alt={banana.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null
                  e.target.src = '/banana-logo.svg'
                }}
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-900 text-base leading-tight group-hover:text-banana-600 transition-colors">
                  {banana.name}
                </h3>
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 tracking-wide font-mono">
                  {banana.symbol}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  banana.category === 'premium' ? 'bg-amber-100 text-amber-800' :
                  banana.category === 'traditional' ? 'bg-indigo-100 text-indigo-800' :
                  banana.category === 'commercial' ? 'bg-emerald-100 text-emerald-800' :
                  banana.category === 'cooking' ? 'bg-orange-100 text-orange-800' :
                  'bg-sky-100 text-sky-800'
                }`}>
                  {banana.category}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-medium text-emerald-700">RIPE</span>
          </div>
        </div>

        {/* Price & Sparkline Section */}
        <div className="flex items-end justify-between my-3 pt-2 border-t border-slate-100">
          <div>
            <div className="text-xs text-slate-400 font-medium mb-0.5">Live Pazham Price</div>
            <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
              ₹{Number(currentPrice).toFixed(2)}
            </div>
            <div className={`flex items-center text-xs font-bold mt-0.5 ${
              isPositive ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {isPositive ? (
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5 stroke-[2.5]" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5 stroke-[2.5]" />
              )}
              <span>
                {isPositive ? '+' : ''}₹{Math.abs(priceChange || 0).toFixed(2)} ({Number(percentageChange).toFixed(2)}%)
              </span>
            </div>
          </div>

          {/* Mini Sparkline Chart */}
          <div className="w-28 h-10 flex items-center justify-end">
            <svg viewBox="0 0 120 36" className="w-full h-full overflow-visible">
              <path
                d={sparklinePath}
                fill="none"
                stroke={isPositive ? '#10B981' : '#EF4444'}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Quick Market Stats */}
        <div className="grid grid-cols-2 gap-2 text-xs py-2 px-2.5 bg-slate-50/70 rounded-xl mb-4 border border-slate-100">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">24h Volume</span>
            <span className="font-semibold text-slate-700 font-mono">
              {(banana.volume24h || 1250).toLocaleString('en-IN')} units
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Origin / Harvest</span>
            <span className="font-semibold text-slate-700 truncate block">
              {banana.origin || 'Kerala'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2 pt-1">
        <Link
          to={`/banana/${banana.symbol}`}
          className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors"
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Chart</span>
        </Link>
        
        <button
          onClick={() => onQuickTrade(banana, 'buy')}
          className="flex-1 py-2 px-3 bg-banana-500 hover:bg-banana-600 active:bg-banana-700 text-slate-900 font-bold text-xs rounded-xl shadow-sm hover:shadow-md flex items-center justify-center space-x-1.5 transition-all"
        >
          <ShoppingCart className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Buy Pazham</span>
        </button>
      </div>

      {/* Live Tick Flash Dot */}
      {isUpdating && (
        <span className="absolute top-3 right-3 flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            direction === 'up' ? 'bg-emerald-400' : 'bg-rose-400'
          }`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${
            direction === 'up' ? 'bg-emerald-500' : 'bg-rose-500'
          }`}></span>
        </span>
      )}
    </div>
  )
}

export default BananaCard