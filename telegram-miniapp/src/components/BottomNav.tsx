import { Link, useLocation } from 'react-router-dom'
import { Home, Send, Wallet, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/transactions', icon: Send, label: 'Transactions' },
  { path: '/wallet', icon: Wallet, label: 'Wallet' },
  { path: '/settings', icon: Settings, label: 'Settings' },
]

export default function BottomNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-700 bg-slate-800">
      <div className="flex items-center justify-around">
        {navigation.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex flex-col items-center justify-center flex-1 py-3 transition-colors',
                isActive ? 'text-primary-500' : 'text-slate-400 hover:text-slate-300'
              )}
              title={label}
            >
              <Icon size={24} />
              <span className="text-xs mt-1">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
