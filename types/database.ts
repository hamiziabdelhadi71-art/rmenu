export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      restaurants: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          description: string | null;
          address: string | null;
          phone: string | null;
          is_active: boolean;
          minimum_order: number;
          tax_rate: number;
          delivery_fee: number;
          theme_primary_color: string;
          template_name: string | null;
          operating_hours: Json;
          delivery_zones: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          description?: string | null;
          address?: string | null;
          phone?: string | null;
          is_active?: boolean;
          minimum_order?: number;
          tax_rate?: number;
          delivery_fee?: number;
          theme_primary_color?: string;
          template_name?: string | null;
          operating_hours?: Json;
          delivery_zones?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          description?: string | null;
          address?: string | null;
          phone?: string | null;
          is_active?: boolean;
          minimum_order?: number;
          tax_rate?: number;
          delivery_fee?: number;
          theme_primary_color?: string;
          template_name?: string | null;
          operating_hours?: Json;
          delivery_zones?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          restaurant_id: string;
          name: string;
          description: string | null;
          image_url: string | null;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          name: string;
          description?: string | null;
          image_url?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          name?: string;
          description?: string | null;
          image_url?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      menu_items: {
        Row: {
          id: string;
          category_id: string;
          restaurant_id: string;
          name: string;
          description: string | null;
          base_price: number;
          image_url: string | null;
          is_available: boolean;
          tags: string[];
          display_order: number;
          sizes: { name: string; price: number }[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          restaurant_id: string;
          name: string;
          description?: string | null;
          base_price: number;
          image_url?: string | null;
          is_available?: boolean;
          tags?: string[];
          display_order?: number;
          sizes?: { name: string; price: number }[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          restaurant_id?: string;
          name?: string;
          description?: string | null;
          base_price?: number;
          image_url?: string | null;
          is_available?: boolean;
          tags?: string[];
          display_order?: number;
          sizes?: { name: string; price: number }[];
          created_at?: string;
          updated_at?: string;
        };
      };
      modifier_groups: {
        Row: {
          id: string;
          restaurant_id: string;
          name: string;
          description: string | null;
          selection_type: "single" | "multiple";
          is_required: boolean;
          min_select: number;
          max_select: number;
          is_size_group: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          name: string;
          description?: string | null;
          selection_type?: "single" | "multiple";
          is_required?: boolean;
          min_select?: number;
          max_select?: number;
          is_size_group?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          name?: string;
          description?: string | null;
          selection_type?: "single" | "multiple";
          is_required?: boolean;
          min_select?: number;
          max_select?: number;
          is_size_group?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      modifiers: {
        Row: {
          id: string;
          group_id: string;
          name: string;
          price_adjustment: number;
          is_available: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          name: string;
          price_adjustment?: number;
          is_available?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          name?: string;
          price_adjustment?: number;
          is_available?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      menu_item_modifier_groups: {
        Row: {
          id: string;
          menu_item_id: string;
          modifier_group_id: string;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          menu_item_id: string;
          modifier_group_id: string;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          menu_item_id?: string;
          modifier_group_id?: string;
          display_order?: number;
          created_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          restaurant_id: string;
          customer_name: string;
          customer_phone: string;
          customer_email: string | null;
          order_type: "delivery" | "pickup";
          delivery_address: string | null;
          delivery_notes: string | null;
          status:
            | "pending"
            | "confirmed"
            | "preparing"
            | "ready"
            | "out_for_delivery"
            | "delivered"
            | "cancelled";
          subtotal: number;
          tax_amount: number;
          delivery_fee: number;
          total: number;
          notes: string | null;
          source: string;
          created_at: string;
          updated_at: string;
          confirmed_at: string | null;
          prepared_at: string | null;
          delivered_at: string | null;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          customer_name: string;
          customer_phone: string;
          customer_email?: string | null;
          order_type?: "delivery" | "pickup";
          delivery_address?: string | null;
          delivery_notes?: string | null;
          status?:
            | "pending"
            | "confirmed"
            | "preparing"
            | "ready"
            | "out_for_delivery"
            | "delivered"
            | "cancelled";
          subtotal: number;
          tax_amount?: number;
          delivery_fee?: number;
          total: number;
          notes?: string | null;
          source?: string;
          created_at?: string;
          updated_at?: string;
          confirmed_at?: string | null;
          prepared_at?: string | null;
          delivered_at?: string | null;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          customer_name?: string;
          customer_phone?: string;
          customer_email?: string | null;
          order_type?: "delivery" | "pickup";
          delivery_address?: string | null;
          delivery_notes?: string | null;
          status?:
            | "pending"
            | "confirmed"
            | "preparing"
            | "ready"
            | "out_for_delivery"
            | "delivered"
            | "cancelled";
          subtotal?: number;
          tax_amount?: number;
          delivery_fee?: number;
          total?: number;
          notes?: string | null;
          source?: string;
          created_at?: string;
          updated_at?: string;
          confirmed_at?: string | null;
          prepared_at?: string | null;
          delivered_at?: string | null;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          menu_item_id: string | null;
          item_name: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          selected_modifiers: Json;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          menu_item_id?: string | null;
          item_name: string;
          quantity?: number;
          unit_price: number;
          total_price: number;
          selected_modifiers?: Json;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          menu_item_id?: string | null;
          item_name?: string;
          quantity?: number;
          unit_price?: number;
          total_price?: number;
          selected_modifiers?: Json;
          notes?: string | null;
          created_at?: string;
        };
      };
      page_views: {
        Row: {
          id: string;
          restaurant_id: string;
          viewed_at: string;
          page_path: string | null;
          referrer: string | null;
          user_agent: string | null;
          session_id: string | null;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          viewed_at?: string;
          page_path?: string | null;
          referrer?: string | null;
          user_agent?: string | null;
          session_id?: string | null;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          viewed_at?: string;
          page_path?: string | null;
          referrer?: string | null;
          user_agent?: string | null;
          session_id?: string | null;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      order_status:
        | "pending"
        | "confirmed"
        | "preparing"
        | "ready"
        | "out_for_delivery"
        | "delivered"
        | "cancelled";
      order_type: "delivery" | "pickup";
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
