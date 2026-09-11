import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { marketService } from '../services/api'
import { useSocket } from './useSocket'

const MarketContext = createContext()

const initialState = {
  bananas: [],
  marketStats: null,
  marketMovers: null,
  selectedBanana: null,
  priceHistory: [],
  loading: {
    bananas: true,
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
    case 'SET_BANANAS':
      return { 
        ...state, 
        bananas: action.payload, 
        loading: { ...state.loading, bananas: false }, 
        error: null 
      }
    case 'UPDATE_BANANA_PRICE':
      return {
        ...state,
        bananas: state.bananas.map(banana =>
          banana.symbol === action.payload.symbol
            ? { ...banana, ...action.payload }
            : banana
        )
      }
    case 'SET_MARKET_STATS':
      return { ...state, marketStats: action.payload }
    case 'SET_MARKET_MOVERS':
      return { ...state, marketMovers: action.payload }
    case 'SET_SELECTED_BANANA':
      return { ...state, selectedBanana: action.payload }
    case 'SET_PRICE_HISTORY':
      return { 
        ...state, 
        priceHistory: action.payload,
        loading: { ...state.loading, priceHistory: false }
      }
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    default:
      return state
  }
}

export const MarketProvider = ({ children }) => {
  const [state, dispatch] = useReducer(marketReducer, initialState)
  const { priceUpdates } = useSocket()

  // Update banana prices from socket updates
  useEffect(() => {
    Object.values(priceUpdates).forEach(update => {
      if (update.isNew) {
        dispatch({
          type: 'UPDATE_BANANA_PRICE',
          payload: {
            symbol: update.symbol,
            currentPrice: update.price,
            priceChange: update.change,
            percentageChange: update.percentageChange,
            marketCap: update.marketCap,
            volume24h: update.volume24h
          }
        })
      }
    })
  }, [priceUpdates])

  const fetchBananas = async (filters = {}) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { key: 'bananas', value: true } })
      const response = await marketService.getBananas(filters)
      dispatch({ type: 'SET_BANANAS', payload: response.data.bananas })
    } catch (error) {
      console.error('Failed to fetch bananas:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load bananas! 🍌😭' })
    }
  }

  const fetchMarketStats = async () => {
    try {
      const response = await marketService.getMarketStats()
      dispatch({ type: 'SET_MARKET_STATS', payload: response.data })
    } catch (error) {
      console.error('Failed to fetch market stats:', error)
    }
  }

  const fetchMarketMovers = async () => {
    try {
      const response = await marketService.getMarketMovers()
      dispatch({ type: 'SET_MARKET_MOVERS', payload: response.data.movers })
    } catch (error) {
      console.error('Failed to fetch market movers:', error)
    }
  }

  const searchBananas = async (query) => {
    try {
      const response = await marketService.searchBananas(query)
      return response.data.results
    } catch (error) {
      console.error('Search failed:', error)
      throw error
    }
  }

  const getBananaDetails = async (symbol) => {
    try {
      const response = await marketService.getBananaDetails(symbol)
      dispatch({ type: 'SET_SELECTED_BANANA', payload: response.data.banana })
      return response.data
    } catch (error) {
      console.error('Failed to fetch banana details:', error)
      throw error
    }
  }

  const getPriceHistory = async (bananaId, timeframe = '1d', interval = '5m') => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { key: 'priceHistory', value: true } })
      const response = await marketService.getPriceHistory(bananaId, timeframe, interval)
      const historyData = response.data.data || []
      dispatch({ type: 'SET_PRICE_HISTORY', payload: historyData })
      return historyData
    } catch (error) {
      console.error('Failed to fetch price history:', error)
      dispatch({ type: 'SET_LOADING', payload: { key: 'priceHistory', value: false } })
      // Return mock data if API fails
      return generateMockPriceHistory(timeframe)
    }
  }

  // Generate mock price history for development
  const generateMockPriceHistory = (timeframe) => {
    const now = new Date()
    const data = []
    let basePrice = 50 + Math.random() * 100
    let timeMs = now.getTime()
    
    // Determine interval and count based on timeframe
    const configs = {
      '1h': { count: 60, interval: 60000 }, // 1 minute intervals
      '1d': { count: 288, interval: 300000 }, // 5 minute intervals  
      '1w': { count: 168, interval: 3600000 }, // 1 hour intervals
      '1m': { count: 30, interval: 86400000 }, // 1 day intervals
      '3m': { count: 90, interval: 86400000 } // 1 day intervals
    }
    
    const config = configs[timeframe] || configs['1d']
    timeMs -= config.count * config.interval
    
    for (let i = 0; i < config.count; i++) {
      const change = (Math.random() - 0.5) * 4
      basePrice = Math.max(10, basePrice + change)
      
      data.push({
        time: new Date(timeMs + i * config.interval).toISOString(),
        price: parseFloat(basePrice.toFixed(2)),
        volume: Math.floor(Math.random() * 1000) + 100
      })
    }
    
    return data
  }

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  // Initialize market data
  useEffect(() => {
    fetchBananas()
    fetchMarketStats()
    fetchMarketMovers()
  }, [])

  const value = {
    ...state,
    fetchBananas,
    fetchMarketStats,
    fetchMarketMovers,
    searchBananas,
    getBananaDetails,
    getPriceHistory,
    clearError
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