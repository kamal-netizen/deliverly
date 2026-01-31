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
        };
        Insert: {
          id?: string;
          shop_domain: string;
          access_token: string;
          scope?: string | null;
          notify_customer_on_fulfill?: boolean;
          installed_at?: string;
        };
        Update: {
          id?: string;
          shop_domain?: string;
          access_token?: string;
          scope?: string | null;
          notify_customer_on_fulfill?: boolean;
          installed_at?: string;
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
        };
        Insert: {
          id?: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string | null;
          email?: string | null;
          active?: boolean;
          created_at?: string;
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
    };
  };
}
