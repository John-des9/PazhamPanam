import React from 'react'
import { TrendingUp, TrendingDown, Flame, BarChart3, Activity, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

const MarketSummary = ({ stats, movers, bananas = [] }) => {
  // Derive live gainers and losers if not provided by stats
  const sortedByChange = [...bananas].sort((a, b) => (b.percentageChange || 0) - (a.percentageChange || 0))
  const topGainers = stats?.topGainers || sortedByChange.filter(b => (b.percentageChange || 0) >= 0).slice(0, 3)
  const topLosers = stats?.topLosers || [...sortedByChange].reverse().filter(b => (b.percentageChange || 0) < 0).slice(0, 3)

  const totalMarketCap = stats?.stats?.totalMarketCap || 
    bananas.reduce((sum, b) => sum + (b.currentPrice * (b.volume24h || 1500)), 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
      {/* 1. Market Status Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Pazham Exchange Overview
            </span>
            <span className="flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>MARKET RIPE 🟢</span>
            </span>
          </div>

          <div className="text-xs text-slate-500 font-medium">Aggregate Market Cap</div>
          <div className="text-2xl lg:text-3xl font-black font-mono text-slate-900 mt-1 mb-3">
            ₹{Number(totalMarketCap).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>

          <div className="flex items-center justify-between text-xs py-2 px-3 bg-slate-50 rounded-xl font-medium text-slate-600">
            <span>Trading Varieties: <strong className="text-slate-900">{bananas.length} Active</strong></span>
            <span>Settlement: <strong className="text-emerald-600">T+0 Instant</strong></span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span>Kerala Agriculture Index (PAZHAM)</span>
          <span className="text-banana-600 font-bold">100% Organically Tradable</span>
        </div>
      </div>

      {/* 2. Top Gainers Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-1.5">
              <span className="text-base">🔥</span>
              <h3 className="font-black text-slate-900 text-sm tracking-wide uppercase">
                Top Gainers
              </h3>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Bullish Pazham
            </span>
          </div>

          <div className="space-y-2.5">
            {topGainers.length > 0 ? (
              topGainers.map((banana) => (
                <Link
                  key={banana._id || banana.symbol}
                  to={`/banana/${banana.symbol}`}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="text-lg">🍌</span>
                    <div>
                      <span className="font-bold text-xs text-slate-800 group-hover:text-banana-600 transition-colors block leading-tight">
                        {banana.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 font-semibold">
                        {banana.symbol}
                      </span>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-xs font-bold text-slate-900">
                      ₹{Number(banana.currentPrice).toFixed(2)}
                    </div>
                    <div className="text-[11px] font-bold text-emerald-600">
                      +{Number(banana.percentageChange || 0).toFixed(2)}%
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-4 text-xs text-slate-400">All bananas stable</div>
            )}
          </div>
        </div>

        <div className="text-[11px] text-slate-400 mt-2 pt-2.5 border-t border-slate-100 flex items-center justify-between">
          <span>Momentum Leaders</span>
          <span className="text-emerald-600 font-bold">Rocket Aayi 🚀</span>
        </div>
      </div>

      {/* 3. Top Losers Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-1.5">
              <span className="text-base">📉</span>
              <h3 className="font-black text-slate-900 text-sm tracking-wide uppercase">
                Top Losers
              </h3>
            </div>
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
              Dip Buying
            </span>
          </div>

          <div className="space-y-2.5">
            {topLosers.length > 0 ? (
              topLosers.map((banana) => (
                <Link
                  key={banana._id || banana.symbol}
                  to={`/banana/${banana.symbol}`}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="text-lg">🍌</span>
                    <div>
                      <span className="font-bold text-xs text-slate-800 group-hover:text-banana-600 transition-colors block leading-tight">
                        {banana.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 font-semibold">
                        {banana.symbol}
                      </span>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-xs font-bold text-slate-900">
                      ₹{Number(banana.currentPrice).toFixed(2)}
                    </div>
                    <div className="text-[11px] font-bold text-rose-600">
                      {Number(banana.percentageChange || 0).toFixed(2)}%
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-4 text-xs text-slate-400">No bananas in negative</div>
            )}
          </div>
        </div>

        <div className="text-[11px] text-slate-400 mt-2 pt-2.5 border-t border-slate-100 flex items-center justify-between">
          <span>Discount Opportunities</span>
          <span className="text-rose-600 font-bold">Buy the Dip 💸</span>
        </div>
      </div>
    </div>
  )
}

export default MarketSummary