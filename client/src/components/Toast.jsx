import React, { useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

let addToast = () => {}

const Toast = ({ id, type, message, duration = 5000, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(id)
    }, duration)

    return () => clearTimeout(timer)
  }, [id, duration, onRemove])

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />
  }

  const styles = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200'
  }

  return (
    <div className={`
      flex items-center justify-between p-4 rounded-lg border shadow-lg max-w-md w-full
      transform transition-all duration-300 ease-in-out
      ${styles[type]}
    `}>
      <div className="flex items-center space-x-3">
        {icons[type]}
        <span className="font-medium">{message}</span>
      </div>
      <button
        onClick={() => onRemove(id)}
        className="ml-3 p-1 rounded-full hover:bg-white hover:bg-opacity-30 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export const Toaster = () => {
  const [toasts, setToasts] = useState([])

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  addToast = (type, message, duration) => {
    const id = Date.now() + Math.random()
    const toast = { id, type, message, duration }
    
    setToasts(prev => [...prev, toast])
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          {...toast}
          onRemove={removeToast}
        />
      ))}
    </div>
  )
}

// Export functions to show toasts
export const toast = {
  success: (message, duration) => addToast('success', message, duration),
  error: (message, duration) => addToast('error', message, duration),
  warning: (message, duration) => addToast('warning', message, duration),
  info: (message, duration) => addToast('info', message, duration)
}

export default Toast