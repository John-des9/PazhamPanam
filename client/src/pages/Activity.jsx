import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ArrowDownRight, Clock, Filter, ShoppingCart, DollarSign, Calendar, Search } from 'lucide-react'
import { tradingService } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import BananaLoader from '../components/BananaLoader'

const Activity = () => {
  const { isAuthenticated, demoLogin } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('all') // all, buy, sell
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      loadHistory()
    } else {
      setLoading(false)
    }
  }, [isAuthenticated, filterType])

  const loadHistory = async () => {
    try {
      setLoading(true)
      const params = {}
      if (filterType !== 'all') {
        params.type = filterType
      }
      const res = await tradingService.getTransactionHistory(params)
      if (res.data?.success) {
        setTransactions(res.data.transactions || [])
      }
    } catch (err) {
      console.error('Failed to load transaction history:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredTransactions = transactions.filter(t => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      t.banana?.name?.toLowerCase().includes(q) ||
      t.banana?.symbol?.toLowerCase().includes(q)
    )
  })

  // Summary Metrics
  const totalTrades = transactions.length
  const buyCount = transactions.filter(t => t.type === 'buy').length
  const sellCount = transactions.filter(t => t.type === 'sell').length
  const totalVolume = transactions.reduce((sum, t) => sum + (t.quantity || 0), 0)
  const totalValueTraded = transactions.reduce((sum, t) => sum + (t.totalValue || 0), 0)

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 px-4">
        <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-xl border border-slate-200 text-center">
          <div className="w-16 h-16 bg-banana-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
            📋
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Trade Activity Log</h2>
          <p className="text-slate-600 text-sm mb-6">
            Log in to view your complete buy and sell execution history, order timestamps, and portfolio records.
          </p>
          <button
            onClick={async () => {
              try {
                await demoLogin()
                loadHistory()
              } catch (e) {
                console.error(e)
              }
            }}
            className="w-full py-3.5 bg-banana-500 hover:bg-banana-600 text-slate-950 font-bold rounded-2xl shadow-lg transition-all"
          >
            Access Instant Demo Account 🍌
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider bg-banana-100 text-banana-800 px-2.5 py-1 rounded-full">
              Trade Logs & Order History
            </span>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-2">
              Trading Activity
            </h1>
            <p className="text-slate-500 text-sm">
              Complete audit trail of all executed banana stock purchases and sales.
            </p>
          </div>

          <Link
            to="/dashboard"
            className="self-start sm:self-auto py-2.5 px-5 bg-slate-900 text-banana-400 hover:bg-slate-800 font-bold text-sm rounded-xl shadow-md flex items-center space-x-2 transition-all"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Place New Order</span>
          </Link>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Trades</span>
            <span className="text-2xl lg:text-3xl font-black font-mono text-slate-900 my-1 block">
              {totalTrades}
            </span>
            <span className="text-xs text-slate-500">
              {buyCount} Buys • {sellCount} Sells
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Volume Traded (KG)</span>
            <span className="text-2xl lg:text-3xl font-black font-mono text-banana-600 my-1 block">
              {totalVolume.toLocaleString('en-IN')} KG
            </span>
            <span className="text-xs text-slate-500">KG exchanged</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Gross Turnover</span>
            <span className="text-2xl lg:text-3xl font-black font-mono text-slate-900 my-1 block">
              ₹{totalValueTraded.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-slate-500">Total transaction value</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Execution Status</span>
            <span className="text-2xl lg:text-3xl font-black font-mono text-emerald-600 my-1 block">
              100%
            </span>
            <span className="text-xs text-slate-500">Instant on-chain mock</span>
          </div>
        </div>

        {/* Filters & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            {['all', 'buy', 'sell'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`py-2 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  filterType === type
                    ? type === 'buy'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : type === 'sell'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {type === 'all' ? 'All Trades' : type === 'buy' ? 'Buys Only' : 'Sells Only'}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by variety or symbol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-banana-500"
            />
          </div>
        </div>

        {/* Activity Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <BananaLoader text="Fetching trading records..." />
          ) : filteredTransactions.length === 0 ? (
            <div className="py-20 px-4 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3 text-slate-400">
                📋
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">
                Oru transaction-um nadannilla bro!
              </h3>
              <p className="text-slate-500 text-xs max-w-sm mx-auto mb-6">
                You haven't made any banana stock trades yet. Head to the market to execute your first trade!
              </p>
              <Link
                to="/dashboard"
                className="inline-flex items-center space-x-2 py-2.5 px-5 bg-banana-500 hover:bg-banana-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Trade in Live Market</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                    <th className="py-3.5 px-6">Date & Time</th>
                    <th className="py-3.5 px-6">Variety</th>
                    <th className="py-3.5 px-4">Action</th>
                    <th className="py-3.5 px-4">Quantity (KG)</th>
                    <th className="py-3.5 px-4">Execution (₹/KG)</th>
                    <th className="py-3.5 px-4">Total ₹ Value</th>
                    <th className="py-3.5 px-6 text-right">Balance After</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredTransactions.map((tx) => {
                    const isBuy = tx.type === 'buy'
                    const dateObj = new Date(tx.date || tx.createdAt)
                    const dateStr = dateObj.toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })
                    const timeStr = dateObj.toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })

                    return (
                      <tr key={tx.id || tx._id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Timestamp */}
                        <td className="py-4 px-6">
                          <span className="font-mono font-medium text-slate-900 block">{dateStr}</span>
                          <div className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>{timeStr}</span>
                          </div>
                        </td>

                        {/* Banana Variety */}
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden border border-slate-200/60 flex-shrink-0">
                              <img
                                src={tx.banana?.image || `/images/bananas/${tx.banana?.symbol?.toLowerCase()}.jpg`}
                                alt={tx.banana?.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null
                                  const fallback = `/images/bananas/${tx.banana?.name?.toLowerCase()}.jpg`
                                  if (e.target.src !== fallback) {
                                    e.target.src = fallback
                                  }
                                }}
                              />
                            </div>
                            <div>
                              <Link
                                to={`/banana/${tx.banana?.symbol}`}
                                className="font-bold text-slate-900 hover:text-banana-600 transition-colors"
                              >
                                {tx.banana?.name}
                              </Link>
                              <span className="block text-xs font-mono text-slate-400 font-semibold">
                                {tx.banana?.symbol}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Buy / Sell Badge */}
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center space-x-1 text-xs font-black uppercase px-2.5 py-1 rounded-md font-mono ${
                            isBuy 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {isBuy ? (
                              <ArrowUpRight className="w-3 h-3 stroke-[3]" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3 stroke-[3]" />
                            )}
                            <span>{tx.type}</span>
                          </span>
                        </td>

                        {/* Quantity (KG) */}
                        <td className="py-4 px-4 font-mono font-bold text-slate-900">
                          {tx.quantity} KG
                        </td>

                        {/* Price (₹/KG) */}
                        <td className="py-4 px-4 font-mono text-slate-700">
                          ₹{Number(tx.price).toFixed(2)} / KG
                        </td>

                        {/* Total Value */}
                        <td className="py-4 px-4 font-mono font-black text-slate-900">
                          ₹{Number(tx.totalValue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Balance After */}
                        <td className="py-4 px-6 text-right font-mono font-semibold text-slate-600 text-xs">
                          ₹{Number(tx.balanceAfter || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
    </div>
  )
}

export default Activity