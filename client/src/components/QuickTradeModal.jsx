import React, { useState, useEffect } from 'react'
import { X, TrendingUp, TrendingDown, ShoppingCart, DollarSign, AlertCircle, Plus, Minus, CheckCircle2 } from 'lucide-react'
import { tradingService } from '../services/api'
import { useAuth } from '../hooks/useAuth'

const QuickTradeModal = ({ banana, isOpen, onClose, initialType = 'buy', onSuccess }) => {
  const { user, updateBalance, isAuthenticated, demoLogin } = useAuth()
  const [tradeType, setTradeType] = useState(banana?.tradeType || initialType || 'buy')
  const [quantity, setQuantity] = useState(5)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [userHolding, setUserHolding] = useState(null)
  const [fetchingHolding, setFetchingHolding] = useState(false)

  // Fetch current holdings for this banana
  useEffect(() => {
    if (isAuthenticated && banana) {
      fetchHolding()
    }
  }, [isAuthenticated, banana?.symbol])

  const fetchHolding = async () => {
    try {
      setFetchingHolding(true)
      const res = await tradingService.getPortfolio()
      const currentHolding = res.data?.holdings?.find(
        h => h.banana?.symbol === banana.symbol || h.banana?.name === banana.name
      )
      setUserHolding(currentHolding || null)
    } catch (err) {
      console.warn('Failed to fetch holding info:', err)
    } finally {
      setFetchingHolding(false)
    }
  }

  if (!isOpen || !banana) return null

  const currentPrice = banana.currentPrice || 0
  const qtyNumber = Number(quantity) || 0
  const totalCost = qtyNumber * currentPrice
  const userBalance = user?.virtualBalance !== undefined ? user.virtualBalance : (user?.balance !== undefined ? user.balance : 10000)
  const ownedQuantity = userHolding?.quantity || 0

  const canAfford = tradeType === 'buy' ? userBalance >= totalCost : true
  const canSell = tradeType === 'sell' ? ownedQuantity >= qtyNumber : true

  const handleQuantityChange = (delta) => {
    const newQty = Math.max(1, qtyNumber + delta)
    setQuantity(newQty)
    setErrorMsg('')
  }

  const handleQuickQty = (amount) => {
    if (amount === 'MAX') {
      if (tradeType === 'buy') {
        const maxKg = Math.max(1, Math.floor(userBalance / currentPrice))
        setQuantity(maxKg)
      } else {
        setQuantity(Math.max(1, ownedQuantity))
      }
    } else {
      setQuantity(amount)
    }
    setErrorMsg('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!isAuthenticated) {
      setErrorMsg('Bro, login cheyyittu vaa! Or click Quick Demo Login below 🍌')
      return
    }

    if (!qtyNumber || isNaN(qtyNumber) || qtyNumber <= 0) {
      setErrorMsg('Sariyaaya quantity enter cheyyu mone! (> 0 KG)')
      return
    }

    if (tradeType === 'buy' && !canAfford) {
      setErrorMsg('Paisa illa mone 😭 Balance kuravaanu.')
      return
    }

    if (tradeType === 'sell' && !canSell) {
      setErrorMsg(`Eda, ithra pazham ninte kayyil illa! You have only ${ownedQuantity} KG.`)
      return
    }

    try {
      setLoading(true)
      let res
      if (tradeType === 'buy') {
        res = await tradingService.buyBanana({
          bananaSymbol: banana.symbol,
          quantity: qtyNumber,
          type: 'buy'
        })
      } else {
        res = await tradingService.sellBanana({
          bananaSymbol: banana.symbol,
          quantity: qtyNumber,
          type: 'sell'
        })
      }

      // Update auth balance
      if (res.data?.balance !== undefined) {
        await updateBalance(res.data.balance)
      } else {
        await updateBalance()
      }

      setSuccessMsg(res.data?.message || (tradeType === 'buy' ? 'ADICHU MONE! 🍌 Pazham vangiyeda!' : 'Pazham vitteda! 💸'))
      
      // Refresh holding count
      await fetchHolding()

      if (onSuccess) {
        onSuccess(res.data)
      }

      setTimeout(() => {
        onClose()
      }, 1400)

    } catch (err) {
      console.error('Trade error:', err)
      const msg = err.response?.data?.message || err.message || 'Eda, transaction nadannilla 😭'
      setErrorMsg(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden flex flex-col">
        {/* Header with Banana Summary */}
        <div className="bg-slate-900 text-white p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3.5 pr-8">
            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 p-0.5 flex-shrink-0">
              <img 
                src={banana.image || `/images/bananas/${banana.symbol?.toLowerCase()}.jpg`}
                alt={banana.name}
                className="w-full h-full object-cover rounded-xl"
                onError={(e) => {
                  e.target.onerror = null
                  const fallback = `/images/bananas/${banana.name?.toLowerCase()}.jpg`
                  if (e.target.src !== fallback) {
                    e.target.src = fallback
                  }
                }}
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white tracking-tight leading-tight">
                  {banana.name}
                </h2>
                <span className="text-xs font-mono font-bold bg-slate-800 text-banana-400 px-2 py-0.5 rounded border border-slate-700">
                  {banana.symbol}
                </span>
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xl font-black font-mono text-banana-400">
                  ₹{Number(currentPrice).toFixed(2)}
                </span>
                <span className={`text-xs font-semibold flex items-center ${
                  banana.percentageChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {banana.percentageChange >= 0 ? '+' : ''}
                  {Number(banana.percentageChange || 0).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Trade Type Selector (BUY / SELL Tabs) */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-100 mx-5 mt-5 rounded-2xl">
          <button
            type="button"
            onClick={() => { setTradeType('buy'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center space-x-1.5 ${
              tradeType === 'buy'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>BUY PAZHAM</span>
          </button>
          
          <button
            type="button"
            onClick={() => { setTradeType('sell'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center space-x-1.5 ${
              tradeType === 'sell'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>SELL PAZHAM</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Holding or Balance Info bar */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs">
            <span className="text-slate-500 font-medium">
              {tradeType === 'buy' ? 'Available Balance' : 'Ente Kayyile Pazham (Holdings)'}
            </span>
            <span className="font-bold text-slate-900 font-mono">
              {tradeType === 'buy' 
                ? `₹${Number(userBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` 
                : `${ownedQuantity} KG`}
            </span>
          </div>

          {/* Quantity Stepper (KG) */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Banana Quantity (KG)
            </label>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => handleQuantityChange(-1)}
                className="w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors active:scale-95"
              >
                <Minus className="w-5 h-5 stroke-[2.5]" />
              </button>

              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 h-12 text-center text-xl font-black font-mono bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-banana-500 focus:bg-white focus:outline-none transition-all"
              />

              <button
                type="button"
                onClick={() => handleQuantityChange(1)}
                className="w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors active:scale-95"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            {/* Quick Quantity Pills (KG) */}
            <div className="flex items-center space-x-2 mt-2.5">
              {[1, 5, 10, 25, 50, 'MAX'].map((pill) => (
                <button
                  key={pill}
                  type="button"
                  onClick={() => handleQuickQty(pill)}
                  className={`flex-1 py-1 text-xs font-bold rounded-lg transition-colors ${
                    quantity === pill 
                      ? 'bg-slate-800 text-white' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {pill === 'MAX' ? 'MAX' : `+${pill} KG`}
                </button>
              ))}
            </div>
          </div>

          {/* Estimated Value & Summary */}
          <div className="p-3.5 bg-banana-50/50 border border-banana-200/60 rounded-2xl space-y-1.5">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Rate per KG</span>
              <span className="font-mono font-medium">₹{Number(currentPrice).toFixed(2)} / KG</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600">
              <span>Platform Fee (0%)</span>
              <span className="font-medium text-emerald-600 font-mono">₹0.00 (Hackathon Free)</span>
            </div>
            <div className="border-t border-banana-200/60 pt-2 flex justify-between items-baseline">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                {tradeType === 'buy' ? 'Total Payable' : 'Estimated Return'}
              </span>
              <span className="text-xl font-black font-mono text-slate-900">
                ₹{Number(totalCost).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-700 flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Login prompt if not authenticated */}
          {!isAuthenticated && (
            <div className="text-center py-2">
              <p className="text-xs text-slate-500 mb-2">You are in guest preview mode.</p>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await demoLogin()
                    setErrorMsg('')
                  } catch (e) {
                    setErrorMsg('Demo login failed! Try again.')
                  }
                }}
                className="w-full py-2.5 px-4 bg-slate-900 text-banana-400 font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors"
              >
                Instant Demo Login (₹10,000 Balance) 🍌
              </button>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || (tradeType === 'buy' && !canAfford) || (tradeType === 'sell' && !canSell)}
            className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm tracking-wide transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
              tradeType === 'buy'
                ? 'bg-banana-500 hover:bg-banana-400 text-slate-950 shadow-banana-500/20'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
            }`}
          >
            {loading ? (
              <span className="inline-flex items-center">
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></span>
                Processing Trade...
              </span>
            ) : tradeType === 'buy' ? (
              `BUY ${qtyNumber} PAZHAM (₹${totalCost.toFixed(2)})`
            ) : (
              `SELL ${qtyNumber} PAZHAM (₹${totalCost.toFixed(2)})`
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default QuickTradeModal