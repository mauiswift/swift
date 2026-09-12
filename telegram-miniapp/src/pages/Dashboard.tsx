import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Send, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import TelegramWebApp from '@/lib/telegram'
import { apiClient } from '@/lib/api'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { formatCurrency } from '@/lib/utils'

interface WalletData {
  balance: number
  currency: string
}

interface Transaction {
  id: string
  type: 'in' | 'out'
  amount: number
  description?: string
  createdAt: string
}

export default function Dashboard() {
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    TelegramWebApp.expand()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [walletRes, transactionsRes] = await Promise.all([
        apiClient.get('/wallet'),
        apiClient.get('/transactions?limit=5'),
      ])

      if (walletRes.data) setWallet(walletRes.data)
      if (transactionsRes.data) setTransactions(transactionsRes.data)
    } catch (error) {
      console.error('Failed to load data:', error)
      TelegramWebApp.showAlert('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center mt-4">
        <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
        <p className="text-slate-400">Manage your wallet</p>
      </div>

      {/* Balance Card */}
      {wallet ? (
        <Card className="text-center bg-gradient-to-br from-primary-600 to-primary-700 border-primary-600">
          <p className="text-slate-200 mb-2">Total Balance</p>
          <h2 className="text-4xl font-bold mb-4">
            {formatCurrency(wallet.balance, wallet.currency)}
          </h2>
          <div className="flex gap-3 justify-center">
            <Link to="/wallet" className="flex-1">
              <Button size="sm" variant="outline" className="w-full">
                <ArrowDownLeft size={16} />
                Receive
              </Button>
            </Link>
            <Link to="/transactions" className="flex-1">
              <Button size="sm" variant="outline" className="w-full">
                <Send size={16} />
                Send
              </Button>
            </Link>
          </div>
        </Card>
      ) : loading ? (
        <Card className="h-40 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </Card>
      ) : null}

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Recent Transactions</h3>
          <Link to="/transactions" className="text-primary-500 hover:text-primary-400 text-sm">
            View all
          </Link>
        </div>

        {transactions.length > 0 ? (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <Card key={tx.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    tx.type === 'in'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {tx.type === 'in' ? (
                      <ArrowDownLeft size={20} />
                    ) : (
                      <ArrowUpRight size={20} />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{tx.description || 'Transaction'}</p>
                    <p className="text-xs text-slate-400">Just now</p>
                  </div>
                </div>
                <p className={`font-semibold ${
                  tx.type === 'in' ? 'text-green-400' : 'text-slate-200'
                }`}>
                  {tx.type === 'in' ? '+' : '-'}{formatCurrency(tx.amount)}
                </p>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-8 text-slate-400">
            No transactions yet
          </Card>
        )}
      </div>
    </div>
  )
}
