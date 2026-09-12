import React, { createContext, useContext, useReducer, useEffect, useRef, useState } from 'react'
import { marketService } from '../services/api'
import { useSocket } from './useSocket'

const MarketContext = createContext()

// The 8 Canonical Kerala Banana Varieties
export const CANONICAL_BANANAS = [
  { symbol: 'NDR', name: 'Nendran', fullName: 'Nendran Royal Spot', image: '/images/bananas/nendran.jpg', currentPrice: 156.30, priceChange: 4.30, percentageChange: 2.84, volume24h: 48320, category: 'premium', origin: 'Thrissur / Wayanad' },
  { symbol: 'POV', name: 'Poovan', fullName: 'Poovan Mandi Classic', image: '/images/bananas/poovan.jpg', currentPrice: 92.40, priceChange: 1.95, percentageChange: 2.14, volume24h: 42900, category: 'traditional', origin: 'Ernakulam / Kottayam' },
  { symbol: 'KDH', name: 'Kadhali', fullName: 'Kadhali Special Grade', image: '/images/bananas/kadhali.jpg', currentPrice: 108.20, priceChange: -1.90, percentageChange: -1.73, volume24h: 12800, category: 'traditional', origin: 'Alappuzha' },
  { symbol: 'PLK', name: 'Palayankodan', fullName: 'Palayankodan Premium', image: '/images/bananas/palayankodan.jpg', currentPrice: 128.40, priceChange: 7.75, percentageChange: 6.42, volume24h: 82100, category: 'commercial', origin: 'Wayanad' },
  { symbol: 'CKD', name: 'Chenkadali', fullName: 'Chenkadali Red King', image: '/images/bananas/chenkadali.jpg', currentPrice: 142.80, priceChange: 6.90, percentageChange: 5.12, volume24h: 18400, category: 'premium', origin: 'Thiruvananthapuram' },
  { symbol: 'ROB', name: 'Robusta', fullName: 'Robusta Bulk Wholesale', image: '/images/bananas/robusta.jpg', currentPrice: 136.50, priceChange: -1.65, percentageChange: -1.20, volume24h: 61500, category: 'commercial', origin: 'Idukki' },
  { symbol: 'MAT', name: 'Matti', fullName: 'Matti Aromatic Sweet', image: '/images/bananas/matti.jpg', currentPrice: 165.00, priceChange: 5.40, percentageChange: 3.40, volume24h: 9600, category: 'premium', origin: 'Travancore' },
  { symbol: 'RSK', name: 'Rasakadali', fullName: 'Rasakadali Heirloom', image: '/images/bananas/rasakadali.jpg', currentPrice: 104.20, priceChange: 0.95, percentageChange: 0.90, volume24h: 24200, category: 'traditional', origin: 'Palakkad' }
]

// Generate initial intraday price history points for each variety
const generateSeedHistory = (basePrice, symbol) => {
  const times = [
    '09:15', '09:30', '09:45', '10:00', '10:15', '10:30',
    '10:45', '11:00', '11:15', '11:30', '11:45', '12:00',
    '12:15', '12:30', '12:45', '13:00', '13:15', '13:30',
    '13:45', '14:00', '14:15', '14:30', '14:45', '15:00'
  ]

  let cur = basePrice * 0.96
  const points = []
  const seed = (symbol?.charCodeAt(0) || 78) * 11

  for (let i = 0; i < times.length; i++) {
    const wave = Math.sin((seed + i * 23) * 0.1) * (basePrice * 0.008)
    cur = Math.max(basePrice * 0.88, Math.min(basePrice * 1.12, cur + wave))
    points.push({
      time: times[i],
      price: Number(cur.toFixed(2)),
      volume: Math.floor(1200 + Math.abs(Math.sin(i * 1.4)) * 3200)
    })
  }

  // Anchor final point
  points.push({
    time: '15:15',
    price: Number(basePrice.toFixed(2)),
    volume: Math.floor(1800 + Math.random() * 800)
  })

  return points
}

// Initial histories for all 8 bananas
const initialHistories = {}
CANONICAL_BANANAS.forEach(b => {
  initialHistories[b.symbol] = generateSeedHistory(b.currentPrice, b.symbol)
})

const initialState = {
  bananas: CANONICAL_BANANAS,
  marketStats: null,
  marketMovers: null,
  loading: {
    bananas: false,
    priceHistory: false
  },
  error: null
}

const marketReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { 
        ...state, 
        loading: { 
          ...state.loading, 
          [action.payload.key]: action.payload.value 
        } 
      }
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: { ...state.loading, bananas: false } }
    case 'SET_BANANAS': {
      // Merge remote bananas with canonical varieties so all 8 are always present
      const incoming = action.payload || []
      const merged = CANONICAL_BANANAS.map(canonical => {
        const found = incoming.find(b => 
          b.symbol?.toUpperCase() === canonical.symbol.toUpperCase() ||
          b.name?.toLowerCase() === canonical.name.toLowerCase() ||
          (canonical.symbol === 'NDR' && b.symbol?.toUpperCase() === 'NEN') ||
          (canonical.symbol === 'CKD' && b.symbol?.toUpperCase() === 'MAL') ||
          (canonical.symbol === 'MAT' && b.symbol?.toUpperCase() === 'NJP') ||
          (canonical.symbol === 'RSK' && b.symbol?.toUpperCase() === 'RST')
        )
        return found 
          ? { 
              ...canonical, 
              ...found, 
              symbol: canonical.symbol, 
              name: canonical.name, 
              image: canonical.image 
            } 
          : canonical
      })
      return { 
        ...state, 
        bananas: merged, 
        loading: { ...state.loading, bananas: false }, 
        error: null 
      }
    }
    case 'UPDATE_BANANA_PRICE':
      return {
        ...state,
        bananas: state.bananas.map(banana =>
          banana.symbol?.toUpperCase() === action.payload.symbol?.toUpperCase()
            ? { ...banana, ...action.payload }
            : banana
        )
      }
    case 'SET_MARKET_STATS':
      return { ...state, marketStats: action.payload }
    case 'SET_MARKET_MOVERS':
      return { ...state, marketMovers: action.payload }
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    default:
      return state
  }
}

export const MarketProvider = ({ children }) => {
  const [state, dispatch] = useReducer(marketReducer, initialState)
  const { priceUpdates } = useSocket()
  
  // Persistent price histories across variety switching
  const [priceHistories, setPriceHistories] = useState(initialHistories)
  const lastSocketUpdateRef = useRef(Date.now())

  // Append new price point helper
  const recordPricePoint = (symbol, newPrice) => {
    const sym = symbol?.toUpperCase()
    if (!sym) return

    setPriceHistories(prev => {
      const existing = prev[sym] || generateSeedHistory(newPrice, sym)
      const now = new Date()
      const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
      
      const lastPoint = existing[existing.length - 1]
      // If same minute, update last point; otherwise append
      let updated
      if (lastPoint && lastPoint.time === timeStr) {
        updated = [...existing.slice(0, -1), { ...lastPoint, price: Number(newPrice.toFixed(2)) }]
      } else {
        updated = [...existing.slice(-45), { time: timeStr, price: Number(newPrice.toFixed(2)), volume: Math.floor(1500 + Math.random() * 1200) }]
      }

      return {
        ...prev,
        [sym]: updated
      }
    })
  }

  // Update banana prices from socket updates
  useEffect(() => {
    if (!priceUpdates || Object.keys(priceUpdates).length === 0) return

    lastSocketUpdateRef.current = Date.now()

    Object.values(priceUpdates).forEach(update => {
      if (update.isNew || update.price) {
        const symbol = update.symbol?.toUpperCase()
        dispatch({
          type: 'UPDATE_BANANA_PRICE',
          payload: {
            symbol,
            currentPrice: update.price,
            priceChange: update.change,
            percentageChange: update.percentageChange,
            marketCap: update.marketCap,
            volume24h: update.volume24h
          }
        })

        // Record in persistent history
        recordPricePoint(symbol, update.price)
      }
    })
  }, [priceUpdates])

  // Continuous fallback market simulation to ensure prices NEVER stop moving
  useEffect(() => {
    const interval = setInterval(() => {
      // If socket has sent updates within 4.5s, let socket drive
      if (Date.now() - lastSocketUpdateRef.current < 4500) {
        return
      }

      // Pick 1-2 bananas to adjust slightly
      const count = Math.random() > 0.5 ? 2 : 1
      for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * state.bananas.length)
        const banana = state.bananas[randomIndex]
        if (!banana) continue

        const symbol = banana.symbol?.toUpperCase()
        const current = banana.currentPrice
        const delta = (Math.random() - 0.48) * 0.35
        const newPrice = Math.max(10, Number((current + delta).toFixed(2)))
        const base = CANONICAL_BANANAS.find(b => b.symbol === symbol)?.currentPrice || current
        const newChg = Number((newPrice - base).toFixed(2))
        const newPct = Number(((newChg / base) * 100).toFixed(2))

        dispatch({
          type: 'UPDATE_BANANA_PRICE',
          payload: {
            symbol,
            currentPrice: newPrice,
            priceChange: newChg,
            percentageChange: newPct
          }
        })

        recordPricePoint(symbol, newPrice)
      }
    }, 3200)

    return () => clearInterval(interval)
  }, [state.bananas])

  const fetchBananas = async (filters = {}) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { key: 'bananas', value: true } })
      const response = await marketService.getBananas(filters)
      if (response.data?.bananas?.length > 0) {
        dispatch({ type: 'SET_BANANAS', payload: response.data.bananas })
      }
    } catch (error) {
      console.warn('Failed to fetch remote bananas, using canonical list:', error)
      dispatch({ type: 'SET_LOADING', payload: { key: 'bananas', value: false } })
    }
  }

  const fetchMarketStats = async () => {
    try {
      const response = await marketService.getMarketStats()
      dispatch({ type: 'SET_MARKET_STATS', payload: response.data })
    } catch (error) {
      console.warn('Market stats fetch:', error.message)
    }
  }

  const fetchMarketMovers = async () => {
    try {
      const response = await marketService.getMarketMovers()
      dispatch({ type: 'SET_MARKET_MOVERS', payload: response.data?.movers })
    } catch (error) {
      console.warn('Market movers fetch:', error.message)
    }
  }

  const getBananaHistory = (symbol) => {
    const sym = symbol?.toUpperCase()
    return priceHistories[sym] || initialHistories[sym] || generateSeedHistory(120, sym)
  }

  // Initial fetch
  useEffect(() => {
    fetchBananas()
    fetchMarketStats()
    fetchMarketMovers()
  }, [])

  const value = {
    ...state,
    priceHistories,
    getBananaHistory,
    fetchBananas,
    fetchMarketStats,
    fetchMarketMovers,
    canonicalBananas: CANONICAL_BANANAS
  }

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>
}

export const useMarket = () => {
  const context = useContext(MarketContext)
  if (!context) {
    throw new Error('useMarket must be used within a MarketProvider')
  }
  return context
}

export default useMarket