import React from 'react'
import { X, ShoppingCart, ArrowRight } from 'lucide-react'
import LiveBananaChart from './LiveBananaChart'

const LiveChartModal = ({ isOpen, onClose, banana, onOpenTrade }) => {
  if (!isOpen || !banana) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border-2 border-amber-300 p-4 sm:p-6 text-slate-900 font-sans">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-amber-100">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-sm font-black text-slate-950 uppercase tracking-wider">
              LIVE BANANA PRICE CHART
            </h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
              {banana?.symbol || 'NDR'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {onOpenTrade && (
              <button
                onClick={() => {
                  onClose()
                  onOpenTrade(banana, 'buy')
                }}
                className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl border border-amber-500 shadow-xs flex items-center space-x-1.5 transition-all"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Trade {banana?.name || 'Banana'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-amber-50 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Chart */}
        <LiveBananaChart banana={banana} height={340} />
      </div>
    </div>
  )
}

export default LiveChartModal
