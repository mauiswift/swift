import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-slate-800 border border-slate-700 p-4',
        onClick && 'cursor-pointer hover:bg-slate-750 active:opacity-80 transition-colors',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
