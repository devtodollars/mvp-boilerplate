export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
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
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
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
      applications: {
        Row: {
          applied_at: string | null
          created_at: string | null
          id: string
          listing_id: string
          notes: string | null
          position: number
          reviewed_at: string | null
          shared_documents: Json | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          created_at?: string | null
          id?: string
          listing_id: string
          notes?: string | null
          position: number
          reviewed_at?: string | null
          shared_documents?: Json | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          applied_at?: string | null
          created_at?: string | null
          id?: string
          listing_id?: string
          notes?: string | null
          position?: number
          reviewed_at?: string | null
          shared_documents?: Json | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          applicant_id: string
          application_id: string
          created_at: string | null
          id: string
          owner_id: string
          updated_at: string | null
        }
        Insert: {
          applicant_id: string
          application_id: string
          created_at?: string | null
          id?: string
          owner_id: string
          updated_at?: string | null
        }
        Update: {
          applicant_id?: string
          application_id?: string
          created_at?: string | null
          id?: string
          owner_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_owner_id_fkey"
            columns: ["owner_id"]
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
          auto_renew: boolean | null
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
          last_payment_date: string | null
          last_viewed_at: string | null
          lat: number | null
          lease_duration:
            | Database["public"]["Enums"]["lease_duration_enum"]
            | null
          lng: number | null
          monthly_rent: number
          nearby_facilities: Database["public"]["Enums"]["nearby_facility_type"][]
          next_payment_attempt: string | null
          owner_occupied: boolean
          payment_amount: number | null
          payment_attempts: number | null
          payment_currency: string | null
          payment_expires_at: string | null
          payment_method: string | null
          payment_reference: string | null
          payment_status: string | null
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
          views_count: number | null
        }
        Insert: {
          active?: boolean
          address: string
          amenities?: Database["public"]["Enums"]["amenity_type"][]
          apartment_number?: string | null
          applicants?: Json
          area?: string
          auto_renew?: boolean | null
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
          last_payment_date?: string | null
          last_viewed_at?: string | null
          lat?: number | null
          lease_duration?:
            | Database["public"]["Enums"]["lease_duration_enum"]
            | null
          lng?: number | null
          monthly_rent?: number
          nearby_facilities?: Database["public"]["Enums"]["nearby_facility_type"][]
          next_payment_attempt?: string | null
          owner_occupied?: boolean
          payment_amount?: number | null
          payment_attempts?: number | null
          payment_currency?: string | null
          payment_expires_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
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
          views_count?: number | null
        }
        Update: {
          active?: boolean
          address?: string
          amenities?: Database["public"]["Enums"]["amenity_type"][]
          apartment_number?: string | null
          applicants?: Json
          area?: string
          auto_renew?: boolean | null
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
          last_payment_date?: string | null
          last_viewed_at?: string | null
          lat?: number | null
          lease_duration?:
            | Database["public"]["Enums"]["lease_duration_enum"]
            | null
          lng?: number | null
          monthly_rent?: number
          nearby_facilities?: Database["public"]["Enums"]["nearby_facility_type"][]
          next_payment_attempt?: string | null
          owner_occupied?: boolean
          payment_amount?: number | null
          payment_attempts?: number | null
          payment_currency?: string | null
          payment_expires_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
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
          views_count?: number | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          chat_room_id: string
          content: string
          created_at: string | null
          id: string
          read_at: string | null
          sender_id: string
          updated_at: string | null
        }
        Insert: {
          chat_room_id: string
          content: string
          created_at?: string | null
          id?: string
          read_at?: string | null
          sender_id: string
          updated_at?: string | null
        }
        Update: {
          chat_room_id?: string
          content?: string
          created_at?: string | null
          id?: string
          read_at?: string | null
          sender_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_room_id_fkey"
            columns: ["chat_room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          message: string
          navigation_target: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message: string
          navigation_target?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string
          navigation_target?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          expires_at: string | null
          id: string
          listing_id: string | null
          metadata: Json | null
          payment_method: string | null
          payment_reference: string | null
          status: string
          stripe_customer_id: string | null
          stripe_payment_intent_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          listing_id?: string | null
          metadata?: Json | null
          payment_method?: string | null
          payment_reference?: string | null
          status: string
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          listing_id?: string | null
          metadata?: Json | null
          payment_method?: string | null
          payment_reference?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
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
        Relationships: []
      }
      users: {
        Row: {
          avatar_id: string | null
          avatar_url: string | null
          billing_address: Json | null
          bio: string | null
          created_at: string | null
          date_of_birth: string | null
          first_name: string | null
          full_name: string | null
          gender: Database["public"]["Enums"]["gender_enum"] | null
          id: string
          last_login: string | null
          last_name: string | null
          liked_listings: string[] | null
          marital_status:
            | Database["public"]["Enums"]["marital_status_enum"]
            | null
          occupation: string | null
          owned_listings: string[] | null
          payment_method: Json | null
          pending_applications: string[] | null
          pets: boolean | null
          phone: string | null
          rejected_applications: string[] | null
          smoker: boolean | null
          successful_applications: string[] | null
          updated_at: string | null
          uploaded_documents: string[] | null
          verified: boolean | null
        }
        Insert: {
          avatar_id?: string | null
          avatar_url?: string | null
          billing_address?: Json | null
          bio?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          first_name?: string | null
          full_name?: string | null
          gender?: Database["public"]["Enums"]["gender_enum"] | null
          id: string
          last_login?: string | null
          last_name?: string | null
          liked_listings?: string[] | null
          marital_status?:
            | Database["public"]["Enums"]["marital_status_enum"]
            | null
          occupation?: string | null
          owned_listings?: string[] | null
          payment_method?: Json | null
          pending_applications?: string[] | null
          pets?: boolean | null
          phone?: string | null
          rejected_applications?: string[] | null
          smoker?: boolean | null
          successful_applications?: string[] | null
          updated_at?: string | null
          uploaded_documents?: string[] | null
          verified?: boolean | null
        }
        Update: {
          avatar_id?: string | null
          avatar_url?: string | null
          billing_address?: Json | null
          bio?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          first_name?: string | null
          full_name?: string | null
          gender?: Database["public"]["Enums"]["gender_enum"] | null
          id?: string
          last_login?: string | null
          last_name?: string | null
          liked_listings?: string[] | null
          marital_status?:
            | Database["public"]["Enums"]["marital_status_enum"]
            | null
          occupation?: string | null
          owned_listings?: string[] | null
          payment_method?: Json | null
          pending_applications?: string[] | null
          pets?: boolean | null
          phone?: string | null
          rejected_applications?: string[] | null
          smoker?: boolean | null
          successful_applications?: string[] | null
          updated_at?: string | null
          uploaded_documents?: string[] | null
          verified?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_application_to_queue: {
        Args: {
          application_notes?: string
          listing_uuid: string
          user_uuid: string
        }
        Returns: string
      }
      can_access_shared_document: {
        Args: { document_path: string; user_id: string }
        Returns: boolean
      }
      check_expired_listings: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      check_user_exists: {
        Args: { email_to_check: string }
        Returns: boolean
      }
      delete_all_notifications: {
        Args: { user_uuid: string }
        Returns: number
      }
      delete_auth_user: {
        Args: { user_id: string }
        Returns: undefined
      }
      delete_notification: {
        Args: { notification_id: string }
        Returns: boolean
      }
      extend_listing_payment: {
        Args: { days_to_add?: number; listing_uuid: string }
        Returns: boolean
      }
      get_listing_applicant_count: {
        Args: { listing_uuid: string }
        Returns: number
      }
      get_listing_payment_info: {
        Args: { listing_uuid: string }
        Returns: {
          can_renew: boolean
          days_remaining: number
          is_active: boolean
          listing_id: string
          payment_amount: number
          payment_expires_at: string
          payment_status: string
        }[]
      }
      get_listing_stats: {
        Args: { listing_uuid: string }
        Returns: {
          applicant_count: number
          last_viewed_at: string
          views_count: number
        }[]
      }
      get_next_application_position: {
        Args: { listing_uuid: string }
        Returns: number
      }
      get_or_create_chat_room: {
        Args:
          | {
              applicant_uuid: string
              application_uuid: string
              listing_uuid: string
              owner_uuid: string
            }
          | { application_uuid: string }
        Returns: string
      }
      increment_listing_views: {
        Args: { listing_uuid: string }
        Returns: number
      }
      mark_messages_as_read: {
        Args: { chat_room_uuid: string }
        Returns: undefined
      }
      reapply_to_property: {
        Args: {
          application_notes?: string
          listing_uuid: string
          user_uuid: string
        }
        Returns: string
      }
      reorder_application_queue: {
        Args: { listing_uuid: string }
        Returns: undefined
      }
      update_application_status: {
        Args: {
          application_uuid: string
          new_status: string
          review_notes?: string
        }
        Returns: boolean
      }
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
      gender_enum: "male" | "female" | "prefer_not_to_say"
      lease_duration_enum:
        | "1-month"
        | "2-months"
        | "3-months"
        | "6-months"
        | "12-months"
        | "flexible"
      marital_status_enum:
        | "single"
        | "married"
        | "living with partner"
        | "divorced"
        | "widowed"
      navigation_target_type:
        | "application_detail"
        | "chat_room"
        | "applications_list"
        | "dashboard"
        | "profile"
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
      gender_enum: ["male", "female", "prefer_not_to_say"],
      lease_duration_enum: [
        "1-month",
        "2-months",
        "3-months",
        "6-months",
        "12-months",
        "flexible",
      ],
      marital_status_enum: [
        "single",
        "married",
        "living with partner",
        "divorced",
        "widowed",
      ],
      navigation_target_type: [
        "application_detail",
        "chat_room",
        "applications_list",
        "dashboard",
        "profile",
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
