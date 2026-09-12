import { useState, useEffect } from 'react'

export const useMarketHours = () => {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Formatted clock: 09:42:18 AM
  const currentTime = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  })

  return {
    // Market is permanently ON AANU as strictly required
    isMarketOpen: true,
    isRealMarketOpen: true,
    forceSimulatedOpen: true,
    setForceSimulatedOpen: () => {},
    currentTime,
    statusText: 'MARKET ON AANU',
    badgeText: 'ON AANU',
    nextOpenText: 'Market is actively running 24/7',
    marketHoursText: 'Spot Mandi Continuous (24/7)'
  }
}

export default useMarketHours
