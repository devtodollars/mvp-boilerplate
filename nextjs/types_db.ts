export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      checkout_sessions: {
        Row: {
          created: string
          id: string
          metadata: Json | null
          mode: Database["public"]["Enums"]["checkout_mode"] | null
          payment_status:
            | Database["public"]["Enums"]["checkout_payment_status"]
            | null
          price_id: string | null
          quantity: number | null
          status: Database["public"]["Enums"]["checkout_status"] | null
          user_id: string
        }
        Insert: {
          created?: string
          id: string
          metadata?: Json | null
          mode?: Database["public"]["Enums"]["checkout_mode"] | null
          payment_status?:
            | Database["public"]["Enums"]["checkout_payment_status"]
            | null
          price_id?: string | null
          quantity?: number | null
          status?: Database["public"]["Enums"]["checkout_status"] | null
          user_id: string
        }
        Update: {
          created?: string
          id?: string
          metadata?: Json | null
          mode?: Database["public"]["Enums"]["checkout_mode"] | null
          payment_status?:
            | Database["public"]["Enums"]["checkout_payment_status"]
            | null
          price_id?: string | null
          quantity?: number | null
          status?: Database["public"]["Enums"]["checkout_status"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkout_sessions_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkout_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          id: string
          stripe_customer_id: string | null
        }
        Insert: {
          id: string
          stripe_customer_id?: string | null
        }
        Update: {
          id?: string
          stripe_customer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      prices: {
        Row: {
          active: boolean | null
          currency: string | null
          description: string | null
          id: string
          interval: Database["public"]["Enums"]["pricing_plan_interval"] | null
          interval_count: number | null
          metadata: Json | null
          product_id: string | null
          trial_period_days: number | null
          type: Database["public"]["Enums"]["pricing_type"] | null
          unit_amount: number | null
        }
        Insert: {
          active?: boolean | null
          currency?: string | null
          description?: string | null
          id: string
          interval?: Database["public"]["Enums"]["pricing_plan_interval"] | null
          interval_count?: number | null
          metadata?: Json | null
          product_id?: string | null
          trial_period_days?: number | null
          type?: Database["public"]["Enums"]["pricing_type"] | null
          unit_amount?: number | null
        }
        Update: {
          active?: boolean | null
          currency?: string | null
          description?: string | null
          id?: string
          interval?: Database["public"]["Enums"]["pricing_plan_interval"] | null
          interval_count?: number | null
          metadata?: Json | null
          product_id?: string | null
          trial_period_days?: number | null
          type?: Database["public"]["Enums"]["pricing_type"] | null
          unit_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean | null
          description: string | null
          id: string
          image: string | null
          metadata: Json | null
          name: string | null
        }
        Insert: {
          active?: boolean | null
          description?: string | null
          id: string
          image?: string | null
          metadata?: Json | null
          name?: string | null
        }
        Update: {
          active?: boolean | null
          description?: string | null
          id?: string
          image?: string | null
          metadata?: Json | null
          name?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at: string | null
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created: string
          current_period_end: string
          current_period_start: string
          ended_at: string | null
          id: string
          metadata: Json | null
          price_id: string | null
          xmr_price_id: string | null
          quantity: number | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          trial_end: string | null
          trial_start: string | null
          user_id: string
        }
        Insert: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created?: string
          current_period_end?: string
          current_period_start?: string
          ended_at?: string | null
          id: string
          metadata?: Json | null
          price_id?: string | null
          xmr_price_id?: string | null
          quantity?: number | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          trial_end?: string | null
          trial_start?: string | null
          user_id: string
        }
        Update: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created?: string
          current_period_end?: string
          current_period_start?: string
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          price_id?: string | null
          xmr_price_id?: string | null
          quantity?: number | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          trial_end?: string | null
          trial_start?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_xmr_price_id_fkey"
            columns: ["xmr_price_id"]
            isOneToOne: false
            referencedRelation: "xmr_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          billing_address: Json | null
          full_name: string | null
          id: string
          payment_method: Json | null
        }
        Insert: {
          avatar_url?: string | null
          billing_address?: Json | null
          full_name?: string | null
          id: string
          payment_method?: Json | null
        }
        Update: {
          avatar_url?: string | null
          billing_address?: Json | null
          full_name?: string | null
          id?: string
          payment_method?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      xmr_invoices: {
        Row: {
          id: string
          user_id: string | null
          product_id: string | null
          price_id: string | null
          amount_xmr: number
          status: Database["public"]["Enums"]["xmr_invoice_status"]
          address: string | null
          created_at: string | null
          confirmed_at: string | null
        }
        Insert: {
          id: string
          user_id?: string | null
          product_id?: string | null
          price_id?: string | null
          amount_xmr: number
          status?: Database["public"]["Enums"]["xmr_invoice_status"]
          address?: string | null
          created_at?: string | null
          confirmed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          product_id?: string | null
          price_id?: string | null
          amount_xmr?: number
          status?: Database["public"]["Enums"]["xmr_invoice_status"]
          address?: string | null
          created_at?: string | null
          confirmed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "xmr_invoices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "xmr_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xmr_invoices_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "xmr_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xmr_invoices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      xmr_prices: {
        Row: {
          id: string
          product_id: string | null
          active: boolean | null
          description: string | null
          amount_xmr: number
          interval: Database["public"]["Enums"]["billing_interval"]
          interval_count: number | null
          trial_period_days: number | null
          metadata: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          product_id?: string | null
          active?: boolean | null
          description?: string | null
          amount_xmr: number
          interval?: Database["public"]["Enums"]["billing_interval"]
          interval_count?: number | null
          trial_period_days?: number | null
          metadata?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          product_id?: string | null
          active?: boolean | null
          description?: string | null
          amount_xmr?: number
          interval?: Database["public"]["Enums"]["billing_interval"]
          interval_count?: number | null
          trial_period_days?: number | null
          metadata?: Json | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "xmr_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "xmr_products"
            referencedColumns: ["id"]
          },
        ]
      }
      xmr_products: {
        Row: {
          id: string
          name: string
          active: boolean | null
          description: string | null
          image: string | null
          features: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          active?: boolean | null
          description?: string | null
          image?: string | null
          features?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          active?: boolean | null
          description?: string | null
          image?: string | null
          features?: Json | null
          created_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      billing_interval: "month" | "year"
      xmr_invoice_status: "pending" | "payment_detected" | "confirmed" | "expired"
      checkout_mode: "payment" | "setup" | "subscription"
      checkout_payment_status: "paid" | "unpaid" | "no_payment_required"
      checkout_status: "complete" | "expired" | "open"
      pricing_plan_interval: "day" | "week" | "month" | "year"
      pricing_type: "one_time" | "recurring"
      subscription_status:
        | "trialing"
        | "active"
        | "canceled"
        | "incomplete"
        | "incomplete_expired"
        | "past_due"
        | "unpaid"
        | "paused"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

