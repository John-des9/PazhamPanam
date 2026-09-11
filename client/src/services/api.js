import axios from 'axios'

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/'
    }
    
    // Return error with user-friendly message
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        'Something went wrong! 😭'
    
    return Promise.reject({
      ...error,
      message: errorMessage,
      status: error.response?.status
    })
  }
)

// Auth service
export const authService = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  demoLogin: () => api.post('/auth/demo-login'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  logout: () => api.post('/auth/logout')
}

// Market service
export const marketService = {
  getBananas: (filters = {}) => {
    const params = new URLSearchParams(filters).toString()
    return api.get(`/bananas?${params}`)
  },
  getBananaDetails: (symbol) => api.get(`/bananas/${symbol}`),
  getPriceHistory: (symbol, timeframe = '1d', interval = '5m') => {
    return api.get(`/bananas/${symbol}/history`, {
      params: { timeframe, interval }
    })
  },
  searchBananas: (query) => api.get('/bananas/search', { params: { q: query } }),
  getMarketStats: () => api.get('/bananas/stats'),
  getMarketOverview: () => api.get('/market/overview'),
  getMarketMovers: (limit = 5) => api.get('/market/movers', { params: { limit } })
}

// Trading service
export const tradingService = {
  buyBanana: (tradeData) => api.post('/trading/buy', tradeData),
  sellBanana: (tradeData) => api.post('/trading/sell', tradeData),
  executeTrade: (orderData) => {
    const payload = {
      bananaSymbol: orderData.bananaSymbol || orderData.symbol,
      quantity: orderData.quantity,
      type: orderData.type
    }
    return orderData.type === 'buy' ? api.post('/trading/buy', payload) : api.post('/trading/sell', payload)
  },
  getPortfolio: () => api.get('/trading/portfolio'),
  getTransactionHistory: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString()
    return api.get(`/trading/history?${queryParams}`)
  }
}

// User service
export const userService = {
  getBalance: () => api.get('/users/balance')
}

// Toast notifications helper
export const showToast = (message, type = 'info') => {
  // This will be implemented with a toast component
  console.log(`${type.toUpperCase()}: ${message}`)
}

export default api