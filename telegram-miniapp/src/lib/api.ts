import axios, { AxiosInstance, AxiosError } from 'axios'
import TelegramWebApp from './telegram'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.swiftpay.ph/api/v1'

class APIClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Add Telegram init data to requests
    this.client.interceptors.request.use((config) => {
      const initData = TelegramWebApp.initData
      if (initData) {
        config.headers['X-Telegram-Init-Data'] = initData
      }
      return config
    })

    // Handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Handle unauthorized
          console.error('Unauthorized access')
        }
        return Promise.reject(error)
      }
    )
  }

  async get<T>(url: string) {
    return this.client.get<T>(url)
  }

  async post<T>(url: string, data?: any) {
    return this.client.post<T>(url, data)
  }

  async patch<T>(url: string, data?: any) {
    return this.client.patch<T>(url, data)
  }

  async delete<T>(url: string) {
    return this.client.delete<T>(url)
  }
}

export const apiClient = new APIClient()
