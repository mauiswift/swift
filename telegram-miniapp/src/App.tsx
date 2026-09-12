import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import TelegramWebApp from './lib/telegram'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Wallet from './pages/Wallet'
import Settings from './pages/Settings'

function App() {
  const [appReady, setAppReady] = useState(false)

  useEffect(() => {
    // Initialize Telegram Web App
    TelegramWebApp.init()
    
    // Set up main button
    TelegramWebApp.MainButton?.setText('Close')
    TelegramWebApp.MainButton?.onClick(() => {
      TelegramWebApp.close()
    })
    TelegramWebApp.MainButton?.show()

    // Set up back button
    TelegramWebApp.BackButton?.onClick(() => {
      window.history.back()
    })

    setAppReady(true)

    return () => {
      TelegramWebApp.MainButton?.hide()
    }
  }, [])

  if (!appReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-500/20 mb-4">
            <div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-slate-400">Loading SwiftPay...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
