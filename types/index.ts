// Frontend types
export type OrderStatus = 'pending' | 'assigned' | 'delivered' | 'fulfilled' | 'cancelled' | 'failed';

export type EventType = 'assigned' | 'unassigned' | 'reassigned' | 'delivered' | 'failed' | 'cancelled';

export interface Order {
  id: string;
  shopify_order_id: number;
  order_number: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  shipping_address: any;
  line_items: any;
  total_price: number;
  status: OrderStatus;
  tracking_code: string;
  assigned_rider_id: string | null;
  delivered_at: string | null;
  fulfilled_at: string | null;
  created_at: string;
  updated_at: string;
  assigned_at?: string | null;
  priority?: 'urgent' | 'high' | 'normal' | 'low';
  estimated_delivery_time?: string | null;
  delivery_notes?: string | null;
  riders?: Rider;
  delivery_events?: DeliveryEvent[];
}

export interface Rider {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  active: boolean;
  created_at: string;
  is_online?: boolean;
  current_location?: { lat: number; lng: number } | null;
  last_location_update?: string | null;
  total_deliveries?: number;
  rating?: number;
}

export interface DeliveryEvent {
  id: string;
  order_id: string;
  rider_id: string | null;
  event_type: EventType;
  proof_image_path: string | null;
  proof_url?: string | null;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface AssignmentPayload {
  orderId: string;
  riderId: string;
}

export interface CreateRiderPayload {
  name: string;
  phone?: string;
  email?: string;
}
