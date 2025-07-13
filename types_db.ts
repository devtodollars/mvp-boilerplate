export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
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
        Relationships: []
      }
      listings: {
        Row: {
          active: boolean
          address: string
          amenities: Database["public"]["Enums"]["amenity_type"][]
          apartment_number: string | null
          applicants: Json
          area: string
          available: string | null
          available_from: string
          ber_cert_number: string | null
          ber_rating: Database["public"]["Enums"]["ber_rating_enum"] | null
          city: string
          county: string
          created_at: string
          current_females: number
          current_males: number
          description: string
          eircode: string
          ensuite: boolean
          house_rules: string | null
          id: string
          images: Json
          lease_duration:
          | Database["public"]["Enums"]["lease_duration_enum"]
          | null
          monthly_rent: number
          nearby_facilities: Database["public"]["Enums"]["nearby_facility_type"][]
          owner_occupied: boolean
          pets: boolean
          property_name: string
          property_type: Database["public"]["Enums"]["property_type_enum"]
          rent_frequency:
          | Database["public"]["Enums"]["rent_frequency_enum"]
          | null
          room_type: Database["public"]["Enums"]["room_type_enum"]
          security_deposit: number
          size: number | null
          updated_at: string
          user_id: string | null
          verified: boolean
          videos: Json
          viewing_times: string[] | null
        }
        Insert: {
          active?: boolean
          address: string
          amenities?: Database["public"]["Enums"]["amenity_type"][]
          apartment_number?: string | null
          applicants?: Json
          area?: string
          available?: string | null
          available_from?: string
          ber_cert_number?: string | null
          ber_rating?: Database["public"]["Enums"]["ber_rating_enum"] | null
          city?: string
          county?: string
          created_at?: string
          current_females?: number
          current_males?: number
          description: string
          eircode: string
          ensuite?: boolean
          house_rules?: string | null
          id?: string
          images?: Json
          lease_duration?:
          | Database["public"]["Enums"]["lease_duration_enum"]
          | null
          monthly_rent?: number
          nearby_facilities?: Database["public"]["Enums"]["nearby_facility_type"][]
          owner_occupied?: boolean
          pets?: boolean
          property_name: string
          property_type: Database["public"]["Enums"]["property_type_enum"]
          rent_frequency?:
          | Database["public"]["Enums"]["rent_frequency_enum"]
          | null
          room_type?: Database["public"]["Enums"]["room_type_enum"]
          security_deposit?: number
          size?: number | null
          updated_at?: string
          user_id?: string | null
          verified?: boolean
          videos?: Json
          viewing_times?: string[] | null
        }
        Update: {
          active?: boolean
          address?: string
          amenities?: Database["public"]["Enums"]["amenity_type"][]
          apartment_number?: string | null
          applicants?: Json
          area?: string
          available?: string | null
          available_from?: string
          ber_cert_number?: string | null
          ber_rating?: Database["public"]["Enums"]["ber_rating_enum"] | null
          city?: string
          county?: string
          created_at?: string
          current_females?: number
          current_males?: number
          description?: string
          eircode?: string
          ensuite?: boolean
          house_rules?: string | null
          id?: string
          images?: Json
          lease_duration?:
          | Database["public"]["Enums"]["lease_duration_enum"]
          | null
          monthly_rent?: number
          nearby_facilities?: Database["public"]["Enums"]["nearby_facility_type"][]
          owner_occupied?: boolean
          pets?: boolean
          property_name?: string
          property_type?: Database["public"]["Enums"]["property_type_enum"]
          rent_frequency?:
          | Database["public"]["Enums"]["rent_frequency_enum"]
          | null
          room_type?: Database["public"]["Enums"]["room_type_enum"]
          security_deposit?: number
          size?: number | null
          updated_at?: string
          user_id?: string | null
          verified?: boolean
          videos?: Json
          viewing_times?: string[] | null
        }
        Relationships: []
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
        Relationships: []
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
      amenity_type:
      | "Wi-Fi"
      | "Parking"
      | "Garden Access"
      | "Balcony/Terrace"
      | "Washing Machine"
      | "Dryer"
      | "Dishwasher"
      | "Microwave"
      | "TV"
      | "Central Heating"
      | "Fireplace"
      | "Air Conditioning"
      | "Gym Access"
      | "Swimming Pool"
      | "Storage Space"
      | "Bike Storage"
      | "Furnished"
      | "Unfurnished"
      | "Pet Friendly"
      | "Smoking Allowed"
      ber_rating_enum:
      | "A1"
      | "A2"
      | "A3"
      | "B1"
      | "B2"
      | "B3"
      | "C1"
      | "C2"
      | "C3"
      | "D1"
      | "D2"
      | "E1"
      | "E2"
      | "F"
      | "G"
      checkout_mode: "payment" | "setup" | "subscription"
      checkout_payment_status: "paid" | "unpaid" | "no_payment_required"
      checkout_status: "complete" | "expired" | "open"
      lease_duration_enum:
      | "1-month"
      | "2-months"
      | "3-months"
      | "6-months"
      | "12-months"
      | "flexible"
      nearby_facility_type:
      | "Bus Stop"
      | "Train Station"
      | "DART Station"
      | "Luas Stop"
      | "Airport"
      | "Ferry Terminal"
      | "Bike Share Station"
      | "Taxi Rank"
      | "Shopping Centre"
      | "Supermarket"
      | "Convenience Store"
      | "Pharmacy"
      | "Post Office"
      | "Bank"
      | "ATM"
      | "Laundromat"
      | "Dry Cleaners"
      | "Hardware Store"
      | "Hospital"
      | "GP Clinic"
      | "Dental Clinic"
      | "Walk-in Clinic"
      | "Veterinary Clinic"
      | "Primary School"
      | "Secondary School"
      | "University/College"
      | "Library"
      | "Creche/Childcare"
      | "Language School"
      | "Restaurant/Café"
      | "Pub"
      | "Takeaway"
      | "Coffee Shop"
      | "Bakery"
      | "Grocery Market"
      | "Gym/Fitness Centre"
      | "Park"
      | "Beach"
      | "Swimming Pool"
      | "Sports Complex"
      | "Cinema"
      | "Theatre"
      | "Museum"
      | "Art Gallery"
      | "Golf Course"
      | "Tennis Courts"
      | "Playground"
      | "Church"
      | "Mosque"
      | "Temple"
      | "Community Centre"
      | "Garda Station"
      | "Fire Station"
      | "Petrol Station"
      | "Car Park"
      | "Electric Car Charging"
      pricing_plan_interval: "day" | "week" | "month" | "year"
      pricing_type: "one_time" | "recurring"
      property_type_enum: "house" | "apartment" | "flat" | "studio" | "other"
      rent_frequency_enum: "weekly" | "monthly"
      room_type_enum: "single" | "double" | "twin" | "shared" | "digs"
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      amenity_type: [
        "Wi-Fi",
        "Parking",
        "Garden Access",
        "Balcony/Terrace",
        "Washing Machine",
        "Dryer",
        "Dishwasher",
        "Microwave",
        "TV",
        "Central Heating",
        "Fireplace",
        "Air Conditioning",
        "Gym Access",
        "Swimming Pool",
        "Storage Space",
        "Bike Storage",
        "Furnished",
        "Unfurnished",
        "Pet Friendly",
        "Smoking Allowed",
      ],
      ber_rating_enum: [
        "A1",
        "A2",
        "A3",
        "B1",
        "B2",
        "B3",
        "C1",
        "C2",
        "C3",
        "D1",
        "D2",
        "E1",
        "E2",
        "F",
        "G",
      ],
      checkout_mode: ["payment", "setup", "subscription"],
      checkout_payment_status: ["paid", "unpaid", "no_payment_required"],
      checkout_status: ["complete", "expired", "open"],
      lease_duration_enum: [
        "1-month",
        "2-months",
        "3-months",
        "6-months",
        "12-months",
        "flexible",
      ],
      nearby_facility_type: [
        "Bus Stop",
        "Train Station",
        "DART Station",
        "Luas Stop",
        "Airport",
        "Ferry Terminal",
        "Bike Share Station",
        "Taxi Rank",
        "Shopping Centre",
        "Supermarket",
        "Convenience Store",
        "Pharmacy",
        "Post Office",
        "Bank",
        "ATM",
        "Laundromat",
        "Dry Cleaners",
        "Hardware Store",
        "Hospital",
        "GP Clinic",
        "Dental Clinic",
        "Walk-in Clinic",
        "Veterinary Clinic",
        "Primary School",
        "Secondary School",
        "University/College",
        "Library",
        "Creche/Childcare",
        "Language School",
        "Restaurant/Café",
        "Pub",
        "Takeaway",
        "Coffee Shop",
        "Bakery",
        "Grocery Market",
        "Gym/Fitness Centre",
        "Park",
        "Beach",
        "Swimming Pool",
        "Sports Complex",
        "Cinema",
        "Theatre",
        "Museum",
        "Art Gallery",
        "Golf Course",
        "Tennis Courts",
        "Playground",
        "Church",
        "Mosque",
        "Temple",
        "Community Centre",
        "Garda Station",
        "Fire Station",
        "Petrol Station",
        "Car Park",
        "Electric Car Charging",
      ],
      pricing_plan_interval: ["day", "week", "month", "year"],
      pricing_type: ["one_time", "recurring"],
      property_type_enum: ["house", "apartment", "flat", "studio", "other"],
      rent_frequency_enum: ["weekly", "monthly"],
      room_type_enum: ["single", "double", "twin", "shared", "digs"],
      subscription_status: [
        "trialing",
        "active",
        "canceled",
        "incomplete",
        "incomplete_expired",
        "past_due",
        "unpaid",
        "paused",
      ],
    },
  },
} as const
