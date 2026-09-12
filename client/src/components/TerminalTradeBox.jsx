import React, { useState, useEffect } from 'react'
import { Plus, Minus, ArrowUpRight, ArrowDownRight, Wallet, ShieldAlert, CheckCircle2, Scale, LogIn, Loader2, Sparkles } from 'lucide-react'
import { tradingService } from '../services/api'
import { useAuth } from '../hooks/useAuth'

const TerminalTradeBox = ({
  banana = null,
  currentPrice = 156.30,
  onTradeSuccess = null,
  onOpenLogin = null,
  triggerProfitToast = null
}) => {
  const { user, isAuthenticated, updateBalance, demoLogin } = useAuth()

  const [tradeType, setTradeType] = useState('buy')
  const [quantityKg, setQuantityKg] = useState(10)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [userHoldingKg, setUserHoldingKg] = useState(0)

  const symbol = banana?.symbol?.toUpperCase() || 'NDR'
  const bananaName = banana?.name || 'Nendran'
  const pricePerKg = Number(currentPrice) || 100
  const totalValue = (Number(quantityKg) || 0) * pricePerKg
  const userBalance = user?.virtualBalance !== undefined ? user.virtualBalance : 10000

  // Fetch current holdings for this specific banana
  const fetchUserHolding = async () => {
    if (!isAuthenticated) {
      setUserHoldingKg(0)
      return
    }
    try {
      const res = await tradingService.getPortfolio()
      if (res.data?.success) {
        const found = res.data.holdings?.find(
          (h) => h.banana?.symbol?.toUpperCase() === symbol || h.bananaId?.symbol?.toUpperCase() === symbol
        )
        setUserHoldingKg(found?.quantity || 0)
      }
    } catch (err) {
      console.warn('Could not fetch user holding:', err)
    }
  }

  useEffect(() => {
    fetchUserHolding()
  }, [symbol, isAuthenticated, userBalance])

  const handleQuantityStep = (delta) => {
    setQuantityKg((prev) => Math.max(1, (Number(prev) || 0) + delta))
    setMessage('')
  }

  const handleSetExact = (val) => {
    setQuantityKg(val)
    setMessage('')
  }

  const handleTopup = async () => {
    const newBal = (user?.virtualBalance || 0) + 10000
    await updateBalance(newBal)
    setMessage('₹10,000 added to virtual balance! Vangikko mone! 🍌✨')
    setIsSuccess(true)
  }

  const handleExecuteTrade = async (e) => {
    if (e) e.preventDefault()
    setMessage('')
    setIsSuccess(false)

    // 1. Auth check
    if (!isAuthenticated) {
      setMessage('Login cheyyittu vaa bro! 🍌')
      return
    }

    const qty = Number(quantityKg)
    if (!qty || isNaN(qty) || qty <= 0) {
      setMessage('Sariyaaya quantity enter cheyyu mone! (> 0 KG)')
      return
    }

    // 2. Buy checks (Requirement: ₹10,000 virtual balance check)
    if (tradeType === 'buy') {
      if (userBalance < totalValue) {
        setMessage('Paisa illa mone 😭 Balance kuravaanu.')
        return
      }
    }

    // 3. Sell checks
    if (tradeType === 'sell') {
      if (userHoldingKg < qty) {
        setMessage('Ithra KG kayyil illa mone.')
        return
      }
    }

    try {
      setLoading(true)
      let res

      if (tradeType === 'buy') {
        res = await tradingService.buyBanana({
          bananaSymbol: symbol,
          quantity: qty,
          type: 'buy'
        })
      } else {
        res = await tradingService.sellBanana({
          bananaSymbol: symbol,
          quantity: qty,
          type: 'sell'
        })
      }

      // Update balance
      if (res.data?.balance !== undefined) {
        await updateBalance(res.data.balance)
      } else {
        await updateBalance()
      }

      // Refresh holding
      await fetchUserHolding()

      // Manglish Success Feedback
      if (tradeType === 'buy') {
        setMessage(res.data?.message || 'ADICHU MONE! 🍌 Pazham vangiyeda!')
      } else {
        setMessage(res.data?.message || `Sell cheythu da. Paisa vannu! 💸 (+₹${totalValue.toFixed(2)})`)
        // Trigger profit reaction toast if profitable trade
        if (triggerProfitToast) {
          triggerProfitToast(res.data?.transaction?.profitLoss || 100)
        }
      }
      setIsSuccess(true)

      if (onTradeSuccess) {
        onTradeSuccess(res.data)
      }

    } catch (err) {
      console.error('Trade execution error:', err)
      const errorMsg = err.response?.data?.message || err.message || 'Transaction nadannilla da! 😭'
      setMessage(errorMsg)
      setIsSuccess(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border-2 border-amber-200/90 rounded-3xl p-5 sm:p-6 flex flex-col justify-between font-sans text-xs select-none shadow-sm">
      <div>
        
        {/* Header with Title and Lots */}
        <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-amber-100">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-amber-400" />
            <h3 className="text-sm sm:text-base font-black tracking-tight text-slate-950 uppercase">
              ORDER ENTRY // {symbol}
            </h3>
          </div>
          <span className="text-xs font-black text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
            LOT: 1 KG
          </span>
        </div>

        {/* Buy / Sell Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-amber-50/80 border border-amber-200 rounded-xl mb-3">
          <button
            type="button"
            onClick={() => { setTradeType('buy'); setMessage('') }}
            className={`py-2 font-black text-xs sm:text-sm rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
              tradeType === 'buy'
                ? 'bg-emerald-600 text-white shadow-xs scale-101'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>BUY</span>
          </button>
          <button
            type="button"
            onClick={() => { setTradeType('sell'); setMessage('') }}
            className={`py-2 font-black text-xs sm:text-sm rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
              tradeType === 'sell'
                ? 'bg-rose-600 text-white shadow-xs scale-101'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>SELL</span>
          </button>
        </div>

        {/* Available Balance (Requirement 7) */}
        <div className="flex items-center justify-between px-3 py-2 bg-amber-50/70 border border-amber-200/90 rounded-xl mb-3 text-xs">
          <div className="flex items-center space-x-1.5 text-slate-600 font-semibold">
            <Wallet className="w-3.5 h-3.5 text-amber-600" />
            <span>Available Balance:</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="font-black text-slate-950">
              ₹{Number(userBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            {userBalance === 0 && (
              <button
                type="button"
                onClick={handleTopup}
                className="text-[10px] bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-lg shadow-2xs transition-colors"
                title="Add ₹10,000 free virtual money"
              >
                + Top Up
              </button>
            )}
          </div>
        </div>

        {/* Quantity (KG) Stepper */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1.5 text-slate-700 font-bold">
            <span className="flex items-center space-x-1">
              <Scale className="w-3.5 h-3.5 text-amber-600" />
              <span>Quantity:</span>
            </span>
            {isAuthenticated ? (
              <span className="text-[11px] text-slate-500 font-medium">
                Holdings: <strong className="text-slate-900">{userHoldingKg} KG</strong>
              </span>
            ) : null}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => handleQuantityStep(-5)}
              className="w-9 h-9 rounded-xl bg-amber-100 hover:bg-amber-200 active:bg-amber-300 text-slate-900 border border-amber-300 font-black flex items-center justify-center transition-all shadow-2xs"
            >
              <Minus className="w-4 h-4" />
            </button>

            <div className="flex-1 relative">
              <input
                type="number"
                min="1"
                step="1"
                value={quantityKg}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === '') {
                    setQuantityKg('')
                  } else {
                    const parsed = parseInt(val, 10)
                    setQuantityKg(isNaN(parsed) ? '' : Math.max(0, parsed))
                  }
                  setMessage('')
                }}
                className="w-full h-9 px-3 text-center bg-white border-2 border-amber-300 rounded-xl font-black text-base text-slate-950 focus:outline-none focus:border-amber-500"
              />
              <span className="absolute right-3 top-2 text-[10px] text-slate-400 font-black pointer-events-none">
                KG
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleQuantityStep(5)}
              className="w-9 h-9 rounded-xl bg-amber-100 hover:bg-amber-200 active:bg-amber-300 text-slate-900 border border-amber-300 font-black flex items-center justify-center transition-all shadow-2xs"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Quick KG Presets */}
          <div className="grid grid-cols-5 gap-1 mt-1.5">
            {[5, 10, 25, 50, 100].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleSetExact(preset)}
                className={`py-1 rounded-lg text-[10px] font-black border transition-all ${
                  quantityKg === preset
                    ? 'bg-amber-400 border-amber-500 text-slate-950 shadow-2xs'
                    : 'bg-amber-50/70 border-amber-200 text-slate-700 hover:bg-amber-100'
                }`}
              >
                +{preset}
              </button>
            ))}
          </div>
        </div>

        {/* Estimated Value */}
        <div className="p-3 bg-white border border-amber-200/90 rounded-xl mb-3 text-xs font-semibold">
          <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
            <span>Spot Rate:</span>
            <span className="font-bold text-slate-800">₹{pricePerKg.toFixed(2)} / KG</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-amber-100 text-sm font-black">
            <span className="text-slate-800">Estimated Value:</span>
            <span className="text-amber-900 text-base">
              ₹{totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Validation / Status Message */}
        {message && (
          <div className={`p-3 rounded-2xl text-xs font-bold flex items-start space-x-2.5 mb-4 leading-relaxed ${
            isSuccess 
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-900' 
              : 'bg-rose-50 border border-rose-300 text-rose-900'
          }`}>
            {isSuccess ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 mt-0.5" />
            ) : (
              <ShieldAlert className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
            )}
            <div className="flex-1">
              <span>{message}</span>
              {!isAuthenticated && message.includes('Login') && onOpenLogin && (
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="block mt-1 text-amber-900 font-black underline underline-offset-2"
                >
                  Click here to Login 🔑
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Execution Button */}
      <button
        type="button"
        disabled={loading}
        onClick={handleExecuteTrade}
        className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 ${
          tradeType === 'buy'
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
            : 'bg-rose-600 hover:bg-rose-700 text-white'
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-1" />
            <span>Executing spot order...</span>
          </>
        ) : (
          <span>
            {tradeType === 'buy' ? 'BUY' : 'SELL'} {quantityKg} KG OF {symbol}
          </span>
        )}
      </button>
    </div>
  )
}

export default TerminalTradeBox
