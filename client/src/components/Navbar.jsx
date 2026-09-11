import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, User, LogOut, Wallet, TrendingUp, Activity, Sparkles, LogIn } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useSocket } from '../hooks/useSocket'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { isAuthenticated, user, logout, demoLogin } = useAuth()
  const { connected } = useSocket()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
    setIsMenuOpen(false)
  }

  const navItems = [
    { name: 'Market', path: '/dashboard', icon: TrendingUp },
    { name: 'Portfolio', path: '/portfolio', icon: Wallet },
    { name: 'Activity', path: '/activity', icon: Activity }
  ]

  const userBalance = user?.virtualBalance !== undefined ? user.virtualBalance : 25000

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-18">
          
          {/* Brand Logo & Tagline */}
          <Link to="/dashboard" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-2xl bg-banana-500/10 border border-banana-500/30 p-1 flex items-center justify-center group-hover:scale-105 transition-transform">
              <img src="/banana-logo.svg" alt="Pazham Panam" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <div className="font-black text-xl tracking-tight text-slate-900 group-hover:text-banana-600 transition-colors flex items-center space-x-1.5">
                <span>Pazham Panam</span>
                <span className="text-base">🍌</span>
              </div>
              <div className="text-[11px] font-bold text-banana-600 tracking-wider hidden sm:block">
                Trade Pazham. Make Panam.
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-white/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>

          {/* Right Actions: Balance, Status & User Menu */}
          <div className="flex items-center space-x-3">
            
            {/* Market Status Pill */}
            <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200/80 rounded-full text-xs font-bold text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>MARKET RIPE 🟢</span>
            </div>

            {/* Virtual Cash Balance */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-2 bg-slate-900 text-white px-3.5 py-1.5 rounded-2xl shadow-sm">
                <Wallet className="w-4 h-4 text-banana-400" />
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Panam</div>
                  <div className="text-xs font-black font-mono text-banana-400 leading-tight">
                    ₹{Number(userBalance).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={async () => {
                  try {
                    await demoLogin()
                    navigate('/dashboard')
                  } catch (e) {
                    console.error(e)
                  }
                }}
                className="py-2 px-4 bg-banana-500 hover:bg-banana-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Demo Trader</span>
              </button>
            )}

            {/* User Dropdown Profile */}
            {isAuthenticated && (
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-700 transition-colors"
                >
                  <User className="w-4 h-4" />
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <div className="font-bold text-sm text-slate-900">{user?.username}</div>
                      <div className="text-xs text-slate-400 truncate">{user?.email}</div>
                    </div>

                    <div className="md:hidden py-1">
                      {navItems.map((item) => (
                        <Link
                          key={item.name}
                          to={item.path}
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <item.icon className="w-4 h-4" />
                          <span>{item.name}</span>
                        </Link>
                      ))}
                      <div className="border-t border-slate-100 my-1"></div>
                    </div>

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

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>
    </nav>
  )
}

export default Navbar