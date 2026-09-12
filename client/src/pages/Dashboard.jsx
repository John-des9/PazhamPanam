import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, Search, Filter, BarChart3, Eye, Wallet, ShieldCheck, Flame } from 'lucide-react'
import { useMarket } from '../hooks/useMarket'
import { useSocket } from '../hooks/useSocket'
import { useAuth } from '../hooks/useAuth'
import { tradingService } from '../services/api'
import BananaCard from '../components/BananaCard'
import MarketSummary from '../components/MarketSummary'
import QuickTradeModal from '../components/QuickTradeModal'
import LiveChartModal from '../components/LiveChartModal'

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('marketCap')
  const [showTradeModal, setShowTradeModal] = useState(false)
  const [selectedBanana, setSelectedBanana] = useState(null)
  const [portfolioStats, setPortfolioStats] = useState(null)
  const [chartBanana, setChartBanana] = useState(null)
  const [showChartModal, setShowChartModal] = useState(false)

  const { bananas, marketStats, marketMovers, loading, error, fetchBananas } = useMarket()
  const { connected, marketSentiment, priceUpdates } = useSocket()
  const { user, isAuthenticated, demoLogin } = useAuth()

  // Fetch user portfolio summary for top dashboard cards
  useEffect(() => {
    if (isAuthenticated) {
      tradingService.getPortfolio()
        .then(res => {
          if (res.data?.success) {
            setPortfolioStats(res.data.portfolio)
          }
        })
        .catch(err => console.warn('Could not fetch portfolio stats:', err))
    }
  }, [isAuthenticated])

  // Filter and sort bananas
  const filteredBananas = bananas
    .filter(banana => {
      const matchesSearch = banana.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           banana.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || banana.category === selectedCategory
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      const priceA = priceUpdates[a.symbol]?.price || a.currentPrice
      const priceB = priceUpdates[b.symbol]?.price || b.currentPrice
      const changeA = priceUpdates[a.symbol]?.percentageChange || a.percentageChange
      const changeB = priceUpdates[b.symbol]?.percentageChange || b.percentageChange

      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'price':
          return priceB - priceA
        case 'change':
          return changeB - changeA
        case 'volume':
          return (b.volume24h || 0) - (a.volume24h || 0)
        default:
          return (b.marketCap || 0) - (a.marketCap || 0)
      }
    })

  const categories = [
    { value: 'all', label: 'All Bananas 🍌' },
    { value: 'premium', label: 'Premium (Wayanad)' },
    { value: 'traditional', label: 'Traditional (Palakkad)' },
    { value: 'commercial', label: 'Commercial (Thrissur)' },
    { value: 'cooking', label: 'Cooking (Idukki)' },
    { value: 'dessert', label: 'Dessert (Alappuzha)' }
  ]

  const sortOptions = [
    { value: 'marketCap', label: 'Market Cap' },
    { value: 'price', label: 'Highest Price' },
    { value: 'change', label: 'Top Gainers' },
    { value: 'volume', label: 'Most Traded Volume' },
    { value: 'name', label: 'Alphabetical (A-Z)' }
  ]

  const handleQuickTrade = (banana, type = 'buy') => {
    setSelectedBanana({ ...banana, tradeType: type })
    setShowTradeModal(true)
  }

  const handleViewChart = (banana) => {
    setChartBanana(banana)
    setShowChartModal(true)
  }

  const userCash = user?.virtualBalance !== undefined ? user.virtualBalance : 10000
  const portfolioVal = portfolioStats?.currentValue || 0
  const totalNetWorth = userCash + portfolioVal
  const todaysPL = portfolioStats?.todaysPnL || (portfolioVal > 0 ? (portfolioVal * 0.024) : 0)

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Top Header / Greeting Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="text-xs font-bold uppercase tracking-wider bg-banana-500/15 text-banana-800 px-3 py-1 rounded-full border border-banana-500/20">
                Pazham Panam Trading Desk 🍌
              </span>
              <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-full text-xs">
                <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                <span className="font-semibold text-slate-700">
                  {connected ? 'Live Socket Feed' : 'Connecting to Exchange...'}
                </span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-2.5">
              {isAuthenticated ? `Welcome back, ${user?.username}!` : 'Kerala Banana Stock Market'}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {marketSentiment || 'Pazham Market ON AANU • Trade Kerala banana varieties in real-time'}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {!isAuthenticated ? (
              <button
                onClick={async () => {
                  try {
                    await demoLogin()
                  } catch (e) {
                    console.error(e)
                  }
                }}
                className="py-2.5 px-5 bg-banana-500 hover:bg-banana-600 text-slate-950 font-bold text-sm rounded-xl shadow-md transition-all flex items-center space-x-2"
              >
                <span>Instant Demo Login</span>
              </button>
            ) : (
              <Link
                to="/portfolio"
                className="py-2.5 px-5 bg-slate-900 hover:bg-slate-800 text-banana-400 font-bold text-sm rounded-xl shadow-md transition-all flex items-center space-x-2"
              >
                <Eye className="w-4 h-4" />
                <span>My Pazham Portfolio</span>
              </Link>
            )}
          </div>
        </div>

        {/* Real-time Market Overview Bar as requested in Section 16 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              TOTAL PAZHAM PANAM
            </span>
            <div className="text-2xl font-black font-mono text-slate-900 mt-1">
              ₹{totalNetWorth.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <span className="text-xs text-slate-500 mt-0.5 block">Virtual Balance</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              PORTFOLIO VALUE
            </span>
            <div className="text-2xl font-black font-mono text-banana-600 mt-1">
              ₹{portfolioVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <span className="text-xs text-slate-500 mt-0.5 block">Active Banana Holdings</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              TODAY'S P/L
            </span>
            <div className="text-2xl font-black font-mono text-emerald-600 mt-1">
              +₹{Math.abs(todaysPL).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <span className="text-xs text-emerald-600 font-semibold mt-0.5 block">
              +2.84% Bullish Market
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              MARKET STATUS
            </span>
            <div className="flex items-center space-x-2 my-1">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xl font-black text-slate-900 tracking-wide">
                🟢 ON AANU
              </span>
            </div>
            <span className="text-xs text-emerald-700 font-semibold block">
              Market 24/7 Active
            </span>
          </div>
        </div>

        {/* Top Movers (Gainers & Losers) + Market Summary */}
        <MarketSummary stats={marketStats} movers={marketMovers} bananas={bananas} onSelectBanana={handleViewChart} />

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search Palayankodan, Nendran, Robusta, etc..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-banana-500 focus:bg-white transition-colors"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none focus:border-banana-500"
            >
              {categories.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-500 font-semibold">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none focus:border-banana-500"
            >
              {sortOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Banana Market Stock Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBananas.map(banana => (
            <BananaCard
              key={banana._id || banana.symbol}
              banana={banana}
              priceUpdate={priceUpdates[banana.symbol]}
              onQuickTrade={handleQuickTrade}
              onViewChart={handleViewChart}
            />
          ))}
        </div>

        {/* Empty Search State */}
        {filteredBananas.length === 0 && !loading.bananas && (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/80 p-8 my-8">
            <div className="text-5xl mb-3">🔍</div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">
              Oru pazhavum kandilla!
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              No banana varieties match your current filter criteria.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
              className="px-4 py-2 bg-banana-500 font-bold text-xs rounded-xl text-slate-900"
            >
              Reset Search & Filters
            </button>
          </div>
        )}

      </div>

      {/* Live Chart Modal (Unified Reusable LiveBananaChart) */}
      <LiveChartModal
        isOpen={showChartModal}
        onClose={() => {
          setShowChartModal(false)
          setChartBanana(null)
        }}
        banana={chartBanana}
        onOpenTrade={handleQuickTrade}
      />

      {/* Quick Trade Modal */}
      {showTradeModal && selectedBanana && (
        <QuickTradeModal
          banana={selectedBanana}
          isOpen={showTradeModal}
          initialType={selectedBanana.tradeType || 'buy'}
          onClose={() => {
            setShowTradeModal(false)
            setSelectedBanana(null)
          }}
          onSuccess={() => {
            fetchBananas()
          }}
        />
      )}
    </div>
  )
}

export default Dashboard