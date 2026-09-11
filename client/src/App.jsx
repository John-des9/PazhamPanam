import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { MarketProvider } from './hooks/useMarket'
import { SocketProvider } from './hooks/useSocket'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import BananaDetail from './pages/BananaDetail'
import Portfolio from './pages/Portfolio'
import Activity from './pages/Activity'
import { Toaster } from './components/Toast'

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <MarketProvider>
            <div className="min-h-screen bg-gray-50">
              <Navbar />
              <main>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/banana/:symbol" element={<BananaDetail />} />
                  <Route path="/portfolio" element={<Portfolio />} />
                  <Route path="/activity" element={<Activity />} />
                </Routes>
              </main>
              <Toaster />
            </div>
          </MarketProvider>
        </SocketProvider>
      </AuthProvider>
    </Router>
  )
}

export default App