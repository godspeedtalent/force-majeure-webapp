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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      api_logs: {
        Row: {
          created_at: string
          details: Json | null
          endpoint: string | null
          id: string
          ip: string | null
          level: string
          message: string | null
          method: string | null
          request_id: string | null
          source: string | null
          status: number | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          endpoint?: string | null
          id?: string
          ip?: string | null
          level?: string
          message?: string | null
          method?: string | null
          request_id?: string | null
          source?: string | null
          status?: number | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          endpoint?: string | null
          id?: string
          ip?: string | null
          level?: string
          message?: string | null
          method?: string | null
          request_id?: string | null
          source?: string | null
          status?: number | null
          user_agent?: string | null
        }
        Relationships: []
      }
      artists: {
        Row: {
          bio: string | null
          created_at: string
          genre: string | null
          id: string
          image_url: string | null
          name: string
          social_links: Json | null
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          genre?: string | null
          id?: string
          image_url?: string | null
          name: string
          social_links?: Json | null
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          genre?: string | null
          id?: string
          image_url?: string | null
          name?: string
          social_links?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      event_artists: {
        Row: {
          artist_id: string
          created_at: string
          event_id: string
          id: string
          is_headliner: boolean | null
          performance_order: number | null
        }
        Insert: {
          artist_id: string
          created_at?: string
          event_id: string
          id?: string
          is_headliner?: boolean | null
          performance_order?: number | null
        }
        Update: {
          artist_id?: string
          created_at?: string
          event_id?: string
          id?: string
          is_headliner?: boolean | null
          performance_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_artists_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_artists_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          date: string
          description: string | null
          end_time: string | null
          headliner_id: string | null
          hero_image: string | null
          id: string
          is_after_hours: boolean
          ticket_url: string | null
          time: string
          title: string
          undercard_ids: string[] | null
          updated_at: string
          venue_id: string | null
        }
        Insert: {
          created_at?: string
          date: string
          description?: string | null
          end_time?: string | null
          headliner_id?: string | null
          hero_image?: string | null
          id?: string
          is_after_hours?: boolean
          ticket_url?: string | null
          time: string
          title: string
          undercard_ids?: string[] | null
          updated_at?: string
          venue_id?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          description?: string | null
          end_time?: string | null
          headliner_id?: string | null
          hero_image?: string | null
          id?: string
          is_after_hours?: boolean
          ticket_url?: string | null
          time?: string
          title?: string
          undercard_ids?: string[] | null
          updated_at?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_headliner_id_fkey"
            columns: ["headliner_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_events_venue_id"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      exclusive_content_grants: {
        Row: {
          access_count: number
          accessed_at: string | null
          content_type: string
          content_url: string
          created_at: string
          event_id: string
          expires_at: string | null
          id: string
          order_id: string | null
          user_id: string
        }
        Insert: {
          access_count?: number
          accessed_at?: string | null
          content_type: string
          content_url: string
          created_at?: string
          event_id: string
          expires_at?: string | null
          id?: string
          order_id?: string | null
          user_id: string
        }
        Update: {
          access_count?: number
          accessed_at?: string | null
          content_type?: string
          content_url?: string
          created_at?: string
          event_id?: string
          expires_at?: string | null
          id?: string
          order_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exclusive_content_grants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exclusive_content_grants_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          description: string | null
          disabled: boolean
          environment: string
          flag_name: string
          id: string
          is_enabled: boolean
          updated_at: string
        }
        Insert: {
          description?: string | null
          disabled?: boolean
          environment?: string
          flag_name: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
        }
        Update: {
          description?: string | null
          disabled?: boolean
          environment?: string
          flag_name?: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      merch: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          in_stock: boolean
          name: string
          price: number
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean
          name: string
          price: number
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean
          name?: string
          price?: number
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          fees_cents: number | null
          id: string
          order_id: string
          quantity: number
          subtotal_cents: number | null
          ticket_tier_id: string
          total_cents: number | null
          unit_fee_cents: number
          unit_price_cents: number
        }
        Insert: {
          created_at?: string
          fees_cents?: number | null
          id?: string
          order_id: string
          quantity: number
          subtotal_cents?: number | null
          ticket_tier_id: string
          total_cents?: number | null
          unit_fee_cents?: number
          unit_price_cents: number
        }
        Update: {
          created_at?: string
          fees_cents?: number | null
          id?: string
          order_id?: string
          quantity?: number
          subtotal_cents?: number | null
          ticket_tier_id?: string
          total_cents?: number | null
          unit_fee_cents?: number
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_ticket_tier_id_fkey"
            columns: ["ticket_tier_id"]
            isOneToOne: false
            referencedRelation: "ticket_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          currency: string
          event_id: string
          fees_cents: number
          id: string
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          subtotal_cents: number
          total_cents: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          event_id: string
          fees_cents?: number
          id?: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          subtotal_cents: number
          total_cents: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          event_id?: string
          fees_cents?: number
          id?: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          subtotal_cents?: number
          total_cents?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          full_name: string | null
          id: string
          instagram_handle: string | null
          is_public: boolean | null
          phone_number: string | null
          show_on_leaderboard: boolean | null
          spotify_access_token_encrypted: string | null
          spotify_connected: boolean | null
          spotify_refresh_token_encrypted: string | null
          spotify_token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          full_name?: string | null
          id?: string
          instagram_handle?: string | null
          is_public?: boolean | null
          phone_number?: string | null
          show_on_leaderboard?: boolean | null
          spotify_access_token_encrypted?: string | null
          spotify_connected?: boolean | null
          spotify_refresh_token_encrypted?: string | null
          spotify_token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          full_name?: string | null
          id?: string
          instagram_handle?: string | null
          is_public?: boolean | null
          phone_number?: string | null
          show_on_leaderboard?: boolean | null
          spotify_access_token_encrypted?: string | null
          spotify_connected?: boolean | null
          spotify_refresh_token_encrypted?: string | null
          spotify_token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scavenger_claims: {
        Row: {
          claim_position: number
          claimed_at: string
          device_fingerprint: string | null
          id: string
          location_id: string
          show_on_leaderboard: boolean
          user_id: string
        }
        Insert: {
          claim_position: number
          claimed_at?: string
          device_fingerprint?: string | null
          id?: string
          location_id: string
          show_on_leaderboard?: boolean
          user_id: string
        }
        Update: {
          claim_position?: number
          claimed_at?: string
          device_fingerprint?: string | null
          id?: string
          location_id?: string
          show_on_leaderboard?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scavenger_claims_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "scavenger_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      scavenger_locations: {
        Row: {
          checkin_count: number
          created_at: string
          id: string
          is_active: boolean
          location_description: string | null
          location_name: string
          updated_at: string
        }
        Insert: {
          checkin_count?: number
          created_at?: string
          id?: string
          is_active?: boolean
          location_description?: string | null
          location_name: string
          updated_at?: string
        }
        Update: {
          checkin_count?: number
          created_at?: string
          id?: string
          is_active?: boolean
          location_description?: string | null
          location_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      scavenger_tokens: {
        Row: {
          claimed_at: string | null
          claimed_by_user_id: string | null
          created_at: string
          id: string
          is_claimed: boolean
          location_id: string
          token_hash: string
          token_salt: string
          updated_at: string
        }
        Insert: {
          claimed_at?: string | null
          claimed_by_user_id?: string | null
          created_at?: string
          id?: string
          is_claimed?: boolean
          location_id: string
          token_hash: string
          token_salt: string
          updated_at?: string
        }
        Update: {
          claimed_at?: string | null
          claimed_by_user_id?: string | null
          created_at?: string
          id?: string
          is_claimed?: boolean
          location_id?: string
          token_hash?: string
          token_salt?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scavenger_tokens_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "scavenger_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      songs: {
        Row: {
          artist_id: string
          created_at: string
          duration: number | null
          id: string
          is_preview: boolean | null
          music_source: string | null
          song_name: string
          streaming_link: string
          updated_at: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          duration?: number | null
          id?: string
          is_preview?: boolean | null
          music_source?: string | null
          song_name: string
          streaming_link: string
          updated_at?: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          duration?: number | null
          id?: string
          is_preview?: boolean | null
          music_source?: string | null
          song_name?: string
          streaming_link?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "songs_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_holds: {
        Row: {
          created_at: string
          expires_at: string
          fingerprint: string
          id: string
          quantity: number
          ticket_tier_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          fingerprint: string
          id?: string
          quantity: number
          ticket_tier_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          fingerprint?: string
          id?: string
          quantity?: number
          ticket_tier_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_holds_ticket_tier_id_fkey"
            columns: ["ticket_tier_id"]
            isOneToOne: false
            referencedRelation: "ticket_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_tiers: {
        Row: {
          available_inventory: number
          created_at: string
          description: string | null
          event_id: string
          fee_flat_cents: number
          fee_pct_bps: number
          hide_until_previous_sold_out: boolean
          id: string
          is_active: boolean
          name: string
          price_cents: number
          reserved_inventory: number
          sold_inventory: number
          tier_order: number
          total_tickets: number
          updated_at: string
        }
        Insert: {
          available_inventory?: number
          created_at?: string
          description?: string | null
          event_id: string
          fee_flat_cents?: number
          fee_pct_bps?: number
          hide_until_previous_sold_out?: boolean
          id?: string
          is_active?: boolean
          name: string
          price_cents: number
          reserved_inventory?: number
          sold_inventory?: number
          tier_order: number
          total_tickets: number
          updated_at?: string
        }
        Update: {
          available_inventory?: number
          created_at?: string
          description?: string | null
          event_id?: string
          fee_flat_cents?: number
          fee_pct_bps?: number
          hide_until_previous_sold_out?: boolean
          id?: string
          is_active?: boolean
          name?: string
          price_cents?: number
          reserved_inventory?: number
          sold_inventory?: number
          tier_order?: number
          total_tickets?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_tiers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      ticketing_fees: {
        Row: {
          created_at: string
          fee_name: string
          fee_type: string
          fee_value: number
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          fee_name: string
          fee_type: string
          fee_value: number
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          fee_name?: string
          fee_type?: string
          fee_value?: number
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      tickets: {
        Row: {
          apple_wallet_url: string | null
          attendee_email: string | null
          attendee_name: string | null
          checked_in_at: string | null
          checked_in_by: string | null
          created_at: string
          event_id: string
          google_wallet_url: string | null
          id: string
          order_id: string
          order_item_id: string
          qr_code_data: string
          status: string
          ticket_tier_id: string
          updated_at: string
        }
        Insert: {
          apple_wallet_url?: string | null
          attendee_email?: string | null
          attendee_name?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string
          event_id: string
          google_wallet_url?: string | null
          id?: string
          order_id: string
          order_item_id: string
          qr_code_data: string
          status?: string
          ticket_tier_id: string
          updated_at?: string
        }
        Update: {
          apple_wallet_url?: string | null
          attendee_email?: string | null
          attendee_name?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string
          event_id?: string
          google_wallet_url?: string | null
          id?: string
          order_id?: string
          order_item_id?: string
          qr_code_data?: string
          status?: string
          ticket_tier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_ticket_tier_id_fkey"
            columns: ["ticket_tier_id"]
            isOneToOne: false
            referencedRelation: "ticket_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      venues: {
        Row: {
          address: string | null
          capacity: number | null
          city: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          capacity?: number | null
          city?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          capacity?: number | null
          city?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          event_id: string
          event_type: string
          id: string
          payload: Json
          processed_at: string
        }
        Insert: {
          event_id: string
          event_type: string
          id?: string
          payload: Json
          processed_at?: string
        }
        Update: {
          event_id?: string
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      convert_hold_to_sale: { Args: { p_hold_id: string }; Returns: boolean }
      create_ticket_hold: {
        Args: {
          p_fingerprint: string
          p_hold_duration_seconds?: number
          p_quantity: number
          p_ticket_tier_id: string
          p_user_id: string
        }
        Returns: {
          expires_at: string
          hold_id: string
        }[]
      }
      decrypt_token: {
        Args: { encrypted_token: string; user_salt: string }
        Returns: string
      }
      encrypt_token: {
        Args: { token_value: string; user_salt: string }
        Returns: string
      }
      get_location_preview: {
        Args: { p_location_id: string }
        Returns: {
          id: string
          is_active: boolean
          location_description: string
          location_name: string
          reward_type: string
          tokens_remaining: number
          total_tokens: number
        }[]
      }
      get_location_with_promo: {
        Args: { p_location_id: string }
        Returns: {
          id: string
          is_active: boolean
          location_description: string
          location_name: string
          promo_code: string
          reward_type: string
          tokens_remaining: number
          total_tokens: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      release_ticket_hold: { Args: { p_hold_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user" | "developer"
      reward_type: "free_ticket" | "promo_code_20"
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
      app_role: ["admin", "user", "developer"],
      reward_type: ["free_ticket", "promo_code_20"],
    },
  },
} as const
