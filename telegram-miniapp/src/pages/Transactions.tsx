import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api'
import { Card } from '@/components/Card'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Transaction {
  id: string
  type: 'in' | 'out'
  amount: number
  description?: string
  status: 'pending' | 'completed' | 'failed'
  createdAt: string
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTransactions()
  }, [])

  const loadTransactions = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/transactions')
      if (response.data) {
        setTransactions(response.data)
      }
    } catch (error) {
      console.error('Failed to load transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6 mt-4">Transactions</h1>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : transactions.length > 0 ? (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <Card key={tx.id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{tx.description || 'Transaction'}</p>
                  <p className="text-xs text-slate-400 mt-1">{formatDate(tx.createdAt)}</p>
                  <div className="mt-2 flex gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      tx.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
                <p className={`text-lg font-semibold ${
                  tx.type === 'in' ? 'text-green-400' : 'text-slate-200'
                }`}>
                  {tx.type === 'in' ? '+' : '-'}{formatCurrency(tx.amount)}
                </p>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-8 text-slate-400">
          No transactions yet
        </Card>
      )}
    </div>
  )
}
