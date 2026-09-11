import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TrendingUp, Banana, IndianRupee, ArrowRight, BarChart3, Users, Shield } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import LoginModal from '../components/LoginModal'
import RegisterModal from '../components/RegisterModal'

const Landing = () => {
  const navigate = useNavigate()
  const { isAuthenticated, demoLogin } = useAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)

  if (isAuthenticated) {
    navigate('/dashboard')
    return null
  }

  const handleDemoAccess = async () => {
    try {
      setDemoLoading(true)
      await demoLogin()
      navigate('/dashboard')
    } catch (e) {
      console.error(e)
      navigate('/dashboard')
    } finally {
      setDemoLoading(false)
    }
  }

  const features = [
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Real-time Trading',
      description: 'Live banana prices with instant buy/sell execution'
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Market Analysis', 
      description: 'Professional charts and market sentiment tracking'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Secure Trading',
      description: 'Safe virtual trading environment for learning'
    }
  ]

  const bananaVarieties = [
    { name: 'Palayankodan', price: '₹128.40', change: '+6.42%', trend: 'up' },
    { name: 'Njalipoovan', price: '₹95.20', change: '+3.18%', trend: 'up' },
    { name: 'Nendran', price: '₹156.30', change: '+2.84%', trend: 'up' },
    { name: 'Robusta', price: '₹145.80', change: '-2.41%', trend: 'down' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-banana-50 via-white to-banana-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 text-6xl">🍌</div>
          <div className="absolute top-40 right-32 text-4xl">💰</div>
          <div className="absolute bottom-40 left-32 text-5xl">📈</div>
          <div className="absolute bottom-20 right-20 text-3xl">🚀</div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-20">
          <div className="text-center">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="flex items-center space-x-3">
                <img src="/banana-logo.svg" alt="Pazham Panam" className="w-16 h-16" />
                <div>
                  <h1 className="text-4xl md:text-6xl font-bold text-gray-900">
                    Pazham <span className="text-banana-500">Panam</span>
                  </h1>
                  <p className="text-lg md:text-xl text-banana-600 font-medium">
                    Trade Pazham. Make Panam.
                  </p>
                </div>
              </div>
            </div>

            {/* Main Headline */}
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Kerala's Premium
              <br />
              <span className="text-banana-500">Banana Stock Market</span>
            </h2>

            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
              Experience the future of agriculture trading. Buy and sell Kerala's finest banana varieties 
              with real-time market data, professional charts, and instant execution.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <button
                onClick={handleDemoAccess}
                disabled={demoLoading}
                className="py-4 px-8 bg-banana-500 hover:bg-banana-400 text-slate-950 font-black text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center space-x-2 group active:scale-[0.98]"
              >
                <span>{demoLoading ? 'Entering Market...' : 'Instant Demo Trader (₹25,000)'}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => navigate('/dashboard')}
                className="py-4 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-base rounded-2xl shadow-md transition-all flex items-center justify-center space-x-2"
              >
                <span>Explore Live Market</span>
              </button>
              
              <button
                onClick={() => setShowLoginModal(true)}
                className="py-4 px-6 bg-white hover:bg-slate-100 text-slate-700 font-bold text-base rounded-2xl border border-slate-200 shadow-sm transition-all"
              >
                <span>Login</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Live Market Preview */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Live Market Preview
          </h3>
          <p className="text-gray-600">
            Real-time banana prices from Kerala's premium markets
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {bananaVarieties.map((banana, index) => (
            <div key={index} className="card p-6 hover:shadow-lg transition-all duration-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-gray-900">{banana.name}</h4>
                  <div className="text-2xl font-bold text-gray-900 mt-2">
                    {banana.price}
                  </div>
                </div>
                <div className="text-3xl opacity-60">🍌</div>
              </div>
              
              <div className={`flex items-center text-sm font-medium ${
                banana.trend === 'up' ? 'text-success' : 'text-danger'
              }`}>
                <TrendingUp className={`w-4 h-4 mr-1 ${
                  banana.trend === 'down' ? 'rotate-180' : ''
                }`} />
                {banana.change}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-gray-500 text-sm mb-4">
            Market updates every 5 seconds • Live trading available 24/7
          </p>
          <div className="inline-flex items-center text-success font-medium">
            <div className="w-2 h-2 bg-success rounded-full mr-2 animate-pulse"></div>
            Market is getting ripe! 🚀
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Why Pazham Panam?
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Professional trading platform designed for the modern agricultural market
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6">
                <div className="w-12 h-12 bg-banana-100 rounded-lg flex items-center justify-center mx-auto mb-4 text-banana-600">
                  {feature.icon}
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h4>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-banana-500 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <div className="text-4xl font-bold mb-2">8+</div>
              <div className="text-banana-100">Banana Varieties</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">₹50L+</div>
              <div className="text-banana-100">Market Cap</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-banana-100">Live Trading</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">Real-time</div>
              <div className="text-banana-100">Price Updates</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-900 py-20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Trade Bananas?
          </h3>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of traders in Kerala's premium banana market
          </p>
          
          <button
            onClick={() => setShowRegisterModal(true)}
            className="btn btn-primary px-8 py-4 text-lg font-semibold"
          >
            Get Started - It's Free!
          </button>
          
          <p className="text-gray-400 text-sm mt-4">
            Start with ₹10,000 virtual money • No real money required
          </p>
        </div>
      </div>

      {/* Modals */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onSwitchToRegister={() => {
          setShowLoginModal(false)
          setShowRegisterModal(true)
        }}
      />
      
      <RegisterModal 
        isOpen={showRegisterModal} 
        onClose={() => setShowRegisterModal(false)}
        onSwitchToLogin={() => {
          setShowRegisterModal(false)
          setShowLoginModal(true)
        }}
      />
    </div>
  )
}

export default Landing