import React, { useState } from 'react'
import { ArrowUpRight, ArrowDownRight, Radio, ExternalLink, Sparkles } from 'lucide-react'

const TerminalMarketWatch = ({
  bananas = [],
  priceUpdates = {},
  selectedSymbol = 'NDR',
  onSelectBanana = null
}) => {
  const [filter, setFilter] = useState('ALL')

  // News items showing subtle authentic Kerala banana humor
  const mandiNews = [
    { time: '09:42 AM', tag: 'MANDI PULSE', text: 'Palakkad wholesale arrivals surge 14%. Chip processors aggressive bidders.' },
    { time: '10:15 AM', tag: 'MOMENTUM', text: '"Da mone, Nendran kuthichu kayari." Sadhya festival bookings ramp up.' },
    { time: '11:30 AM', tag: 'SUPPORT', text: '"Poovan innu strong aanu." Steady retail absorption at ₹88.60 / KG.' },
    { time: '01:05 PM', tag: 'SENTIMENT', text: '"Market ippo motham kulam aanu." Sudden rain delays Thiruvananthapuram lorry dispatch.' },
    { time: '02:40 PM', tag: 'DERIVATIVES', text: '"Paisa poyi mone" — short sellers trapped as Kadhali temple bids hit ₹184 / KG.' }
  ]

  const items = bananas.map((b) => {
    const live = priceUpdates[b.symbol?.toUpperCase()]
    const price = live?.price ?? b.currentPrice ?? 100
    const percentageChange = live?.percentageChange ?? b.percentageChange ?? 0
    const change = live?.change ?? b.priceChange ?? 0
    return {
      ...b,
      price,
      change,
      percentageChange
    }
  })

  const filteredItems = items.filter((item) => {
    if (filter === 'GAINERS') return (item.percentageChange || 0) >= 0
    if (filter === 'LOSERS') return (item.percentageChange || 0) < 0
    if (filter === 'PREMIUM') return item.category === 'premium' || item.category === 'traditional'
    return true
  })

  return (
    <div className="bg-white border-2 border-amber-200/90 rounded-2xl p-5 font-sans text-xs flex flex-col justify-between shadow-sm select-none">
      <div>
        {/* Header & Category Filters */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-amber-100">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-xs font-black tracking-wider text-slate-900 uppercase">
              MANDI BOARD WATCH
            </span>
            <span className="text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full font-bold">
              {filteredItems.length} CULTIVARS
            </span>
          </div>

          <div className="flex items-center space-x-1">
            {['ALL', 'GAINERS', 'LOSERS'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-2 py-0.5 text-[10px] font-bold rounded-lg transition-all ${
                  filter === f
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'bg-amber-50 text-slate-600 hover:bg-amber-100'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Dense Financial Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] text-slate-500 border-b border-amber-100 uppercase font-bold">
                <th className="pb-2">CULTIVAR</th>
                <th className="pb-2 text-right">SPOT (₹/KG)</th>
                <th className="pb-2 text-right">24H CHG</th>
                <th className="pb-2 text-right hidden sm:table-cell">VOL (KG)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100/80">
              {filteredItems.map((b) => {
                const isSelected = b.symbol?.toUpperCase() === selectedSymbol?.toUpperCase()
                const isPositive = (b.percentageChange || 0) >= 0

                return (
                  <tr
                    key={b.symbol || b._id}
                    onClick={() => onSelectBanana && onSelectBanana(b)}
                    className={`cursor-pointer transition-colors group ${
                      isSelected
                        ? 'bg-amber-100/70 text-slate-950 font-bold'
                        : 'hover:bg-amber-50/70 text-slate-700'
                    }`}
                  >
                    <td className="py-2.5 pr-2">
                      <div className="flex items-center space-x-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-500' : 'bg-transparent'}`} />
                        <div>
                          <div className="text-xs font-black text-slate-900 group-hover:text-amber-600 transition-colors">
                            {b.symbol}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[90px]">
                            {b.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 text-right text-slate-900 font-extrabold text-xs">
                      ₹{Number(b.price).toFixed(2)}
                    </td>
                    <td className="py-2.5 text-right text-xs">
                      <span className={`inline-flex items-center font-bold px-1.5 py-0.5 rounded text-[11px] ${
                        isPositive 
                          ? 'text-emerald-700 bg-emerald-50' 
                          : 'text-rose-700 bg-rose-50'
                      }`}>
                        {isPositive ? '+' : ''}{Number(b.percentageChange).toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-[11px] text-slate-500 hidden sm:table-cell">
                      {(b.volume24h || 12500).toLocaleString('en-IN')} KG
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mandi Wire (Kerala Humor Intelligence Feed) */}
      <div className="mt-4 pt-3 border-t border-amber-100">
        <div className="flex items-center space-x-2 text-[10px] font-black text-amber-900 uppercase tracking-wider mb-2">
          <Radio className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
          <span>MANDI WIRE // KERALA INTELLIGENCE</span>
        </div>
        <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
          {mandiNews.slice(0, 3).map((item, idx) => (
            <div key={idx} className="p-2 bg-amber-50/70 border border-amber-200/80 rounded-xl text-[11px] leading-tight">
              <div className="flex items-center justify-between text-slate-400 mb-0.5 text-[10px]">
                <span className="font-bold text-amber-800">{item.tag}</span>
                <span>{item.time}</span>
              </div>
              <p className="text-slate-800 font-medium">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TerminalMarketWatch
