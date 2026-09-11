import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, ShoppingCart, DollarSign, PieChart, ShieldCheck, Sparkles } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useSocket } from '../hooks/useSocket'
import { tradingService } from '../services/api'
import QuickTradeModal from '../components/QuickTradeModal'

const Portfolio = () => {
  const { user, isAuthenticated, demoLogin } = useAuth()
  const { priceUpdates } = useSocket()
  const [portfolioData, setPortfolioData] = useState(null)
  const [holdings, setHoldings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedBanana, setSelectedBanana] = useState(null)
  const [tradeModalOpen, setTradeModalOpen] = useState(false)
  const [initialTradeType, setInitialTradeType] = useState('buy')

  useEffect(() => {
    if (isAuthenticated) {
      loadPortfolio()
    } else {
      setLoading(false)
    }
  }, [isAuthenticated])

  const loadPortfolio = async () => {
    try {
      setLoading(true)
      const res = await tradingService.getPortfolio()
      if (res.data?.success) {
        setPortfolioData(res.data.portfolio)
        setHoldings(res.data.holdings || [])
      }
    } catch (err) {
      console.error('Failed to load portfolio:', err)
      setError('Portfolio load cheyyan pattiyilla! 📊😭')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenTrade = (banana, type) => {
    setSelectedBanana({
      ...banana,
      currentPrice: banana.currentPrice || priceUpdates[banana.symbol]?.price || 100
    })
    setInitialTradeType(type)
    setTradeModalOpen(true)
  }

  // Calculate live dynamic metrics using socket updates
  const liveHoldings = holdings.map(h => {
    const livePrice = priceUpdates[h.banana?.symbol]?.price || h.banana?.currentPrice || h.averageBuyPrice
    const currentValue = h.quantity * livePrice
    const invested = h.totalInvested || (h.quantity * h.averageBuyPrice)
    const pnl = currentValue - invested
    const pnlPercentage = invested > 0 ? (pnl / invested) * 100 : 0

    return {
      ...h,
      livePrice,
      currentValue,
      livePnL: pnl,
      livePnLPercentage: pnlPercentage
    }
  })

  const totalInvested = liveHoldings.reduce((sum, h) => sum + (h.totalInvested || 0), 0)
  const totalPortfolioValue = liveHoldings.reduce((sum, h) => sum + h.currentValue, 0)
  const totalPnL = totalPortfolioValue - totalInvested
  const totalPnLPercentage = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0
  const virtualCash = user?.virtualBalance !== undefined ? user.virtualBalance : 10000
  const netWorth = virtualCash + totalPortfolioValue

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 px-4">
        <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-xl border border-slate-200 text-center">
          <div className="w-16 h-16 bg-banana-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
            🍌
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">My Pazham Portfolio</h2>
          <p className="text-slate-600 text-sm mb-6">
            Log in to view your Kerala banana holdings, track profits, and manage trades.
          </p>
          <button
            onClick={async () => {
              try {
                await demoLogin()
                loadPortfolio()
              } catch (e) {
                console.error(e)
              }
            }}
            className="w-full py-3.5 bg-banana-500 hover:bg-banana-600 text-slate-950 font-bold rounded-2xl shadow-lg transition-all"
          >
            Access Instant Demo Portfolio (₹25,000) 💼
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-banana-100 text-banana-800 px-2.5 py-1 rounded-full">
                Ente Kayyile Pazham 🍌
              </span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-2">
              Portfolio Dashboard
            </h1>
            <p className="text-slate-500 text-sm">
              Real-time valuation of your Kerala banana varieties and virtual assets.
            </p>
          </div>

          <Link
            to="/dashboard"
            className="self-start sm:self-auto py-2.5 px-5 bg-slate-900 text-banana-400 hover:bg-slate-800 font-bold text-sm rounded-xl shadow-md flex items-center space-x-2 transition-all"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Explore Banana Market</span>
          </Link>
        </div>

        {/* Top KPI Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Net Worth */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Pazham Panam (Net Worth)
            </span>
            <div className="text-2xl lg:text-3xl font-black font-mono text-slate-900 my-2">
              ₹{netWorth.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500 flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Cash + Pazham Assets</span>
            </div>
          </div>

          {/* Banana Holdings Value */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pazham Holdings Value
            </span>
            <div className="text-2xl lg:text-3xl font-black font-mono text-banana-600 my-2">
              ₹{totalPortfolioValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500">
              Invested: ₹{totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>

          {/* Virtual Liquid Cash */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Available Cash Balance
            </span>
            <div className="text-2xl lg:text-3xl font-black font-mono text-slate-800 my-2">
              ₹{Number(virtualCash).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-emerald-600 font-semibold">
              Ready to trade
            </div>
          </div>

          {/* Overall P&L */}
          <div className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between ${
            totalPnL >= 0 
              ? 'bg-emerald-50/50 border-emerald-200/80' 
              : 'bg-rose-50/50 border-rose-200/80'
          }`}>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Profit / Loss
            </span>
            <div className={`text-2xl lg:text-3xl font-black font-mono my-2 flex items-baseline ${
              totalPnL >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}>
              {totalPnL >= 0 ? '+' : ''}₹{Math.abs(totalPnL).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={`text-xs font-bold flex items-center ${
              totalPnL >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}>
              {totalPnL >= 0 ? (
                <ArrowUpRight className="w-4 h-4 mr-1 stroke-[2.5]" />
              ) : (
                <ArrowDownRight className="w-4 h-4 mr-1 stroke-[2.5]" />
              )}
              <span>{totalPnL >= 0 ? '+' : ''}{totalPnLPercentage.toFixed(2)}% Overall Return</span>
            </div>
          </div>
        </div>

        {/* Holdings Section */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden mb-8">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                My Banana Varieties ({liveHoldings.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Live prices continuously updated via real-time market simulator.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500">
              <div className="w-8 h-8 border-4 border-banana-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <span>Loading your banana inventory...</span>
            </div>
          ) : liveHoldings.length === 0 ? (
            /* Empty State */
            <div className="py-16 px-4 text-center">
              <div className="w-20 h-20 bg-banana-50 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 border border-banana-100 shadow-inner">
                🍌
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-1">
                Kayyil pazham onnum illa da! 😭
              </h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
                You haven't bought any banana stocks yet. Head over to the live market to buy Palayankodan, Nendran, or Robusta!
              </p>
              <Link
                to="/dashboard"
                className="inline-flex items-center space-x-2 py-3 px-6 bg-banana-500 hover:bg-banana-600 text-slate-950 font-bold rounded-2xl shadow-lg transition-all"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Go to Banana Market</span>
              </Link>
            </div>
          ) : (
            /* Holdings Table (Desktop) and Cards (Mobile) */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                    <th className="py-3.5 px-6">Variety</th>
                    <th className="py-3.5 px-4">Holdings</th>
                    <th className="py-3.5 px-4">Avg. Buy Price</th>
                    <th className="py-3.5 px-4">Current Price</th>
                    <th className="py-3.5 px-4">Current Value</th>
                    <th className="py-3.5 px-4">Profit / Loss</th>
                    <th className="py-3.5 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {liveHoldings.map((holding) => {
                    const isPos = holding.livePnL >= 0
                    const banana = holding.banana || {}

                    return (
                      <tr key={holding.id || holding._id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Variety */}
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200/60 flex-shrink-0">
                              <img
                                src={banana.image || `/images/bananas/${banana.symbol?.toLowerCase()}.jpg`}
                                alt={banana.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null
                                  e.target.src = '/banana-logo.svg'
                                }}
                              />
                            </div>
                            <div>
                              <Link 
                                to={`/banana/${banana.symbol}`}
                                className="font-bold text-slate-900 hover:text-banana-600 transition-colors"
                              >
                                {banana.name}
                              </Link>
                              <span className="block text-xs font-mono text-slate-400 font-semibold">
                                {banana.symbol}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Quantity */}
                        <td className="py-4 px-4 font-mono font-bold text-slate-800">
                          {holding.quantity} units
                        </td>

                        {/* Avg Buy Price */}
                        <td className="py-4 px-4 font-mono text-slate-600">
                          ₹{Number(holding.averageBuyPrice || 0).toFixed(2)}
                        </td>

                        {/* Current Price */}
                        <td className="py-4 px-4 font-mono font-bold text-slate-900">
                          ₹{Number(holding.livePrice || 0).toFixed(2)}
                        </td>

                        {/* Current Value */}
                        <td className="py-4 px-4 font-mono font-bold text-slate-900">
                          ₹{Number(holding.currentValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Profit / Loss */}
                        <td className="py-4 px-4">
                          <div className={`font-mono font-bold flex items-center ${
                            isPos ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {isPos ? '+' : ''}₹{Math.abs(holding.livePnL).toFixed(2)}
                            <span className="ml-1 text-xs font-semibold">
                              ({isPos ? '+' : ''}{holding.livePnLPercentage.toFixed(2)}%)
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleOpenTrade(banana, 'buy')}
                              className="px-3 py-1.5 bg-banana-500 hover:bg-banana-600 text-slate-950 font-bold text-xs rounded-lg transition-colors"
                            >
                              Buy More
                            </button>
                            <button
                              onClick={() => handleOpenTrade(banana, 'sell')}
                              className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-xs rounded-lg transition-colors"
                            >
                              Sell
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Trade Modal */}
      {tradeModalOpen && selectedBanana && (
        <QuickTradeModal
          banana={selectedBanana}
          isOpen={tradeModalOpen}
          initialType={initialTradeType}
          onClose={() => {
            setTradeModalOpen(false)
            setSelectedBanana(null)
          }}
          onSuccess={() => {
            loadPortfolio()
          }}
        />
      )}
    </div>
  )
}

export default Portfolio