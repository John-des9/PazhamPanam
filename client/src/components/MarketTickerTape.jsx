import React, { useRef, useEffect, useState } from 'react'
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react'

const MarketTickerTape = ({ bananas = [], priceUpdates = {}, onSelectBanana = null }) => {
  const prevPrices = useRef({})
  const [pulseMap, setPulseMap] = useState({})

  // Detect price changes for micro-animations
  useEffect(() => {
    const newPulses = {}
    let hasChanges = false

    bananas.forEach((b) => {
      const sym = b.symbol
      const curPrice = Number(b.currentPrice || 100)
      const prev = prevPrices.current[sym]

      if (prev !== undefined && Math.abs(curPrice - prev) > 0.01) {
        newPulses[sym] = curPrice > prev ? 'up' : 'down'
        hasChanges = true
      }
      prevPrices.current[sym] = curPrice
    })

    if (hasChanges) {
      setPulseMap(newPulses)
      const timer = setTimeout(() => {
        setPulseMap({})
      }, 850)
      return () => clearTimeout(timer)
    }
  }, [bananas, priceUpdates])

  // Default list if bananas not loaded yet
  const defaultItems = [
    { symbol: 'NDR', name: 'Nendran', price: 156.30, change: 4.30, percentageChange: 2.84 },
    { symbol: 'POV', name: 'Poovan', price: 92.40, change: 1.95, percentageChange: 2.14 },
    { symbol: 'KDH', name: 'Kadhali', price: 108.20, change: -1.90, percentageChange: -1.73 },
    { symbol: 'PLK', name: 'Palayankodan', price: 128.40, change: 7.75, percentageChange: 6.42 },
    { symbol: 'CKD', name: 'Chenkadali', price: 142.80, change: 6.90, percentageChange: 5.12 },
    { symbol: 'ROB', name: 'Robusta', price: 136.50, change: -1.65, percentageChange: -1.20 },
    { symbol: 'MAT', name: 'Matti', price: 165.00, change: 5.40, percentageChange: 3.40 },
    { symbol: 'RSK', name: 'Rasakadali', price: 104.20, change: 0.95, percentageChange: 0.90 }
  ]

  const items = bananas.length > 0
    ? bananas.map((b) => {
        const live = priceUpdates[b.symbol?.toUpperCase()]
        const price = live?.price ?? b.currentPrice ?? 100
        const percentageChange = live?.percentageChange ?? b.percentageChange ?? 0
        const change = live?.change ?? b.priceChange ?? 0
        return {
          symbol: b.symbol,
          name: b.name,
          price,
          change,
          percentageChange
        }
      })
    : defaultItems

  // Duplicate items for continuous seamless loop
  const tickerItems = [...items, ...items]

  return (
    <div className="w-full bg-white/90 backdrop-blur-xs border-y border-amber-200/90 overflow-hidden select-none py-2 z-20 shadow-xs">
      <div className="flex items-center">
        {/* Left static badge */}
        <div className="hidden md:flex items-center space-x-1.5 px-3.5 py-1 bg-amber-100 border-r border-amber-200 text-[11px] font-black uppercase tracking-wider text-amber-950 flex-shrink-0 z-10 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>PAZHAM TICKER</span>
        </div>

        {/* Marquee Ticker Track */}
        <div className="overflow-hidden w-full relative">
          <div className="animate-ticker flex items-center space-x-8 whitespace-nowrap pl-4">
            {tickerItems.map((item, idx) => {
              const isPositive = (item.percentageChange || 0) >= 0
              const pulse = pulseMap[item.symbol]

              return (
                <div 
                  key={`${item.symbol}-${idx}`}
                  onClick={() => onSelectBanana && onSelectBanana(item)}
                  className={`inline-flex items-center space-x-2.5 text-xs font-sans font-medium px-3 py-1 rounded-xl hover:bg-amber-100/80 transition-all cursor-pointer active:scale-95 ${
                    pulse === 'up' ? 'ticker-nudge-up font-bold' : pulse === 'down' ? 'ticker-nudge-down font-bold' : ''
                  }`}
                >
                  <span className={`text-sm transition-transform duration-300 ${pulse === 'up' ? '-translate-y-0.5' : pulse === 'down' ? 'translate-y-0.5' : ''}`}>
                    🍌
                  </span>
                  <span className="font-black text-slate-950 uppercase tracking-tight">
                    {item.name?.toUpperCase() || item.symbol}
                  </span>
                  <span className={`font-black text-xs transition-colors ${
                    pulse === 'up' ? 'text-emerald-700' : pulse === 'down' ? 'text-rose-700' : 'text-slate-900'
                  }`}>
                    ₹{Number(item.price).toFixed(2)}
                  </span>
                  <span className={`inline-flex items-center text-[11px] font-black px-1.5 py-0.5 rounded-lg ${
                    isPositive 
                      ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' 
                      : 'text-rose-700 bg-rose-50 border border-rose-200'
                  }`}>
                    {isPositive ? (
                      <ArrowUpRight className="w-3 h-3 mr-0.5 stroke-[2.5]" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 mr-0.5 stroke-[2.5]" />
                    )}
                    {isPositive ? '+' : ''}{Number(item.percentageChange).toFixed(2)}%
                  </span>
                  <span className="text-amber-300 pl-2">•</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MarketTickerTape
