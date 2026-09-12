import React, { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'

const SocketContext = createContext()

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const [priceUpdates, setPriceUpdates] = useState({})
  const [marketSentiment, setMarketSentiment] = useState('Market loading...')

  useEffect(() => {
    const serverUrl = import.meta.env?.VITE_SERVER_URL || 
      (import.meta.env?.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:5000')
    const newSocket = io(serverUrl, {
      transports: ['websocket', 'polling']
    })

    newSocket.on('connect', () => {
      console.log('🔌 Connected to Pazham Panam server!')
      setConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('🔌 Disconnected from server')
      setConnected(false)
    })

    newSocket.on('market:initial', (data) => {
      console.log('📊 Received initial market data:', data.message)
    })

    newSocket.on('price:update', (data) => {
      console.log('💰 Price update received:', data.updates?.length, 'bananas')
      
      // Update market sentiment
      if (data.marketSentiment) {
        setMarketSentiment(data.marketSentiment)
      }
      
      // Process price updates
      if (data.updates) {
        const updateMap = {}
        data.updates.forEach(update => {
          updateMap[update.symbol] = {
            ...update,
            timestamp: data.timestamp,
            isNew: true // Flag to trigger animations
          }
        })
        
        setPriceUpdates(prev => ({
          ...prev,
          ...updateMap
        }))
        
        // Clear the "new" flag after animation time
        setTimeout(() => {
          setPriceUpdates(prev => {
            const updated = { ...prev }
            Object.keys(updateMap).forEach(symbol => {
              if (updated[symbol]) {
                updated[symbol] = { ...updated[symbol], isNew: false }
              }
            })
            return updated
          })
        }, 500)
      }
    })

    newSocket.on('connect_error', (error) => {
      console.error('🔌 Connection error:', error)
      setConnected(false)
    })

    setSocket(newSocket)

    // Cleanup on unmount
    return () => {
      newSocket.close()
    }
  }, [])

  const subscribeToPriceUpdates = (callback) => {
    if (socket) {
      socket.on('price:update', callback)
      
      return () => {
        socket.off('price:update', callback)
      }
    }
  }

  const getPriceUpdate = (symbol) => {
    return priceUpdates[symbol] || null
  }

  const value = {
    socket,
    connected,
    priceUpdates,
    marketSentiment,
    subscribeToPriceUpdates,
    getPriceUpdate
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

export default useSocket