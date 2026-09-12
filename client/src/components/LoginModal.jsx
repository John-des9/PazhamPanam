import React, { useState } from 'react'
import { X, Eye, EyeOff, Loader2, Zap, ArrowRight } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

const LoginModal = ({ isOpen, onClose, onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { login, demoLogin } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await login(formData.email, formData.password)
      onClose()
      navigate('/dashboard')
    } catch (err) {
      console.error('Login submit error:', err)
      setError(err.message || 'Login nadannilla mone. Details onnu check cheyyu.')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickDemo = async (email, password) => {
    setLoading(true)
    setError('')
    setFormData({ email, password })

    try {
      await login(email, password)
      onClose()
      navigate('/dashboard')
    } catch (err) {
      // Fallback to instant demo-login endpoint if local password check fails
      try {
        await demoLogin()
        onClose()
        navigate('/dashboard')
      } catch (err2) {
        setError('Login nadannilla mone. Details onnu check cheyyu.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border-2 border-amber-300 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 p-1.5 flex items-center justify-center shadow-xs">
              <img src="/banana-logo.svg" alt="Pazham Panam" className="w-7 h-7 object-contain" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Login to Pazham Panam</h2>
              <p className="text-xs text-amber-900 font-semibold">Entha edukkane? Trade cheyyam!</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-amber-200/80 rounded-xl text-slate-600 hover:text-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-xs font-bold leading-relaxed">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-xs font-bold text-slate-700 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-amber-400 transition-colors"
              placeholder="pazhampro@gmail.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-bold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-amber-400 transition-colors pr-10"
                placeholder="password123"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Clickable 1-Click Demo Accounts */}
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-[11px] font-black text-amber-950 uppercase tracking-wider">
              <span className="flex items-center space-x-1">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>Quick Demo Accounts (1-Click Fill & Login):</span>
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('pazhampro@gmail.com', 'password123')}
                className="p-2 bg-white hover:bg-amber-100 border border-amber-300 rounded-lg text-left text-xs transition-colors shadow-xs"
              >
                <div className="font-extrabold text-slate-900">pazhampro</div>
                <div className="text-[10px] text-slate-500">pazhampro@gmail.com</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('banana@trade.com', 'password123')}
                className="p-2 bg-white hover:bg-amber-100 border border-amber-300 rounded-lg text-left text-xs transition-colors shadow-xs"
              >
                <div className="font-extrabold text-slate-900">bananatrade</div>
                <div className="text-[10px] text-slate-500">banana@trade.com</div>
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-slate-950 font-black text-sm rounded-xl border border-amber-500 shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span>Checking credentials...</span>
              </>
            ) : (
              <>
                <span>Login to Market</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Switch to Register */}
          <div className="text-center text-xs text-slate-600 pt-1">
            <span>New to Pazham Panam? </span>
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-amber-800 hover:text-amber-950 font-black underline underline-offset-2"
            >
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LoginModal