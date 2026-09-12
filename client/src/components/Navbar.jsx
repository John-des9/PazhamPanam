import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, User, LogOut, Wallet, TrendingUp, Activity, PlusCircle, LogIn, Sparkles } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useMarketHours } from '../hooks/useMarketHours'
import LoginModal from './LoginModal'
import RegisterModal from './RegisterModal'
import BananaWordmark from './BananaWordmark'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)

  const { isAuthenticated, user, logout, updateBalance } = useAuth()
  const { isMarketOpen, currentTime, nextOpenText } = useMarketHours()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
    setIsMenuOpen(false)
  }

  // Virtual balance defaults to ₹10,000 starting capital
  const userBalance = user?.virtualBalance !== undefined ? user.virtualBalance : 10000

  const handleTopup = async () => {
    const newBal = (user?.virtualBalance || 0) + 10000
    await updateBalance(newBal)
  }

  const handlePazhamsScroll = (e) => {
    if (location.pathname === '/') {
      e.preventDefault()
      const el = document.getElementById('pazhams-market')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  return (
    <>
      <nav className="bg-white/95 backdrop-blur-md border-b border-amber-200/90 sticky top-0 z-40 shadow-xs text-slate-900 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* LEFT: Brand Logo & Name */}
            <div className="flex items-center space-x-3">
              <Link to="/" className="flex items-center space-x-2.5 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-300 to-yellow-400 border border-amber-400/80 p-1 flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:rotate-6 transition-all duration-300">
                  <img src="/banana-logo.svg" alt="Pazham Panam" className="w-7 h-7 object-contain group-hover:animate-banana-string" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <BananaWordmark className="h-7 sm:h-8 w-auto min-w-[160px] max-w-[190px] sm:max-w-[215px]" />
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-300 font-extrabold uppercase tracking-wider font-sans shrink-0">
                      SPOT
                    </span>
                  </div>
                  <div className="text-[9px] font-sans font-bold text-amber-900/80 tracking-wider hidden sm:block mt-0.5">
                    KERALA BANANA COMMODITY EXCHANGE
                  </div>
                </div>
              </Link>
            </div>

            {/* CENTER: Navigation Links */}
            <div className="hidden md:flex items-center space-x-1 lg:space-x-3">
              <Link
                to="/dashboard"
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
                  location.pathname === '/dashboard'
                    ? 'bg-amber-100 text-amber-950 font-extrabold border border-amber-300'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-amber-50'
                }`}
              >
                Market Terminal
              </Link>

              <a
                href="/#trading-desk"
                className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:text-slate-900 hover:bg-amber-50 transition-colors"
              >
                Trading Desk
              </a>

              <Link
                to="/portfolio"
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
                  location.pathname === '/portfolio'
                    ? 'bg-amber-100 text-amber-950 font-extrabold border border-amber-300'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-amber-50'
                }`}
              >
                Portfolio
              </Link>
            </div>

            {/* RIGHT: Status | Time | Balance | Login/Profile */}
            <div className="hidden md:flex items-center space-x-3">
              
              {/* 🟢 ON AANU + Current Time */}
              <div 
                title="Market is actively running 24/7"
                className="flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold border bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-black text-xs tracking-tight">ON AANU</span>
                <span className="text-slate-400">•</span>
                <span className="text-[11px] font-semibold text-slate-700">
                  {currentTime}
                </span>
              </div>

              {/* Balance Badge */}
              <div className="flex items-center space-x-2 bg-amber-50 border border-amber-200 text-slate-900 px-3 py-1.5 rounded-xl shadow-2xs">
                <Wallet className="w-3.5 h-3.5 text-amber-600" />
                <div className="flex items-baseline space-x-1">
                  <span className="text-[10px] text-amber-800 font-bold uppercase">Bal:</span>
                  <span className="text-xs font-black text-slate-950">
                    ₹{Number(userBalance).toLocaleString('en-IN')}
                  </span>
                </div>
                {userBalance === 0 && (
                  <button
                    onClick={handleTopup}
                    title="Add ₹10,000 Virtual Panam"
                    className="ml-1 text-[10px] bg-amber-400 hover:bg-amber-500 font-extrabold px-1.5 py-0.5 rounded text-slate-950 transition-colors"
                  >
                    +₹10k
                  </button>
                )}
              </div>

              {/* Login / Profile */}
              {!isAuthenticated ? (
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs sm:text-sm rounded-xl border border-amber-500 shadow-xs transition-all flex items-center space-x-1.5"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </button>
              ) : (
                /* User Dropdown */
                <div className="relative">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="w-9 h-9 rounded-xl bg-amber-100 hover:bg-amber-200 border border-amber-300 flex items-center justify-center text-slate-800 transition-colors shadow-xs"
                  >
                    <User className="w-4 h-4" />
                  </button>

                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-amber-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-4 py-2.5 border-b border-slate-100">
                        <div className="font-bold text-sm text-slate-900">{user?.username}</div>
                        <div className="text-xs text-slate-500 truncate">{user?.email}</div>
                      </div>

                      <Link
                        to="/dashboard"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-amber-50 transition-colors"
                      >
                        <TrendingUp className="w-4 h-4 text-amber-600" />
                        <span>Market Dashboard</span>
                      </Link>

                      <Link
                        to="/portfolio"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-amber-50 transition-colors"
                      >
                        <Wallet className="w-4 h-4 text-amber-600" />
                        <span>Portfolio (KG)</span>
                      </Link>

                      <div className="border-t border-slate-100 my-1"></div>

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center space-x-2 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout (Vendum Vaa)</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Mobile Menu Hamburger */}
            <div className="md:hidden flex items-center space-x-2">
              {!isAuthenticated ? (
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="px-3 py-1.5 bg-amber-400 text-slate-950 font-bold text-xs rounded-lg border border-amber-500 shadow-xs"
                >
                  Login
                </button>
              ) : null}

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-amber-100 transition-colors"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile menu dropdown */}
        {isMenuOpen && (
          <div className="md:hidden px-4 pt-2 pb-4 space-y-2 border-t border-amber-200 bg-white/95">
            <Link
              to="/dashboard"
              onClick={() => setIsMenuOpen(false)}
              className="block px-3 py-2 rounded-lg font-bold text-slate-800 hover:bg-amber-50"
            >
              Market
            </Link>
            <Link
              to="/#pazhams-market"
              onClick={(e) => {
                setIsMenuOpen(false)
                handlePazhamsScroll(e)
              }}
              className="block px-3 py-2 rounded-lg font-bold text-slate-800 hover:bg-amber-50"
            >
              Pazhams
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  to="/portfolio"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg font-bold text-slate-800 hover:bg-amber-50"
                >
                  Portfolio
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-rose-600 font-bold hover:bg-rose-50 rounded-lg"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setIsMenuOpen(false)
                  setIsLoginOpen(true)
                }}
                className="w-full py-2 bg-amber-400 text-slate-950 font-extrabold text-center rounded-lg shadow-xs"
              >
                Login to Market
              </button>
            )}
          </div>
        )}
      </nav>

      {/* Login & Register Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSwitchToRegister={() => {
          setIsLoginOpen(false)
          setIsRegisterOpen(true)
        }}
      />

      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSwitchToLogin={() => {
          setIsRegisterOpen(false)
          setIsLoginOpen(true)
        }}
      />
    </>
  )
}

export default Navbar