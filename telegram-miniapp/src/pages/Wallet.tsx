import { useEffect, useState } from 'react'
import { Copy, Check } from 'lucide-react'
import TelegramWebApp from '@/lib/telegram'
import { apiClient } from '@/lib/api'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { formatCurrency } from '@/lib/utils'

interface WalletData {
  id: string
  balance: number
  currency: string
  address?: string
}

export default function Wallet() {
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadWallet()
  }, [])

  const loadWallet = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/wallet')
      if (response.data) {
        setWallet(response.data)
      }
    } catch (error) {
      console.error('Failed to load wallet:', error)
      TelegramWebApp.showAlert('Failed to load wallet')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyAddress = () => {
    if (wallet?.address) {
      navigator.clipboard.writeText(wallet.address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6 mt-4">Wallet</h1>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : wallet ? (
        <div className="space-y-6">
          {/* Balance Card */}
          <Card className="text-center bg-gradient-to-br from-primary-600 to-primary-700 border-primary-600">
            <p className="text-slate-200 mb-2">Available Balance</p>
            <h2 className="text-4xl font-bold">
              {formatCurrency(wallet.balance, wallet.currency)}
            </h2>
          </Card>

          {/* Wallet Address */}
          {wallet.address && (
            <Card>
              <p className="text-sm text-slate-400 mb-3">Receive Address</p>
              <div className="bg-slate-900 rounded-lg p-3 mb-3 break-all font-mono text-sm">
                {wallet.address}
              </div>
              <Button
                size="md"
                variant="outline"
                onClick={handleCopyAddress}
                icon={copied ? <Check size={16} /> : <Copy size={16} />}
              >
                {copied ? 'Copied!' : 'Copy Address'}
              </Button>
            </Card>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Button size="lg" variant="primary">
              Request Money
            </Button>
            <Button size="lg" variant="secondary">
              Send Money
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
