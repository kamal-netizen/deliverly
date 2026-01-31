import { Order, Rider, AssignmentPayload, CreateRiderPayload } from '@/types'

// Use relative API URLs since API and frontend are in same app
const API_URL = '/api'

class ApiClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
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
  }

  // Orders
  async getOrders(params?: { status?: string; rider_id?: string }): Promise<Order[]> {
    const query = new URLSearchParams(params as any).toString()
    return this.request<Order[]>(`/orders${query ? `?${query}` : ''}`)
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
    return this.request<Rider[]>('/riders')
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
