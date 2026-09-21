import { Order, Rider, AssignmentPayload, CreateRiderPayload } from '@/types'

// Relative: the API and the dashboard are the same origin, so session cookies
// ride along automatically and no Authorization header is needed.
const API_URL = '/api'

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

let redirectingToLogin = false

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
      // Session expired or never existed. Bounce once: concurrent polling
      // queries would otherwise stack up redirects.
      if (response.status === 401 && typeof window !== 'undefined') {
        if (!redirectingToLogin) {
          redirectingToLogin = true
          window.location.href = '/login'
        }
        throw new ApiError(401, 'Your session has expired. Please sign in again.')
      }

      throw new ApiError(response.status, await readErrorMessage(response))
    }

    return response.json()
  }

  // Orders
  // Errors propagate so React Query can set isError. Returning [] here used to
  // make a 500 render as "No orders found".
  async getOrders(params?: { status?: string; rider_id?: string }): Promise<Order[]> {
    const query = new URLSearchParams(params as any).toString()
    const result = await this.request<{ orders: Order[] } | Order[]>(
      `/orders${query ? `?${query}` : ''}`
    )
    const orders = Array.isArray(result) ? result : (result as any)?.orders
    return Array.isArray(orders) ? orders : []
  }

  async getOrder(id: string): Promise<Order> {
    const result = await this.request<{ order: Order } | Order>(`/orders/${id}`)
    return (result as any)?.order ?? (result as Order)
  }

  async assignOrder(payload: AssignmentPayload): Promise<void> {
    return this.request<void>('/assignments', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  async unassignOrder(orderId: string): Promise<void> {
    return this.request<void>(`/assignments/${orderId}`, {
      method: 'DELETE',
    })
  }

  // Riders
  async getRiders(): Promise<Rider[]> {
    const result = await this.request<{ riders: Rider[] } | Rider[]>('/riders')
    const riders = Array.isArray(result) ? result : (result as any)?.riders
    return Array.isArray(riders) ? riders : []
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
    today: { total: number; pending: number; assigned: number; delivered: number; cancelled: number }
    activeRiders: number
    allTime: { totalOrders: number; totalDeliveries: number }
    awaitingFulfillment: number
    timezone: string
  }> {
    return this.request('/stats')
  }
}

/** Routes answer with { error: string }; fall back to the status text. */
async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json()
    if (body && typeof body.error === 'string') return body.error
  } catch {
    // non-JSON body
  }
  return response.statusText || 'Request failed'
}

export const apiClient = new ApiClient()
