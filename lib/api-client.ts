import { Order, Rider, AssignmentPayload, CreateRiderPayload } from '@/types'
import toast from 'react-hot-toast'

// Use relative API URLs since API and frontend are in same app
const API_URL = '/api'

class ApiClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error || 'API request failed')
      }

      return response.json()
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error)
      toast.error(`Failed to ${options?.method || 'fetch'} data`)
      throw error
    }
  }

  // Orders
  async getOrders(params?: { status?: string; rider_id?: string }): Promise<Order[]> {
    try {
      const query = new URLSearchParams(params as any).toString()
      const result = await this.request<{ orders: Order[] } | Order[]>(`/orders${query ? `?${query}` : ''}`)
      // Handle both wrapped and direct array responses
      const orders = Array.isArray(result) ? result : (result as any)?.orders
      return Array.isArray(orders) ? orders : []
    } catch (error) {
      console.error('Failed to fetch orders:', error)
      return [] // Return empty array on error to prevent filter crashes
    }
  }

  async getOrder(id: string): Promise<Order> {
    return this.request<Order>(`/orders/${id}`)
  }

  async assignOrder(payload: AssignmentPayload): Promise<void> {
    return this.request<void>('/assignments', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  async unassignOrder(assignmentId: string): Promise<void> {
    return this.request<void>(`/assignments/${assignmentId}`, {
      method: 'DELETE',
    })
  }

  // Riders
  async getRiders(): Promise<Rider[]> {
    try {
      const result = await this.request<{ riders: Rider[] } | Rider[]>('/riders')
      // Handle both wrapped and direct array responses
      const riders = Array.isArray(result) ? result : (result as any)?.riders
      return Array.isArray(riders) ? riders : []
    } catch (error) {
      console.error('Failed to fetch riders:', error)
      return [] // Return empty array on error
    }
  }

  async createRider(payload: CreateRiderPayload): Promise<Rider> {
    return this.request<Rider>('/riders', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  async updateRider(id: string, payload: Partial<Rider>): Promise<Rider> {
    return this.request<Rider>(`/riders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  }

  // Helper method for dispatch board
  async assignRider(orderId: string, riderId: string): Promise<void> {
    return this.assignOrder({ orderId, riderId })
  }

  // Tracking
  async getTracking(code: string): Promise<Order> {
    return this.request<Order>(`/track/${code}`)
  }

  // Stats
  async getStats(): Promise<{
    today: { total: number; pending: number; assigned: number; delivered: number; fulfilled: number }
    activeRiders: number
    allTime: { totalOrders: number; totalDeliveries: number }
  }> {
    return this.request('/stats')
  }
}

export const apiClient = new ApiClient()
