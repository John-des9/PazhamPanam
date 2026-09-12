import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Wallet,
  Radio,
  Layers,
  BarChart3,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Zap,
  Activity,
  ArrowRight,
  Scale,
  CheckCircle2,
  LogIn,
  Flame,
  AlertTriangle
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useMarket } from '../hooks/useMarket'
import { useMarketHours } from '../hooks/useMarketHours'
import { tradingService } from '../services/api'
import BananaMascot3D from '../components/BananaMascot3D'
import MarketTickerTape from '../components/MarketTickerTape'
import LiveBananaChart from '../components/LiveBananaChart'
import BananaPeelInteractive from '../components/BananaPeelInteractive'
import BananaMarketChart from '../components/BananaMarketChart'
import TerminalTradeBox from '../components/TerminalTradeBox'
import TerminalMarketWatch from '../components/TerminalMarketWatch'
import LoginModal from '../components/LoginModal'
import RegisterModal from '../components/RegisterModal'

const Landing = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated, demoLogin, updateBalance } = useAuth()
  const { bananas, canonicalBananas } = useMarket()
  const { currentTime } = useMarketHours()

  const [selectedSymbol, setSelectedSymbol] = useState('NDR')
  const [activeSectionTab, setActiveSectionTab] = useState('TERMINAL') // 'TERMINAL' | 'MARKET' | 'GAINERS' | 'LOSERS'
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [portfolioHoldings, setPortfolioHoldings] = useState([])
  const [portfolioStats, setPortfolioStats] = useState(null)
  const [toastNotification, setToastNotification] = useState(null)

  // Ranked Top Gainers (sorted by percentageChange descending)
  const topGainers = useMemo(() => {
    return [...bananas]
      .filter((b) => (b.percentageChange || 0) >= 0)
      .sort((a, b) => (b.percentageChange || 0) - (a.percentageChange || 0))
  }, [bananas])

  // Ranked Top Losers (sorted by percentageChange ascending)
  const topLosers = useMemo(() => {
    return [...bananas]
      .filter((b) => (b.percentageChange || 0) < 0)
      .sort((a, b) => (a.percentageChange || 0) - (b.percentageChange || 0))
  }, [bananas])

  // Load real user portfolio whenever user or trade status updates
  const loadPortfolio = async () => {
    if (!isAuthenticated) {
      setPortfolioHoldings([])
      setPortfolioStats(null)
      return
    }
    try {
      const res = await tradingService.getPortfolio()
      if (res.data?.success) {
        setPortfolioStats(res.data.portfolio)
        setPortfolioHoldings(res.data.holdings || [])
      }
    } catch (err) {
      console.warn('Portfolio load notice:', err.message)
    }
  }

  useEffect(() => {
    loadPortfolio()
  }, [isAuthenticated, user?.virtualBalance])

  // Active selected banana from live market context
  const activeBanana = useMemo(() => {
    const found = bananas.find((b) => b.symbol?.toUpperCase() === selectedSymbol.toUpperCase())
    return found || canonicalBananas.find((b) => b.symbol === selectedSymbol) || canonicalBananas[0]
  }, [bananas, canonicalBananas, selectedSymbol])

  // Virtual balance defaults to ₹10,000 starting capital
  const userBalance = user?.virtualBalance !== undefined ? user.virtualBalance : 10000

  const handleTopup = async () => {
    const newBal = userBalance + 10000
    await updateBalance(newBal)
    showToast('₹10,000 virtual cash added! Vangikko mone! 🍌✨', 'success')
  }

  // Manglish Profit / Loss Toast Handler (Requirement 13)
  const showToast = (text, type = 'profit') => {
    setToastNotification({ text, type })
    setTimeout(() => {
      setToastNotification(null)
    }, 4000)
  }

  const triggerProfitReaction = (pnlAmount) => {
    if (pnlAmount > 0) {
      const profitLines = [
        'ADICHU MONE! 🔥',
        'Pwoli profit da!',
        'Da mone, paisa varunnund!',
        'Nendran kayariyallo! 🔥',
        'Ingane poyal nee market king aanu! 👑'
      ]
      const pick = profitLines[Math.floor(Math.random() * profitLines.length)]
      showToast(`${pick} (+₹${Math.abs(pnlAmount).toFixed(2)})`, 'profit')
    } else if (pnlAmount < 0) {
      const lossLines = [
        'Paisa poyi mone 😭',
        'Scene motham kulam aanu.',
        'Kadhali chathichu da.'
      ]
      const pick = lossLines[Math.floor(Math.random() * lossLines.length)]
      showToast(`${pick} (-₹${Math.abs(pnlAmount).toFixed(2)})`, 'loss')
    }
  }

  // Calculate live dynamic metrics for user portfolio
  const liveHoldingsWithValuation = useMemo(() => {
    return portfolioHoldings.map((h) => {
      const liveB = bananas.find((b) => b.symbol?.toUpperCase() === (h.banana?.symbol || h.bananaId?.symbol)?.toUpperCase())
      const livePrice = liveB?.currentPrice || h.banana?.currentPrice || h.averageBuyPrice
      const currentValue = h.quantity * livePrice
      const invested = h.totalInvested || (h.quantity * h.averageBuyPrice)
      const pnl = currentValue - invested
      const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0

      return {
        ...h,
        symbol: h.banana?.symbol || h.bananaId?.symbol || 'NDR',
        name: h.banana?.name || h.bananaId?.name || 'Kerala Banana',
        livePrice,
        currentValue,
        pnl,
        pnlPct
      }
    })
  }, [portfolioHoldings, bananas])

  const totalPortfolioValue = liveHoldingsWithValuation.reduce((acc, h) => acc + h.currentValue, 0)
  const totalInvested = liveHoldingsWithValuation.reduce((acc, h) => acc + (h.totalInvested || 0), 0)
  const totalPnL = totalPortfolioValue - totalInvested

  const scrollToTradingDesk = () => {
    const el = document.getElementById('trading-desk')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen banana-market-bg text-slate-900 flex flex-col justify-between font-sans selection:bg-amber-300 selection:text-slate-950 relative">
      
      {/* Animated Manglish Profit / Loss Toast with Celebration/Slip animation (Requirements 3 & 4) */}
      {toastNotification && (
        <div className="fixed top-20 right-5 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className={`flex items-center space-x-3 px-5 py-3 rounded-2xl shadow-xl border-2 text-sm font-black ${
            toastNotification.type === 'profit'
              ? 'bg-amber-100/95 border-amber-400 text-amber-950 animate-profit-bounce'
              : toastNotification.type === 'loss'
              ? 'bg-rose-100/95 border-rose-400 text-rose-950 animate-banana-slip'
              : 'bg-emerald-100/95 border-emerald-400 text-emerald-950'
          }`}>
            <BananaPeelInteractive
              size={28}
              isCelebration={toastNotification.type === 'profit'}
              isSlip={toastNotification.type === 'loss'}
              trigger={true}
            />
            <span className="tracking-tight">{toastNotification.text}</span>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* 1. HERO SECTION (3D Mascot Balanced with Content)        */}
      {/* ======================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          
          {/* LEFT: 3D Banana Mascot Card (~38% width, balanced) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center order-2 lg:order-1">
            <div className="w-full max-w-sm sm:max-w-md bg-white border border-amber-200/90 rounded-3xl p-4 shadow-sm relative overflow-hidden">
              
              {/* Mascot Card Header with Interactive Peeling Banana */}
              <div className="flex items-center justify-between px-2 pb-2.5 border-b border-amber-100 text-xs">
                <div className="flex items-center space-x-2">
                  <BananaPeelInteractive
                    size={22}
                    onPeel={() => showToast('Mone, njan Peely aanu! 🍌✨', 'profit')}
                  />
                  <span className="font-black text-slate-900 uppercase tracking-wider text-[11px]">
                    OFFICIAL MASCOT // PEELY
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 text-[10px] font-black text-amber-950 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>3D INTERACTIVE</span>
                </div>
              </div>

              {/* 3D Mascot Canvas */}
              <div className="w-full h-64 sm:h-72 relative flex items-center justify-center">
                <BananaMascot3D />
              </div>

              {/* Card Footer: Virtual Balance */}
              <div className="mt-1 p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider">
                    TOTAL PAZHAM PANAM
                  </div>
                  <div className="text-xl font-black text-slate-950 mt-0.5">
                    ₹{Number(userBalance).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    Virtual Paper Balance (Zero Real Risk)
                  </div>
                </div>

                {userBalance === 0 ? (
                  <button
                    onClick={handleTopup}
                    className="px-3.5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl border border-amber-500 shadow-2xs transition-all"
                  >
                    + Add ₹10,000 Free
                  </button>
                ) : (
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-xl">
                    Funded
                  </span>
                )}
              </div>

            </div>
          </div>

          {/* RIGHT: Main Headline + Manglish Identity + Quick Actions */}
          <div className="lg:col-span-7 flex flex-col space-y-4 order-1 lg:order-2">
            
            {/* Market Status Pill */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-300 text-emerald-800 shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-black text-xs">🟢 MARKET ON AANU</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-700 font-semibold">{currentTime}</span>
              </div>

              <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300">
                24/7 Spot Mandi
              </span>
            </div>

            {/* Main Headline */}
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-amber-800 mb-1">
                "Da mone, innu market vere level aanu."
              </div>
              <h1 className="font-brand font-[800] text-4xl sm:text-5xl lg:text-6xl text-slate-950 tracking-tight leading-none uppercase">
                PAZHAM PANAM
              </h1>
            </div>

            {/* Quick Mandi Highlights Bar */}
            <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-white border border-amber-200/90 rounded-2xl shadow-2xs">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500">Active Banana</div>
                <div className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                  ₹{Number(activeBanana.currentPrice).toFixed(2)}
                  <span className="text-xs font-normal text-slate-500 ml-1">/ KG</span>
                </div>
                <div className="text-[10px] text-emerald-700 font-bold">{activeBanana.name} Spot</div>
              </div>

              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500">24H Volume</div>
                <div className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                  {(activeBanana.volume24h || 48320).toLocaleString('en-IN')}
                  <span className="text-xs font-normal text-slate-500 ml-1">KG</span>
                </div>
                <div className="text-[10px] text-slate-500">Wholesale Traded</div>
              </div>

              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500">Paper Balance</div>
                <div className="text-base sm:text-lg font-black text-amber-800 mt-0.5">
                  ₹{Number(userBalance).toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-slate-500">Zero Financial Risk</div>
              </div>
            </div>

            {/* Action Buttons: [Explore Trading Desk] & [Login to Trade] */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={scrollToTradingDesk}
                className="px-6 py-3.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-sm rounded-2xl border border-amber-500 shadow-sm hover:shadow-md transition-all flex items-center space-x-2"
              >
                <span>Explore Trading Desk</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              {!isAuthenticated ? (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-6 py-3.5 bg-white hover:bg-amber-50 text-slate-900 font-black text-sm rounded-2xl border border-amber-300 shadow-2xs transition-all flex items-center space-x-2"
                >
                  <LogIn className="w-4 h-4 text-amber-600" />
                  <span>Login to Trade</span>
                </button>
              ) : (
                <a
                  href="#portfolio-section"
                  className="px-6 py-3.5 bg-white hover:bg-amber-50 text-slate-900 font-black text-sm rounded-2xl border border-amber-300 shadow-2xs transition-all flex items-center space-x-2"
                >
                  <span>View My Portfolio</span>
                  <ArrowRight className="w-4 h-4 text-amber-600" />
                </a>
              )}
            </div>

          </div>

        </div>
      </section>

      {/* ======================================================= */}
      {/* 2. LIVE BANANA TICKER (Requirement 3: Compact & Clean)   */}
      {/* ======================================================= */}
      <MarketTickerTape
        bananas={bananas}
        onSelectBanana={(b) => {
          setSelectedSymbol(b.symbol)
          scrollToTradingDesk()
        }}
      />

      {/* ======================================================= */}
      {/* 3. MAIN MARKET DASHBOARD (Requirements 4, 5, 6, 7)       */}
      {/*    Clean 3-Column Layout: 25% | 50% | 25% Top-Aligned   */}
      {/* ======================================================= */}
      <section id="trading-desk" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 pb-3 border-b border-amber-200">
          <div>
            <div className="flex items-center space-x-2 text-xs font-black text-amber-800 uppercase tracking-wider mb-0.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>PAZHAM PANAM SPOT TRADING</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              Live Mandi Trading Desk
            </h2>
          </div>

          <div className="mt-2 sm:mt-0 flex items-center space-x-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Market ON AANU • 24/7 Continuous Feed</span>
          </div>
        </div>

        {/* 3-Column Layout: 25% (Market Watch) | 50% (Chart) | 25% (Buy/Sell) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* =================================================== */}
          {/* LEFT (25%): MARKET WATCH (Requirement 5)            */}
          {/* Simple list: Name, Price, % Change, Yellow Accent  */}
          {/* =================================================== */}
          <div className="lg:col-span-3 flex flex-col space-y-4">
            <div className="bg-white border border-amber-200/90 rounded-3xl p-4 shadow-xs select-none">
              
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-amber-100">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="text-xs font-black tracking-wider text-slate-950 uppercase">
                    MARKET WATCH
                  </span>
                </div>
                <span className="text-[10px] font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                  8 VARIETIES
                </span>
              </div>

              {/* Simple Clean Rows (Requirement 5) */}
              <div className="space-y-1.5">
                {bananas.map((b) => {
                  const isSel = b.symbol?.toUpperCase() === selectedSymbol.toUpperCase()
                  const isPos = (b.percentageChange || 0) >= 0

                  return (
                    <button
                      key={b.symbol}
                      type="button"
                      onClick={() => setSelectedSymbol(b.symbol)}
                      className={`w-full p-2.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
                        isSel
                          ? 'bg-amber-100/90 border-amber-400 shadow-2xs scale-101'
                          : 'bg-white border-amber-100 hover:bg-amber-50/70'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">🍌</span>
                        <div>
                          <div className="text-xs font-black text-slate-950 leading-tight">
                            {b.name}
                          </div>
                          <div className="text-[10px] font-bold text-amber-800">
                            {b.symbol}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-black text-slate-950">
                          ₹{Number(b.currentPrice).toFixed(2)}
                        </div>
                        <div className={`text-[10px] font-black ${isPos ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {isPos ? '+' : ''}{Number(b.percentageChange || 0).toFixed(2)}%
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

            </div>
          </div>

          {/* =================================================== */}
          {/* CENTER (50%): SELECTED BANANA + LIVE CHART (Req 6) */}
          {/* Clean header, breathing room, supporting info below */}
          {/* =================================================== */}
          <div className="lg:col-span-6 flex flex-col space-y-4">
            <LiveBananaChart
              banana={activeBanana}
              currentPrice={activeBanana.currentPrice}
              percentageChange={activeBanana.percentageChange}
              height={330}
            />
          </div>

          {/* =================================================== */}
          {/* RIGHT (25%): BUY / SELL PANEL (Requirement 7)       */}
          {/* Compact controls, clear balance, prominent action  */}
          {/* =================================================== */}
          <div className="lg:col-span-3 flex flex-col space-y-4">
            <TerminalTradeBox
              banana={activeBanana}
              currentPrice={activeBanana.currentPrice}
              onTradeSuccess={() => {
                loadPortfolio()
              }}
              onOpenLogin={() => setShowLoginModal(true)}
              triggerProfitToast={triggerProfitReaction}
            />
          </div>

        </div>

        {/* ======================================================= */}
        {/* 4. MARKET OVERVIEW (Requirement 8)                      */}
        {/*    Horizontal layout below main trading desk with 4 metrics*/}
        {/* ======================================================= */}
        <div className="mt-8 pt-6 border-t border-amber-200">
          <div className="text-xs font-black text-amber-900 uppercase tracking-wider mb-3">
            MARKET OVERVIEW // STATEWIDE BENCHMARKS
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Market Cap */}
            <div className="bg-white border border-amber-200/90 rounded-2xl p-4 shadow-2xs">
              <div className="text-[10px] uppercase font-bold text-slate-500">
                TOTAL MARKET CAP
              </div>
              <div className="text-xl font-black text-slate-950 mt-1">
                ₹4.82 Cr
              </div>
              <div className="text-[11px] text-emerald-700 font-bold mt-0.5">
                8 Indigenous Cultivars
              </div>
            </div>

            {/* Total 24H Volume */}
            <div className="bg-white border border-amber-200/90 rounded-2xl p-4 shadow-2xs">
              <div className="text-[10px] uppercase font-bold text-slate-500">
                TOTAL 24H VOLUME
              </div>
              <div className="text-xl font-black text-slate-950 mt-1">
                48,320 KG
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                Wholesale Spot Lots
              </div>
            </div>

            {/* Top Gainer */}
            <div 
              onClick={() => topGainers[0] && setSelectedSymbol(topGainers[0].symbol)}
              className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-2xs cursor-pointer hover:bg-emerald-50/40 transition-colors"
            >
              <div className="text-[10px] uppercase font-bold text-emerald-800 flex items-center justify-between">
                <span>TOP GAINER</span>
                <span>🥇</span>
              </div>
              <div className="text-xl font-black text-slate-950 mt-1">
                {topGainers[0]?.name || 'Nendran'}
              </div>
              <div className="text-[11px] text-emerald-700 font-black mt-0.5">
                +{Number(topGainers[0]?.percentageChange || 0).toFixed(2)}% Spot Gain
              </div>
            </div>

            {/* Top Loser */}
            <div 
              onClick={() => topLosers[0] && setSelectedSymbol(topLosers[0].symbol)}
              className="bg-white border border-rose-200 rounded-2xl p-4 shadow-2xs cursor-pointer hover:bg-rose-50/40 transition-colors"
            >
              <div className="text-[10px] uppercase font-bold text-rose-800 flex items-center justify-between">
                <span>TOP LOSER (DIP)</span>
                <span>📉</span>
              </div>
              <div className="text-xl font-black text-slate-950 mt-1">
                {topLosers[0]?.name || 'Kadhali'}
              </div>
              <div className="text-[11px] text-rose-700 font-black mt-0.5">
                {Number(topLosers[0]?.percentageChange || 0).toFixed(2)}% Dip Opportunity
              </div>
            </div>

          </div>
        </div>

        {/* ======================================================= */}
        {/* 5. TOP GAINERS / TOP LOSERS (Requirement 9)             */}
        {/*    Clean 2-Column Secondary Layout                      */}
        {/* ======================================================= */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Top Gainers Column */}
          <div className="bg-white border border-amber-200/90 rounded-3xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-amber-100">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-black text-slate-950 uppercase tracking-tight">
                  TOP GAINERS (BULLISH PAZHAM)
                </h3>
              </div>
              <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {topGainers.length} RALLIES
              </span>
            </div>

            <div className="space-y-1.5">
              {topGainers.slice(0, 4).map((b, idx) => {
                const isSel = b.symbol?.toUpperCase() === selectedSymbol.toUpperCase()
                const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🚀'

                return (
                  <button
                    key={b.symbol}
                    type="button"
                    onClick={() => {
                      setSelectedSymbol(b.symbol)
                      scrollToTradingDesk()
                    }}
                    className={`w-full p-2.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
                      isSel
                        ? 'bg-amber-100/90 border-amber-400 font-bold'
                        : 'bg-white border-amber-100 hover:bg-amber-50/70'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="text-sm">{medal}</span>
                      <div>
                        <div className="text-xs font-black text-slate-950">
                          {b.name}
                        </div>
                        <div className="text-[10px] font-bold text-slate-500">
                          {b.symbol}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-black text-slate-950">
                        ₹{Number(b.currentPrice).toFixed(2)}
                      </div>
                      <div className="text-[10px] font-black text-emerald-700">
                        +{Number(b.percentageChange || 0).toFixed(2)}%
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Top Losers Column */}
          <div className="bg-white border border-amber-200/90 rounded-3xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-amber-100">
              <div className="flex items-center space-x-2">
                <TrendingDown className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-black text-slate-950 uppercase tracking-tight">
                  TOP LOSERS (DIP OPPORTUNITIES)
                </h3>
              </div>
              <span className="text-[10px] font-black text-rose-800 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                {topLosers.length} DIPS
              </span>
            </div>

            <div className="space-y-1.5">
              {topLosers.length > 0 ? (
                topLosers.slice(0, 4).map((b) => {
                  const isSel = b.symbol?.toUpperCase() === selectedSymbol.toUpperCase()

                  return (
                    <button
                      key={b.symbol}
                      type="button"
                      onClick={() => {
                        setSelectedSymbol(b.symbol)
                        scrollToTradingDesk()
                      }}
                      className={`w-full p-2.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
                        isSel
                          ? 'bg-rose-50 border-rose-400 font-bold'
                          : 'bg-white border-rose-100 hover:bg-rose-50/50'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="text-sm">📉</span>
                        <div>
                          <div className="text-xs font-black text-slate-950">
                            {b.name}
                          </div>
                          <div className="text-[10px] font-bold text-slate-500">
                            {b.symbol}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-black text-slate-950">
                          ₹{Number(b.currentPrice).toFixed(2)}
                        </div>
                        <div className="text-[10px] font-black text-rose-700">
                          {Number(b.percentageChange || 0).toFixed(2)}%
                        </div>
                      </div>
                    </button>
                  )
                })
              ) : (
                <div className="text-center py-6 text-xs text-slate-400">
                  All cultivars are currently stable or moving upward!
                </div>
              )}
            </div>
          </div>

        </div>

      </section>

      {/* ======================================================= */}
      {/* 6. PORTFOLIO SECTION (Requirement 10)                   */}
      {/*    Dedicated clean table: Total Value, Invested, P&L   */}
      {/* ======================================================= */}
      <section id="portfolio-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 w-full">
        <div className="bg-white border border-amber-200/90 rounded-3xl p-5 sm:p-6 shadow-xs">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-amber-100 gap-2">
            <div className="flex items-center space-x-2">
              <Wallet className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-black text-slate-950 uppercase tracking-tight">
                PORTFOLIO
              </h3>
            </div>

            {isAuthenticated && (
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div>
                  <span className="text-slate-500 mr-1">Total Value:</span>
                  <strong className="text-slate-900 font-black">₹{totalPortfolioValue.toFixed(2)}</strong>
                </div>
                <div>
                  <span className="text-slate-500 mr-1">Invested:</span>
                  <strong className="text-slate-900 font-black">₹{totalInvested.toFixed(2)}</strong>
                </div>
                <div>
                  <span className="text-slate-500 mr-1">P&L:</span>
                  <strong className={`font-black ${totalPnL >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toFixed(2)}
                  </strong>
                </div>
              </div>
            )}
          </div>

          {!isAuthenticated ? (
            <div className="p-8 text-center bg-amber-50/50 rounded-2xl border border-amber-200/80">
              <div className="text-2xl mb-2">🍌💼</div>
              <h4 className="text-sm font-black text-slate-900">Login cheyyittu portfolio nokku da!</h4>
              <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                Log in to view your banana holdings, average buy prices, and real-time profit and loss.
              </p>
              <button
                onClick={() => setShowLoginModal(true)}
                className="mt-4 px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl border border-amber-500 shadow-2xs transition-all"
              >
                Login to Access Portfolio
              </button>
            </div>
          ) : liveHoldingsWithValuation.length === 0 ? (
            <div className="p-8 text-center bg-amber-50/50 rounded-2xl border border-amber-200/80">
              <div className="text-2xl mb-1">🍌🛒</div>
              <h4 className="text-sm font-black text-slate-900">Kayyil oru pazhavum illa mone!</h4>
              <p className="text-xs text-slate-600 mt-1">
                Select a variety from Market Watch and buy your first banana in KG!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="text-[10px] text-slate-500 border-b border-amber-100 uppercase font-bold">
                    <th className="pb-2.5">PAZHAM</th>
                    <th className="pb-2.5 text-right">QUANTITY</th>
                    <th className="pb-2.5 text-right">AVG PRICE</th>
                    <th className="pb-2.5 text-right">CURRENT</th>
                    <th className="pb-2.5 text-right">INVESTED</th>
                    <th className="pb-2.5 text-right">CURRENT VALUE</th>
                    <th className="pb-2.5 text-right">P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {liveHoldingsWithValuation.map((h, i) => (
                    <tr key={i} className="hover:bg-amber-50/60 transition-colors">
                      <td className="py-3 font-black text-slate-900">
                        {h.name} <span className="text-[10px] font-bold text-amber-800">({h.symbol})</span>
                      </td>
                      <td className="py-3 text-right font-black text-slate-900">
                        {h.quantity} KG
                      </td>
                      <td className="py-3 text-right font-medium text-slate-600">
                        ₹{Number(h.averageBuyPrice).toFixed(2)}
                      </td>
                      <td className="py-3 text-right font-black text-slate-900">
                        ₹{Number(h.livePrice).toFixed(2)}
                      </td>
                      <td className="py-3 text-right font-medium text-slate-600">
                        ₹{Number(h.totalInvested || h.quantity * h.averageBuyPrice).toFixed(2)}
                      </td>
                      <td className="py-3 text-right font-black text-slate-900">
                        ₹{Number(h.currentValue).toFixed(2)}
                      </td>
                      <td className={`py-3 text-right font-black ${h.pnl >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {h.pnl >= 0 ? '+' : ''}₹{Number(h.pnl).toFixed(2)} ({h.pnlPct.toFixed(1)}%)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ======================================================= */}
      {/* 7. MANGLISH NEWS (Requirement 12)                       */}
      {/*    Centralized dedicated area with clean short intel    */}
      {/* ======================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 w-full">
        <div className="bg-white border border-amber-200/90 rounded-3xl p-5 sm:p-6 shadow-xs">
          
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-amber-100">
            <div className="flex items-center space-x-2">
              <Radio className="w-4 h-4 text-amber-600 animate-pulse" />
              <h3 className="text-sm font-black text-slate-950 uppercase tracking-tight">
                MANDI WIRE // KERALA MARKET INTEL
              </h3>
            </div>
            <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
              LIVE BROADCAST
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl">
              <div className="flex items-center justify-between text-[10px] text-amber-900 font-bold mb-1">
                <span>MOMENTUM</span>
                <span>10:15 AM</span>
              </div>
              <p className="text-slate-900 font-extrabold">"🟢 Nendran kayariyallo! 🔥"</p>
              <p className="text-[11px] text-slate-600 mt-1">Sadhya chip processors aggressive bids ramping up spot prices.</p>
            </div>

            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl">
              <div className="flex items-center justify-between text-[10px] text-amber-900 font-bold mb-1">
                <span>SUPPORT</span>
                <span>11:30 AM</span>
              </div>
              <p className="text-slate-900 font-extrabold">"Poovan innu strong aanu 💪"</p>
              <p className="text-[11px] text-slate-600 mt-1">Retail consumption holding floor steady across Ernakulam.</p>
            </div>

            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl">
              <div className="flex items-center justify-between text-[10px] text-amber-900 font-bold mb-1">
                <span>CAUTION</span>
                <span>01:05 PM</span>
              </div>
              <p className="text-slate-900 font-extrabold">"Market ippo motham kulam aanu"</p>
              <p className="text-[11px] text-slate-600 mt-1">Sudden monsoon shower delays lorry transport to Palakkad.</p>
            </div>

            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl">
              <div className="flex items-center justify-between text-[10px] text-amber-900 font-bold mb-1">
                <span>DERIVATIVES</span>
                <span>02:40 PM</span>
              </div>
              <p className="text-slate-900 font-extrabold">"Paisa poyi mone 😭"</p>
              <p className="text-[11px] text-slate-600 mt-1">Short sellers trapped as Kadhali festival bids cross ₹108 / KG.</p>
            </div>
          </div>

        </div>
      </section>

      {/* ======================================================= */}
      {/* 8. FOOTER                                               */}
      {/* ======================================================= */}
      <footer className="border-t border-amber-200 bg-white py-6 text-xs text-slate-600 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <img src="/banana-logo.svg" alt="Pazham Panam" className="w-6 h-6" />
            <span className="font-brand font-[800] text-slate-950 text-sm tracking-tight uppercase">PAZHAM PANAM</span>
            <span className="text-slate-400">•</span>
            <span className="font-semibold">Kerala Banana Commodity Simulator</span>
          </div>

          <div className="flex items-center space-x-3 text-[11px] text-slate-500 font-bold">
            <span className="text-emerald-700">🟢 MARKET ON AANU (24/7)</span>
            <span>•</span>
            <span>Virtual Currency: ₹0 Initial</span>
            <span>•</span>
            <span className="text-amber-800">100% Zero Financial Risk</span>
          </div>
        </div>
      </footer>

      {/* Auth Modals */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => {
          setShowLoginModal(false)
          loadPortfolio()
        }}
        onSwitchToRegister={() => {
          setShowLoginModal(false)
          setShowRegisterModal(true)
        }}
      />
      
      <RegisterModal 
        isOpen={showRegisterModal} 
        onClose={() => {
          setShowRegisterModal(false)
          loadPortfolio()
        }}
        onSwitchToLogin={() => {
          setShowRegisterModal(false)
          setShowLoginModal(true)
        }}
      />

    </div>
  )
}

export default Landing