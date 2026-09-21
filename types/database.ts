/**
 * Hand-maintained mirror of the SQL schema.
 *
 * NOT yet bound to the Supabase clients via createClient<Database>(). Binding
 * it makes every table resolve to never, because satisfying supabase-js's
 * internal schema constraint takes more than the visible shape below.
 * Regenerate against the live project instead, then bind:
 *
 *   npx supabase gen types typescript --project-id <ref> > types/database.ts
 *
 * Until then this file is documentation, and drift is not caught by the
 * compiler - keep it in step with supabase/migrations/ by hand.
 */
export interface Database {
  public: {
    Tables: {
      shopify_config: {
        Row: {
          id: string;
          shop_domain: string;
          access_token: string;
          scope: string | null;
          notify_customer_on_fulfill: boolean;
          installed_at: string;
          last_sync_at: string | null;
        };
        Insert: {
          id?: string;
          shop_domain: string;
          access_token: string;
          scope?: string | null;
          notify_customer_on_fulfill?: boolean;
          installed_at?: string;
          last_sync_at?: string | null;
        };
        Update: {
          id?: string;
          shop_domain?: string;
          access_token?: string;
          scope?: string | null;
          notify_customer_on_fulfill?: boolean;
          installed_at?: string;
          last_sync_at?: string | null;
        };
      };
      riders: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          email: string | null;
          active: boolean;
          created_at: string;
          is_online: boolean;
          current_location: { lat: number; lng: number } | null;
          last_location_update: string | null;
          total_deliveries: number;
          rating: number;
        };
        Insert: {
          id?: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          active?: boolean;
          created_at?: string;
          is_online?: boolean;
          current_location?: { lat: number; lng: number } | null;
          last_location_update?: string | null;
          total_deliveries?: number;
          rating?: number;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string | null;
          email?: string | null;
          active?: boolean;
          created_at?: string;
          is_online?: boolean;
          current_location?: { lat: number; lng: number } | null;
          last_location_update?: string | null;
          total_deliveries?: number;
          rating?: number;
        };
      };
      orders: {
        Row: {
          id: string;
          shopify_order_id: number;
          order_number: string;
          customer_name: string | null;
          customer_phone: string | null;
          customer_email: string | null;
          shipping_address: any | null;
          line_items: any | null;
          total_price: number | null;
          status: 'pending' | 'assigned' | 'delivered' | 'fulfilled' | 'cancelled' | 'failed';
          tracking_code: string;
          assigned_rider_id: string | null;
          delivered_at: string | null;
          fulfilled_at: string | null;
          shopify_fulfillment_id: number | null;
          created_at: string;
          updated_at: string;
          assigned_at: string | null;
          priority: 'urgent' | 'high' | 'normal' | 'low';
          estimated_delivery_time: string | null;
          delivery_notes: string | null;
          financial_status: string | null;
          fulfillment_status: string | null;
          payment_gateway_names: string[] | null;
          currency: string | null;
          subtotal_price: number | null;
          total_tax: number | null;
          total_discounts: number | null;
          tags: string[] | null;
          note: string | null;
          order_url: string | null;
        };
        Insert: {
          id?: string;
          shopify_order_id: number;
          order_number: string;
          customer_name?: string | null;
          customer_phone?: string | null;
          customer_email?: string | null;
          shipping_address?: any | null;
          line_items?: any | null;
          total_price?: number | null;
          status?: 'pending' | 'assigned' | 'delivered' | 'fulfilled' | 'cancelled' | 'failed';
          tracking_code: string;
          assigned_rider_id?: string | null;
          delivered_at?: string | null;
          fulfilled_at?: string | null;
          shopify_fulfillment_id?: number | null;
          created_at?: string;
          updated_at?: string;
          assigned_at?: string | null;
          priority?: 'urgent' | 'high' | 'normal' | 'low';
          estimated_delivery_time?: string | null;
          delivery_notes?: string | null;
          financial_status?: string | null;
          fulfillment_status?: string | null;
          payment_gateway_names?: string[] | null;
          currency?: string | null;
          subtotal_price?: number | null;
          total_tax?: number | null;
          total_discounts?: number | null;
          tags?: string[] | null;
          note?: string | null;
          order_url?: string | null;
        };
        Update: {
          id?: string;
          shopify_order_id?: number;
          order_number?: string;
          customer_name?: string | null;
          customer_phone?: string | null;
          customer_email?: string | null;
          shipping_address?: any | null;
          line_items?: any | null;
          total_price?: number | null;
          status?: 'pending' | 'assigned' | 'delivered' | 'fulfilled' | 'cancelled' | 'failed';
          tracking_code?: string;
          assigned_rider_id?: string | null;
          delivered_at?: string | null;
          fulfilled_at?: string | null;
          shopify_fulfillment_id?: number | null;
          created_at?: string;
          updated_at?: string;
          assigned_at?: string | null;
          priority?: 'urgent' | 'high' | 'normal' | 'low';
          estimated_delivery_time?: string | null;
          delivery_notes?: string | null;
          financial_status?: string | null;
          fulfillment_status?: string | null;
          payment_gateway_names?: string[] | null;
          currency?: string | null;
          subtotal_price?: number | null;
          total_tax?: number | null;
          total_discounts?: number | null;
          tags?: string[] | null;
          note?: string | null;
          order_url?: string | null;
        };
      };
      delivery_events: {
        Row: {
          id: string;
          order_id: string | null;
          rider_id: string | null;
          event_type: 'assigned' | 'unassigned' | 'reassigned' | 'delivered' | 'failed' | 'cancelled';
          proof_image_path: string | null;
          notes: string | null;
          latitude: number | null;
          longitude: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id?: string | null;
          rider_id?: string | null;
          event_type: 'assigned' | 'unassigned' | 'reassigned' | 'delivered' | 'failed' | 'cancelled';
          proof_image_path?: string | null;
          notes?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string | null;
          rider_id?: string | null;
          event_type?: 'assigned' | 'unassigned' | 'reassigned' | 'delivered' | 'failed' | 'cancelled';
          proof_image_path?: string | null;
          notes?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string;
        };
      };
      webhook_log: {
        Row: {
          id: string;
          topic: string;
          shopify_order_id: number | null;
          payload: any | null;
          processed: boolean;
          error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          topic: string;
          shopify_order_id?: number | null;
          payload?: any | null;
          processed?: boolean;
          error?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          topic?: string;
          shopify_order_id?: number | null;
          payload?: any | null;
          processed?: boolean;
          error?: string | null;
          created_at?: string;
        };
      };
      assignment_history: {
        Row: {
          id: string;
          order_id: string;
          rider_id: string | null;
          assigned_by: string | null;
          action: 'assigned' | 'reassigned' | 'unassigned';
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          rider_id?: string | null;
          assigned_by?: string | null;
          action: 'assigned' | 'reassigned' | 'unassigned';
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          rider_id?: string | null;
          assigned_by?: string | null;
          action?: 'assigned' | 'reassigned' | 'unassigned';
          notes?: string | null;
          created_at?: string;
        };
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      order_status: 'pending' | 'assigned' | 'delivered' | 'fulfilled' | 'cancelled' | 'failed';
      event_type: 'assigned' | 'unassigned' | 'reassigned' | 'delivered' | 'failed' | 'cancelled';
    };
    CompositeTypes: { [_ in never]: never };
  };
}
