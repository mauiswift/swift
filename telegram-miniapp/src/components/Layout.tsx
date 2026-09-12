import { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import BottomNav from './BottomNav'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const isDashboard = location.pathname === '/'

  return (
    <div className="flex flex-col min-h-screen w-full bg-slate-900 text-white">
      {/* Safe area top padding */}
      <div className="safe-top" />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom navigation */}
      <BottomNav />

      {/* Safe area bottom padding */}
      <div className="safe-bottom" />
    </div>
  )
}
