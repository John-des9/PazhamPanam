import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, BarChart3, CandlestickChart as CandlestickIcon, LineChart, ShoppingCart, DollarSign, ShieldCheck, MapPin, Calendar, Award } from 'lucide-react'
import { useMarket } from '../hooks/useMarket'
import { useAuth } from '../hooks/useAuth'
import { useSocket } from '../hooks/useSocket'
import { tradingService } from '../services/api'
import PriceChart from '../components/PriceChart'
import CandlestickChart from '../components/CandlestickChart'
import VolumeChart from '../components/VolumeChart'
import QuickTradeModal from '../components/QuickTradeModal'
import LiveBananaChart from '../components/LiveBananaChart'

const BananaDetail = () => {
  const { symbol } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated, demoLogin } = useAuth()
  const { bananas, getPriceHistory, loading } = useMarket()
  const { priceUpdates } = useSocket()
  
  const [timeframe, setTimeframe] = useState('1d')
  const [chartType, setChartType] = useState('line') // line, candlestick, volume
  const [showTradeModal, setShowTradeModal] = useState(false)
  const [tradeType, setTradeType] = useState('buy')
  const [historyData, setHistoryData] = useState([])
  const [userHolding, setUserHolding] = useState(null)
  const [loadingHolding, setLoadingHolding] = useState(false)

  // Find banana by symbol
  const banana = bananas.find(b => b.symbol?.toUpperCase() === symbol?.toUpperCase())
  const livePriceUpdate = priceUpdates[symbol?.toUpperCase()]

  const currentPrice = livePriceUpdate?.price || banana?.currentPrice || 0
  const percentageChange = livePriceUpdate?.percentageChange !== undefined 
    ? livePriceUpdate.percentageChange 
    : banana?.percentageChange || 0
  const priceChange = livePriceUpdate?.change !== undefined 
    ? livePriceUpdate.change 
    : banana?.priceChange || 0
  const isPositive = percentageChange >= 0

  useEffect(() => {
    if (banana) {
      fetchHistory()
    }
  }, [banana?.symbol, timeframe])

  useEffect(() => {
    if (isAuthenticated && banana) {
      fetchUserHolding()
    }
  }, [isAuthenticated, banana?.symbol])

  const fetchHistory = async () => {
    if (!banana) return
    try {
      const data = await getPriceHistory(banana.symbol || banana._id, timeframe)
      setHistoryData(data || [])
    } catch (err) {
      console.error('Error fetching price history:', err)
    }
  }

  const fetchUserHolding = async () => {
    try {
      setLoadingHolding(true)
      const res = await tradingService.getPortfolio()
      const match = res.data?.holdings?.find(
        h => h.banana?.symbol === banana.symbol || h.banana?.name === banana.name
      )
      setUserHolding(match || null)
    } catch (err) {
      console.warn('Error fetching holding:', err)
    } finally {
      setLoadingHolding(false)
    }
  }

  const handleOpenTrade = (type) => {
    setTradeType(type)
    setShowTradeModal(true)
  }

  if (!banana && !loading.bananas) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-md">
          <div className="text-6xl mb-4">🤔</div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Banana Not Found</h2>
          <p className="text-slate-600 text-sm mb-6">
            The banana variety "{symbol}" could not be found in our Kerala market exchange.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 bg-banana-500 hover:bg-banana-600 font-bold text-slate-950 rounded-2xl transition-all"
          >
            Back to Market
          </button>
        </div>
      </div>
    )
  }

  const chartTypes = [
    { value: 'line', label: 'Price Line', icon: LineChart },
    { value: 'candlestick', label: 'Candlestick', icon: CandlestickIcon },
    { value: 'volume', label: 'Trading Volume', icon: BarChart3 }
  ]

  // Holding calculations
  const ownedUnits = userHolding?.quantity || 0
  const avgBuyPrice = userHolding?.averageBuyPrice || 0
  const totalInvestedInBanana = userHolding?.totalInvested || (ownedUnits * avgBuyPrice)
  const currentValuation = ownedUnits * currentPrice
  const holdingPnL = currentValuation - totalInvestedInBanana
  const holdingPnLPercent = totalInvestedInBanana > 0 ? (holdingPnL / totalInvestedInBanana) * 100 : 0

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Live Market
          </Link>

          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-700 font-mono">LIVE FEED</span>
          </div>
        </div>

        {/* Hero Asset Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            
            {/* Banana Info */}
            <div className="flex items-center space-x-5">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 shadow-sm flex-shrink-0">
                <img
                  src={banana?.image || `/images/bananas/${banana?.symbol?.toLowerCase()}.jpg`}
                  alt={banana?.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null
                    const fallback = `/images/bananas/${banana?.name?.toLowerCase()}.jpg`
                    if (e.target.src !== fallback) {
                      e.target.src = fallback
                    }
                  }}
                />
              </div>

              <div>
                <div className="flex items-center space-x-2.5">
                  <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                    {banana?.name}
                  </h1>
                  <span className="text-xs font-mono font-bold bg-slate-900 text-banana-400 px-2.5 py-1 rounded-lg">
                    {banana?.symbol}
                  </span>
                </div>
                <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-xl">
                  {banana?.description}
                </p>
                <div className="flex items-center space-x-3 mt-2 text-xs text-slate-400 font-medium">
                  <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1 text-banana-600" /> {banana?.origin}</span>
                  <span>•</span>
                  <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1 text-slate-500" /> {banana?.season}</span>
                  <span>•</span>
                  <span className="capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">{banana?.category}</span>
                </div>
              </div>
            </div>

            {/* Live Price & Trade Action CTA */}
            <div className="flex flex-col sm:items-end justify-center border-t sm:border-t-0 pt-4 sm:pt-0">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Spot Price / KG</span>
              <div className="text-3xl sm:text-4xl font-black font-mono text-slate-900 my-1">
                ₹{Number(currentPrice).toFixed(2)}{' '}
                <span className="text-sm font-sans text-slate-500 font-normal">/ KG</span>
              </div>
              <div className={`flex items-center text-sm font-bold ${
                isPositive ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {isPositive ? (
                  <ArrowUpRight className="w-4 h-4 mr-0.5 stroke-[3]" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 mr-0.5 stroke-[3]" />
                )}
                <span>
                  {isPositive ? '+' : ''}₹{Math.abs(priceChange).toFixed(2)} ({Number(percentageChange).toFixed(2)}%)
                </span>
              </div>

              {/* Prominent Buy & Sell Buttons */}
              <div className="flex items-center space-x-3 mt-4 w-full sm:w-auto">
                <button
                  onClick={() => handleOpenTrade('buy')}
                  className="flex-1 sm:flex-initial py-3 px-6 bg-banana-500 hover:bg-banana-600 active:bg-banana-700 text-slate-950 font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-1.5"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>BUY PAZHAM</span>
                </button>
                <button
                  onClick={() => handleOpenTrade('sell')}
                  className="flex-1 sm:flex-initial py-3 px-6 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-1.5"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>SELL PAZHAM</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Chart Viewport Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
            {/* Chart Type Selector */}
            <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl">
              {chartTypes.map(type => {
                const Icon = type.icon
                return (
                  <button
                    key={type.value}
                    onClick={() => setChartType(type.value)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      chartType === type.value
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{type.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Timeframe selector (1H | 1D | 1W | 1M) as explicitly requested */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
              {['1h', '1d', '1w', '1m'].map(tf => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                    timeframe === tf
                      ? 'bg-slate-900 text-banana-400 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Chart Component */}
          <div className="h-80 w-full">
            {chartType === 'candlestick' ? (
              <CandlestickChart
                data={historyData}
                timeframe={timeframe}
                onTimeframeChange={setTimeframe}
                banana={banana}
              />
            ) : chartType === 'volume' ? (
              <VolumeChart
                data={historyData}
                timeframe={timeframe}
                onTimeframeChange={setTimeframe}
                banana={banana}
              />
            ) : (
              <LiveBananaChart
                banana={banana}
                height={320}
                showHeader={false}
                currentPrice={currentPrice}
                percentageChange={percentageChange}
              />
            )}
          </div>
        </div>

        {/* Bottom Section: User Holdings & Market Statistics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* User Holdings in this Banana */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-lg">
                Your {banana?.name} Holdings
              </h3>
              <span className="text-xs font-mono font-semibold bg-banana-100 text-banana-800 px-2.5 py-1 rounded-full">
                {ownedUnits} KG Owned
              </span>
            </div>

            {ownedUnits > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-xs text-slate-400 font-semibold uppercase block">Average Purchase Price</span>
                    <span className="text-xl font-black font-mono text-slate-900 mt-1 block">
                      ₹{avgBuyPrice.toFixed(2)} / KG
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-xs text-slate-400 font-semibold uppercase block">Current Valuation</span>
                    <span className="text-xl font-black font-mono text-slate-900 mt-1 block">
                      ₹{currentValuation.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className={`p-4 rounded-2xl border ${
                  holdingPnL >= 0 
                    ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800' 
                    : 'bg-rose-50/50 border-rose-200 text-rose-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider block">Net Holding Profit / Loss</span>
                      <span className="text-2xl font-black font-mono mt-0.5 block">
                        {holdingPnL >= 0 ? '+' : ''}₹{Math.abs(holdingPnL).toFixed(2)}
                      </span>
                    </div>
                    <span className="text-sm font-bold font-mono">
                      {holdingPnL >= 0 ? '+' : ''}{holdingPnLPercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-3xl mb-2">🍌</div>
                <p className="text-xs text-slate-500 mb-4">
                  You do not currently own any {banana?.name} stocks in your portfolio.
                </p>
                <button
                  onClick={() => handleOpenTrade('buy')}
                  className="px-5 py-2.5 bg-banana-500 font-bold text-xs text-slate-950 rounded-xl hover:bg-banana-600 transition-colors"
                >
                  Buy First {banana?.symbol} (KG) 🍌
                </button>
              </div>
            )}
          </div>

          {/* Market Statistics */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
            <h3 className="font-bold text-slate-900 text-lg mb-4">
              Market Statistics & Analytics
            </h3>

            <div className="divide-y divide-slate-100 text-sm">
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-500">24h High</span>
                <span className="font-mono font-bold text-slate-900">
                  ₹{(currentPrice * 1.05).toFixed(2)} / KG
                </span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-500">24h Low</span>
                <span className="font-mono font-bold text-slate-900">
                  ₹{(currentPrice * 0.95).toFixed(2)} / KG
                </span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-500">24h Volume</span>
                <span className="font-mono font-bold text-slate-900">
                  {(banana?.volume24h || 1250).toLocaleString('en-IN')} KG
                </span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-500">Market Capitalization</span>
                <span className="font-mono font-bold text-slate-900">
                  ₹{((currentPrice || 100) * (banana?.volume24h || 1500)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-500">Market Volatility</span>
                <span className="capitalize font-bold text-banana-600">
                  {banana?.volatility || 'Medium'}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Trade Modal */}
      {showTradeModal && banana && (
        <QuickTradeModal
          banana={banana}
          isOpen={showTradeModal}
          initialType={tradeType}
          onClose={() => setShowTradeModal(false)}
          onSuccess={() => {
            fetchUserHolding()
          }}
        />
      )}
    </div>
  )
}

export default BananaDetail