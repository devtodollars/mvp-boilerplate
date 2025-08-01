export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          variables?: Json
          extensions?: Json
          operationName?: string
          query?: string
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
          lat: number | null
          lease_duration:
            | Database["public"]["Enums"]["lease_duration_enum"]
            | null
          lng: number | null
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
          views_count: number | null
          last_viewed_at: string | null
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
          lat?: number | null
          lease_duration?:
            | Database["public"]["Enums"]["lease_duration_enum"]
            | null
          lng?: number | null
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
          views_count?: number | null
          last_viewed_at?: string | null
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
          lat?: number | null
          lease_duration?:
            | Database["public"]["Enums"]["lease_duration_enum"]
            | null
          lng?: number | null
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
      applications: {
        Row: {
          id: string
          listing_id: string
          user_id: string
          status: string
          position: number
          applied_at: string
          reviewed_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          user_id: string
          status?: string
          position: number
          applied_at?: string
          reviewed_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          listing_id?: string
          user_id?: string
          status?: string
          position?: number
          applied_at?: string
          reviewed_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_auth_user: {
        Args: { user_id: string }
        Returns: undefined
      }
      get_next_application_position: {
        Args: { listing_uuid: string }
        Returns: number
      }
      add_application_to_queue: {
        Args: { 
          listing_uuid: string
          user_uuid: string
          application_notes?: string | null
        }
        Returns: string
      }
      update_application_status: {
        Args: { 
          application_uuid: string
          new_status: string
          review_notes?: string | null
        }
        Returns: boolean
      }
      reorder_application_queue: {
        Args: { listing_uuid: string }
        Returns: undefined
      }
      increment_listing_views: {
        Args: { listing_uuid: string }
        Returns: number
      }
      get_listing_applicant_count: {
        Args: { listing_uuid: string }
        Returns: number
      }
      get_listing_stats: {
        Args: { listing_uuid: string }
        Returns: {
          applicant_count: number
          views_count: number
          last_viewed_at: string | null
        }[]
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
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          level: number | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          level?: number | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          level?: number | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      prefixes: {
        Row: {
          bucket_id: string
          created_at: string | null
          level: number
          name: string
          updated_at: string | null
        }
        Insert: {
          bucket_id: string
          created_at?: string | null
          level?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          bucket_id?: string
          created_at?: string | null
          level?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prefixes_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_prefixes: {
        Args: { _name: string; _bucket_id: string }
        Returns: undefined
      }
      can_insert_object: {
        Args: { bucketid: string; owner: string; name: string; metadata: Json }
        Returns: undefined
      }
      delete_prefix: {
        Args: { _name: string; _bucket_id: string }
        Returns: boolean
      }
      extension: {
        Args: { name: string }
        Returns: string
      }
      filename: {
        Args: { name: string }
        Returns: string
      }
      foldername: {
        Args: { name: string }
        Returns: string[]
      }
      get_level: {
        Args: { name: string }
        Returns: number
      }
      get_prefix: {
        Args: { name: string }
        Returns: string
      }
      get_prefixes: {
        Args: { name: string }
        Returns: string[]
      }
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          bucket_id: string
          prefix_param: string
        }
        Returns: {
          key: string
          id: string
          created_at: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          bucket_id: string
          start_after?: string
          next_token?: string
          max_keys?: number
          delimiter_param: string
          prefix_param: string
        }
        Returns: {
          updated_at: string
          metadata: Json
          id: string
          name: string
        }[]
      }
      operation: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      search: {
        Args: {
          sortorder?: string
          sortcolumn?: string
          search?: string
          offsets?: number
          levels?: number
          limits?: number
          bucketname: string
          prefix: string
        }
        Returns: {
          last_accessed_at: string
          metadata: Json
          created_at: string
          updated_at: string
          id: string
          name: string
        }[]
      }
      search_legacy_v1: {
        Args: {
          sortcolumn?: string
          prefix: string
          bucketname: string
          limits?: number
          search?: string
          sortorder?: string
          levels?: number
          offsets?: number
        }
        Returns: {
          id: string
          metadata: Json
          last_accessed_at: string
          created_at: string
          updated_at: string
          name: string
        }[]
      }
      search_v1_optimised: {
        Args: {
          prefix: string
          bucketname: string
          limits?: number
          levels?: number
          offsets?: number
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          name: string
          id: string
          updated_at: string
          created_at: string
          last_accessed_at: string
          metadata: Json
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          prefix: string
          start_after?: string
          levels?: number
          limits?: number
        }
        Returns: {
          key: string
          metadata: Json
          name: string
          id: string
          updated_at: string
          created_at: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
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
  storage: {
    Enums: {},
  },
} as const

