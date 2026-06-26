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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          id: string
          must_change_password: boolean
          password_hash: string
          password_salt: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          must_change_password?: boolean
          password_hash: string
          password_salt: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          must_change_password?: boolean
          password_hash?: string
          password_salt?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          amount_due_now: number
          amount_paid: number
          check_in: string
          check_out: string
          created_at: string
          guest_email: string
          guest_name: string
          guest_phone: string
          id: string
          nights: number
          notes: string
          num_guests: number
          num_rooms: number
          payment_option: Database["public"]["Enums"]["payment_option"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          paystack_reference: string | null
          price_per_night: number
          reference: string
          room_type_id: string
          room_type_name: string
          status: Database["public"]["Enums"]["booking_status"]
          total_amount: number
          updated_at: string
        }
        Insert: {
          amount_due_now?: number
          amount_paid?: number
          check_in: string
          check_out: string
          created_at?: string
          guest_email: string
          guest_name: string
          guest_phone: string
          id?: string
          nights: number
          notes?: string
          num_guests?: number
          num_rooms?: number
          payment_option?: Database["public"]["Enums"]["payment_option"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          paystack_reference?: string | null
          price_per_night: number
          reference: string
          room_type_id: string
          room_type_name: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_amount: number
          updated_at?: string
        }
        Update: {
          amount_due_now?: number
          amount_paid?: number
          check_in?: string
          check_out?: string
          created_at?: string
          guest_email?: string
          guest_name?: string
          guest_phone?: string
          id?: string
          nights?: number
          notes?: string
          num_guests?: number
          num_rooms?: number
          payment_option?: Database["public"]["Enums"]["payment_option"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          paystack_reference?: string | null
          price_per_night?: number
          reference?: string
          room_type_id?: string
          room_type_name?: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      hotel_settings: {
        Row: {
          about: string
          address: string
          currency: string
          currency_symbol: string
          deposit_percent: number
          email: string
          hero_image_url: string
          id: number
          name: string
          paystack_public_key: string
          paystack_secret_key: string
          phone: string
          tagline: string
          updated_at: string
        }
        Insert: {
          about?: string
          address?: string
          currency?: string
          currency_symbol?: string
          deposit_percent?: number
          email?: string
          hero_image_url?: string
          id?: number
          name?: string
          paystack_public_key?: string
          paystack_secret_key?: string
          phone?: string
          tagline?: string
          updated_at?: string
        }
        Update: {
          about?: string
          address?: string
          currency?: string
          currency_symbol?: string
          deposit_percent?: number
          email?: string
          hero_image_url?: string
          id?: number
          name?: string
          paystack_public_key?: string
          paystack_secret_key?: string
          phone?: string
          tagline?: string
          updated_at?: string
        }
        Relationships: []
      }
      room_types: {
        Row: {
          active: boolean
          amenities: string[]
          capacity: number
          created_at: string
          description: string
          id: string
          image_url: string
          name: string
          price_per_night: number
          sort_order: number
          total_inventory: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          amenities?: string[]
          capacity?: number
          created_at?: string
          description?: string
          id?: string
          image_url?: string
          name: string
          price_per_night: number
          sort_order?: number
          total_inventory?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          amenities?: string[]
          capacity?: number
          created_at?: string
          description?: string
          id?: string
          image_url?: string
          name?: string
          price_per_night?: number
          sort_order?: number
          total_inventory?: number
          updated_at?: string
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
      booking_status: "pending" | "confirmed" | "cancelled" | "completed"
      payment_option: "full" | "deposit" | "none"
      payment_status: "unpaid" | "deposit_paid" | "paid" | "refunded"
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
  public: {
    Enums: {
      booking_status: ["pending", "confirmed", "cancelled", "completed"],
      payment_option: ["full", "deposit", "none"],
      payment_status: ["unpaid", "deposit_paid", "paid", "refunded"],
    },
  },
} as const
