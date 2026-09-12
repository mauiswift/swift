export interface User {
  id: number
  telegramId: string
  firstName: string
  lastName?: string
  username?: string
  phoneNumber?: string
  email?: string
  createdAt: string
  updatedAt: string
}

export interface Wallet {
  id: string
  userId: number
  currency: string
  balance: number
  availableBalance: number
  createdAt: string
  updatedAt: string
}

export interface Transaction {
  id: string
  userId: number
  type: 'in' | 'out'
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed'
  description?: string
  reference?: string
  createdAt: string
  updatedAt: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}
