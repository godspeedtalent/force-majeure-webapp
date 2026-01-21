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
      activity_logs: {
        Row: {
          category: Database["public"]["Enums"]["activity_category"]
          created_at: string
          description: string
          event_type: Database["public"]["Enums"]["activity_event_type"]
          id: string
          ip_address: unknown
          metadata: Json | null
          target_resource_id: string | null
          target_resource_name: string | null
          target_resource_type: string | null
          timestamp: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["activity_category"]
          created_at?: string
          description: string
          event_type: Database["public"]["Enums"]["activity_event_type"]
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          target_resource_id?: string | null
          target_resource_name?: string | null
          target_resource_type?: string | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["activity_category"]
          created_at?: string
          description?: string
          event_type?: Database["public"]["Enums"]["activity_event_type"]
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          target_resource_id?: string | null
          target_resource_name?: string | null
          target_resource_type?: string | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_guest_list_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_logs_archive: {
        Row: {
          archived_at: string
          category: Database["public"]["Enums"]["activity_category"]
          created_at: string
          description: string
          event_type: Database["public"]["Enums"]["activity_event_type"]
          id: string
          ip_address: unknown
          metadata: Json | null
          target_resource_id: string | null
          target_resource_name: string | null
          target_resource_type: string | null
          timestamp: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          archived_at?: string
          category: Database["public"]["Enums"]["activity_category"]
          created_at: string
          description: string
          event_type: Database["public"]["Enums"]["activity_event_type"]
          id: string
          ip_address?: unknown
          metadata?: Json | null
          target_resource_id?: string | null
          target_resource_name?: string | null
          target_resource_type?: string | null
          timestamp: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          archived_at?: string
          category?: Database["public"]["Enums"]["activity_category"]
          created_at?: string
          description?: string
          event_type?: Database["public"]["Enums"]["activity_event_type"]
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          target_resource_id?: string | null
          target_resource_name?: string | null
          target_resource_type?: string | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      addresses: {
        Row: {
          address_type: Database["public"]["Enums"]["address_type"]
          city: string | null
          country: string | null
          created_at: string
          guest_id: string | null
          id: string
          is_default: boolean | null
          label: string | null
          line_1: string | null
          line_2: string | null
          organization_id: string | null
          profile_id: string | null
          state: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address_type?: Database["public"]["Enums"]["address_type"]
          city?: string | null
          country?: string | null
          created_at?: string
          guest_id?: string | null
          id?: string
          is_default?: boolean | null
          label?: string | null
          line_1?: string | null
          line_2?: string | null
          organization_id?: string | null
          profile_id?: string | null
          state?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address_type?: Database["public"]["Enums"]["address_type"]
          city?: string | null
          country?: string | null
          created_at?: string
          guest_id?: string | null
          id?: string
          is_default?: boolean | null
          label?: string | null
          line_1?: string | null
          line_2?: string | null
          organization_id?: string | null
          profile_id?: string | null
          state?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "addresses_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "addresses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "addresses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "addresses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_guest_list_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_funnel_events: {
        Row: {
          cart_id: string | null
          created_at: string
          event_id: string
          event_type: Database["public"]["Enums"]["funnel_event_type"]
          id: string
          metadata: Json | null
          occurred_at: string
          order_id: string | null
          quantity: number | null
          session_id: string
          ticket_tier_id: string | null
          time_since_event_view_ms: number | null
          time_since_session_start_ms: number | null
          user_id: string | null
          value_cents: number | null
        }
        Insert: {
          cart_id?: string | null
          created_at?: string
          event_id: string
          event_type: Database["public"]["Enums"]["funnel_event_type"]
          id?: string
          metadata?: Json | null
          occurred_at?: string
          order_id?: string | null
          quantity?: number | null
          session_id: string
          ticket_tier_id?: string | null
          time_since_event_view_ms?: number | null
          time_since_session_start_ms?: number | null
          user_id?: string | null
          value_cents?: number | null
        }
        Update: {
          cart_id?: string | null
          created_at?: string
          event_id?: string
          event_type?: Database["public"]["Enums"]["funnel_event_type"]
          id?: string
          metadata?: Json | null
          occurred_at?: string
          order_id?: string | null
          quantity?: number | null
          session_id?: string
          ticket_tier_id?: string | null
          time_since_event_view_ms?: number | null
          time_since_session_start_ms?: number | null
          user_id?: string | null
          value_cents?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_funnel_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_funnel_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_funnel_events_ticket_tier_id_fkey"
            columns: ["ticket_tier_id"]
            isOneToOne: false
            referencedRelation: "ticket_tiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_funnel_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_funnel_events_archive: {
        Row: {
          archived_at: string
          cart_id: string | null
          created_at: string
          event_id: string
          event_type: Database["public"]["Enums"]["funnel_event_type"]
          id: string
          metadata: Json | null
          occurred_at: string
          order_id: string | null
          quantity: number | null
          session_id: string
          ticket_tier_id: string | null
          time_since_event_view_ms: number | null
          time_since_session_start_ms: number | null
          user_id: string | null
          value_cents: number | null
        }
        Insert: {
          archived_at?: string
          cart_id?: string | null
          created_at?: string
          event_id: string
          event_type: Database["public"]["Enums"]["funnel_event_type"]
          id?: string
          metadata?: Json | null
          occurred_at?: string
          order_id?: string | null
          quantity?: number | null
          session_id: string
          ticket_tier_id?: string | null
          time_since_event_view_ms?: number | null
          time_since_session_start_ms?: number | null
          user_id?: string | null
          value_cents?: number | null
        }
        Update: {
          archived_at?: string
          cart_id?: string | null
          created_at?: string
          event_id?: string
          event_type?: Database["public"]["Enums"]["funnel_event_type"]
          id?: string
          metadata?: Json | null
          occurred_at?: string
          order_id?: string | null
          quantity?: number | null
          session_id?: string
          ticket_tier_id?: string | null
          time_since_event_view_ms?: number | null
          time_since_session_start_ms?: number | null
          user_id?: string | null
          value_cents?: number | null
        }
        Relationships: []
      }
      analytics_page_views: {
        Row: {
          created_at: string
          id: string
          page_path: string
          page_title: string | null
          page_type: string | null
          referrer_page: string | null
          resource_id: string | null
          scroll_depth_percent: number | null
          session_id: string
          session_ref: string | null
          source: Database["public"]["Enums"]["analytics_page_source"]
          time_on_page_ms: number | null
          user_agent: string | null
          user_id: string | null
          viewed_at: string
          viewport_height: number | null
          viewport_width: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          page_path: string
          page_title?: string | null
          page_type?: string | null
          referrer_page?: string | null
          resource_id?: string | null
          scroll_depth_percent?: number | null
          session_id: string
          session_ref?: string | null
          source?: Database["public"]["Enums"]["analytics_page_source"]
          time_on_page_ms?: number | null
          user_agent?: string | null
          user_id?: string | null
          viewed_at?: string
          viewport_height?: number | null
          viewport_width?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          page_path?: string
          page_title?: string | null
          page_type?: string | null
          referrer_page?: string | null
          resource_id?: string | null
          scroll_depth_percent?: number | null
          session_id?: string
          session_ref?: string | null
          source?: Database["public"]["Enums"]["analytics_page_source"]
          time_on_page_ms?: number | null
          user_agent?: string | null
          user_id?: string | null
          viewed_at?: string
          viewport_height?: number | null
          viewport_width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_page_views_session_ref_fkey"
            columns: ["session_ref"]
            isOneToOne: false
            referencedRelation: "analytics_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_page_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_page_views_archive: {
        Row: {
          archived_at: string
          created_at: string
          id: string
          page_path: string
          page_title: string | null
          page_type: string | null
          referrer_page: string | null
          resource_id: string | null
          scroll_depth_percent: number | null
          session_id: string
          session_ref: string | null
          source: Database["public"]["Enums"]["analytics_page_source"]
          time_on_page_ms: number | null
          user_agent: string | null
          user_id: string | null
          viewed_at: string
          viewport_height: number | null
          viewport_width: number | null
        }
        Insert: {
          archived_at?: string
          created_at?: string
          id?: string
          page_path: string
          page_title?: string | null
          page_type?: string | null
          referrer_page?: string | null
          resource_id?: string | null
          scroll_depth_percent?: number | null
          session_id: string
          session_ref?: string | null
          source?: Database["public"]["Enums"]["analytics_page_source"]
          time_on_page_ms?: number | null
          user_agent?: string | null
          user_id?: string | null
          viewed_at?: string
          viewport_height?: number | null
          viewport_width?: number | null
        }
        Update: {
          archived_at?: string
          created_at?: string
          id?: string
          page_path?: string
          page_title?: string | null
          page_type?: string | null
          referrer_page?: string | null
          resource_id?: string | null
          scroll_depth_percent?: number | null
          session_id?: string
          session_ref?: string | null
          source?: Database["public"]["Enums"]["analytics_page_source"]
          time_on_page_ms?: number | null
          user_agent?: string | null
          user_id?: string | null
          viewed_at?: string
          viewport_height?: number | null
          viewport_width?: number | null
        }
        Relationships: []
      }
      analytics_performance: {
        Row: {
          created_at: string
          endpoint: string | null
          id: string
          metadata: Json | null
          metric_rating: string | null
          metric_type: Database["public"]["Enums"]["performance_metric_type"]
          metric_value: number
          page_path: string
          recorded_at: string
          session_id: string
        }
        Insert: {
          created_at?: string
          endpoint?: string | null
          id?: string
          metadata?: Json | null
          metric_rating?: string | null
          metric_type: Database["public"]["Enums"]["performance_metric_type"]
          metric_value: number
          page_path: string
          recorded_at?: string
          session_id: string
        }
        Update: {
          created_at?: string
          endpoint?: string | null
          id?: string
          metadata?: Json | null
          metric_rating?: string | null
          metric_type?: Database["public"]["Enums"]["performance_metric_type"]
          metric_value?: number
          page_path?: string
          recorded_at?: string
          session_id?: string
        }
        Relationships: []
      }
      analytics_sessions: {
        Row: {
          browser: string | null
          created_at: string
          device_type: string | null
          ended_at: string | null
          entry_page: string | null
          exit_page: string | null
          id: string
          ip_address: unknown
          os: string | null
          page_count: number | null
          referrer: string | null
          screen_height: number | null
          screen_width: number | null
          session_id: string
          started_at: string
          total_duration_ms: number | null
          user_agent: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          browser?: string | null
          created_at?: string
          device_type?: string | null
          ended_at?: string | null
          entry_page?: string | null
          exit_page?: string | null
          id?: string
          ip_address?: unknown
          os?: string | null
          page_count?: number | null
          referrer?: string | null
          screen_height?: number | null
          screen_width?: number | null
          session_id: string
          started_at?: string
          total_duration_ms?: number | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          browser?: string | null
          created_at?: string
          device_type?: string | null
          ended_at?: string | null
          entry_page?: string | null
          exit_page?: string | null
          id?: string
          ip_address?: unknown
          os?: string | null
          page_count?: number | null
          referrer?: string | null
          screen_height?: number | null
          screen_width?: number | null
          session_id?: string
          started_at?: string
          total_duration_ms?: number | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_sessions_archive: {
        Row: {
          archived_at: string
          browser: string | null
          created_at: string
          device_type: string | null
          ended_at: string | null
          entry_page: string | null
          exit_page: string | null
          id: string
          ip_address: unknown
          os: string | null
          page_count: number | null
          referrer: string | null
          screen_height: number | null
          screen_width: number | null
          session_id: string
          started_at: string
          total_duration_ms: number | null
          user_agent: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          archived_at?: string
          browser?: string | null
          created_at?: string
          device_type?: string | null
          ended_at?: string | null
          entry_page?: string | null
          exit_page?: string | null
          id?: string
          ip_address?: unknown
          os?: string | null
          page_count?: number | null
          referrer?: string | null
          screen_height?: number | null
          screen_width?: number | null
          session_id: string
          started_at?: string
          total_duration_ms?: number | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          archived_at?: string
          browser?: string | null
          created_at?: string
          device_type?: string | null
          ended_at?: string | null
          entry_page?: string | null
          exit_page?: string | null
          id?: string
          ip_address?: unknown
          os?: string | null
          page_count?: number | null
          referrer?: string | null
          screen_height?: number | null
          screen_width?: number | null
          session_id?: string
          started_at?: string
          total_duration_ms?: number | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          created_at: string
          description: string | null
          environment_id: string
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          environment_id: string
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          environment_id?: string
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_settings_environment_id_fkey"
            columns: ["environment_id"]
            isOneToOne: false
            referencedRelation: "environments"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_genres: {
        Row: {
          artist_id: string
          created_at: string | null
          genre_id: string
          id: string
          is_primary: boolean | null
        }
        Insert: {
          artist_id: string
          created_at?: string | null
          genre_id: string
          id?: string
          is_primary?: boolean | null
        }
        Update: {
          artist_id?: string
          created_at?: string | null
          genre_id?: string
          id?: string
          is_primary?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "artist_genres_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_genres_genre_id_fkey"
            columns: ["genre_id"]
            isOneToOne: false
            referencedRelation: "genres"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_recordings: {
        Row: {
          artist_id: string
          cover_art: string | null
          created_at: string | null
          duration: string | null
          id: string
          is_primary_dj_set: boolean
          name: string
          platform: string
          updated_at: string | null
          url: string
        }
        Insert: {
          artist_id: string
          cover_art?: string | null
          created_at?: string | null
          duration?: string | null
          id?: string
          is_primary_dj_set?: boolean
          name: string
          platform: string
          updated_at?: string | null
          url: string
        }
        Update: {
          artist_id?: string
          cover_art?: string | null
          created_at?: string | null
          duration?: string | null
          id?: string
          is_primary_dj_set?: boolean
          name?: string
          platform?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "artist_recordings_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_registrations: {
        Row: {
          artist_name: string
          availability: string | null
          bio: string
          city: string | null
          city_id: string | null
          created_at: string
          crowd_sources: string | null
          email: string | null
          equipment: string | null
          facebook_url: string | null
          genre: string | null
          genres: string[] | null
          id: string
          instagram_handle: string | null
          link_personal_profile: boolean | null
          notifications_opt_in: boolean | null
          paid_show_count_group: string | null
          phone: string | null
          press_images: string[] | null
          previous_venues: string | null
          profile_image_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          set_length: string | null
          soundcloud_id: string | null
          soundcloud_set_url: string | null
          soundcloud_url: string | null
          spotify_id: string | null
          spotify_track_url: string | null
          spotify_url: string | null
          state: string | null
          status: string
          submitted_at: string
          talent_differentiator: string | null
          tiktok_handle: string | null
          tracks_metadata: Json | null
          twitter_handle: string | null
          updated_at: string
          user_id: string | null
          youtube_url: string | null
        }
        Insert: {
          artist_name: string
          availability?: string | null
          bio: string
          city?: string | null
          city_id?: string | null
          created_at?: string
          crowd_sources?: string | null
          email?: string | null
          equipment?: string | null
          facebook_url?: string | null
          genre?: string | null
          genres?: string[] | null
          id?: string
          instagram_handle?: string | null
          link_personal_profile?: boolean | null
          notifications_opt_in?: boolean | null
          paid_show_count_group?: string | null
          phone?: string | null
          press_images?: string[] | null
          previous_venues?: string | null
          profile_image_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          set_length?: string | null
          soundcloud_id?: string | null
          soundcloud_set_url?: string | null
          soundcloud_url?: string | null
          spotify_id?: string | null
          spotify_track_url?: string | null
          spotify_url?: string | null
          state?: string | null
          status?: string
          submitted_at?: string
          talent_differentiator?: string | null
          tiktok_handle?: string | null
          tracks_metadata?: Json | null
          twitter_handle?: string | null
          updated_at?: string
          user_id?: string | null
          youtube_url?: string | null
        }
        Update: {
          artist_name?: string
          availability?: string | null
          bio?: string
          city?: string | null
          city_id?: string | null
          created_at?: string
          crowd_sources?: string | null
          email?: string | null
          equipment?: string | null
          facebook_url?: string | null
          genre?: string | null
          genres?: string[] | null
          id?: string
          instagram_handle?: string | null
          link_personal_profile?: boolean | null
          notifications_opt_in?: boolean | null
          paid_show_count_group?: string | null
          phone?: string | null
          press_images?: string[] | null
          previous_venues?: string | null
          profile_image_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          set_length?: string | null
          soundcloud_id?: string | null
          soundcloud_set_url?: string | null
          soundcloud_url?: string | null
          spotify_id?: string | null
          spotify_track_url?: string | null
          spotify_url?: string | null
          state?: string | null
          status?: string
          submitted_at?: string
          talent_differentiator?: string | null
          tiktok_handle?: string | null
          tracks_metadata?: Json | null
          twitter_handle?: string | null
          updated_at?: string
          user_id?: string | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artist_registrations_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_registrations_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      artists: {
        Row: {
          bio: string | null
          city_id: string | null
          created_at: string | null
          facebook_url: string | null
          gallery_id: string | null
          genre: string | null
          id: string
          image_url: string | null
          instagram_handle: string | null
          name: string
          soundcloud_id: string | null
          spotify_data: Json | null
          spotify_id: string | null
          test_data: boolean
          tiktok_handle: string | null
          twitter_handle: string | null
          updated_at: string | null
          user_id: string | null
          website: string | null
          youtube_url: string | null
        }
        Insert: {
          bio?: string | null
          city_id?: string | null
          created_at?: string | null
          facebook_url?: string | null
          gallery_id?: string | null
          genre?: string | null
          id?: string
          image_url?: string | null
          instagram_handle?: string | null
          name: string
          soundcloud_id?: string | null
          spotify_data?: Json | null
          spotify_id?: string | null
          test_data?: boolean
          tiktok_handle?: string | null
          twitter_handle?: string | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
          youtube_url?: string | null
        }
        Update: {
          bio?: string | null
          city_id?: string | null
          created_at?: string | null
          facebook_url?: string | null
          gallery_id?: string | null
          genre?: string | null
          id?: string
          image_url?: string | null
          instagram_handle?: string | null
          name?: string
          soundcloud_id?: string | null
          spotify_data?: Json | null
          spotify_id?: string | null
          test_data?: boolean
          tiktok_handle?: string | null
          twitter_handle?: string | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artists_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artists_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "media_galleries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      chart_labels: {
        Row: {
          chart_id: string
          created_at: string
          created_by: string
          id: string
          label: string
          marker_color: string | null
          metadata: Json | null
          point_id: string
          updated_at: string
        }
        Insert: {
          chart_id: string
          created_at?: string
          created_by: string
          id?: string
          label: string
          marker_color?: string | null
          metadata?: Json | null
          point_id: string
          updated_at?: string
        }
        Update: {
          chart_id?: string
          created_at?: string
          created_by?: string
          id?: string
          label?: string
          marker_color?: string | null
          metadata?: Json | null
          point_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chart_labels_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          created_at: string
          id: string
          name: string
          state: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          state: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          state?: string
          updated_at?: string
        }
        Relationships: []
      }
      column_customizations: {
        Row: {
          column_key: string
          created_at: string | null
          created_by: string | null
          custom_label: string | null
          custom_type: string | null
          custom_width: string | null
          display_order: number | null
          id: string
          is_editable: boolean | null
          is_filterable: boolean | null
          is_sortable: boolean | null
          is_visible_by_default: boolean | null
          render_config: Json | null
          table_name: string
          updated_at: string | null
        }
        Insert: {
          column_key: string
          created_at?: string | null
          created_by?: string | null
          custom_label?: string | null
          custom_type?: string | null
          custom_width?: string | null
          display_order?: number | null
          id?: string
          is_editable?: boolean | null
          is_filterable?: boolean | null
          is_sortable?: boolean | null
          is_visible_by_default?: boolean | null
          render_config?: Json | null
          table_name: string
          updated_at?: string | null
        }
        Update: {
          column_key?: string
          created_at?: string | null
          created_by?: string | null
          custom_label?: string | null
          custom_type?: string | null
          custom_width?: string | null
          display_order?: number | null
          id?: string
          is_editable?: boolean | null
          is_filterable?: boolean | null
          is_sortable?: boolean | null
          is_visible_by_default?: boolean | null
          render_config?: Json | null
          table_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "column_customizations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      comp_tickets: {
        Row: {
          claim_token: string | null
          claimed_at: string | null
          claimed_by_user_id: string | null
          created_at: string
          event_id: string
          expires_at: string | null
          id: string
          issued_at: string
          issued_by_user_id: string
          order_id: string | null
          recipient_email: string
          recipient_user_id: string | null
          status: string
          ticket_id: string | null
          ticket_tier_id: string
          updated_at: string
        }
        Insert: {
          claim_token?: string | null
          claimed_at?: string | null
          claimed_by_user_id?: string | null
          created_at?: string
          event_id: string
          expires_at?: string | null
          id?: string
          issued_at?: string
          issued_by_user_id: string
          order_id?: string | null
          recipient_email: string
          recipient_user_id?: string | null
          status?: string
          ticket_id?: string | null
          ticket_tier_id: string
          updated_at?: string
        }
        Update: {
          claim_token?: string | null
          claimed_at?: string | null
          claimed_by_user_id?: string | null
          created_at?: string
          event_id?: string
          expires_at?: string | null
          id?: string
          issued_at?: string
          issued_by_user_id?: string
          order_id?: string | null
          recipient_email?: string
          recipient_user_id?: string | null
          status?: string
          ticket_id?: string | null
          ticket_tier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comp_tickets_claimed_by_user_id_fkey"
            columns: ["claimed_by_user_id"]
            isOneToOne: false
            referencedRelation: "users_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comp_tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comp_tickets_issued_by_user_id_fkey"
            columns: ["issued_by_user_id"]
            isOneToOne: false
            referencedRelation: "users_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comp_tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comp_tickets_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "users_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comp_tickets_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comp_tickets_ticket_tier_id_fkey"
            columns: ["ticket_tier_id"]
            isOneToOne: false
            referencedRelation: "ticket_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
          notes: string | null
          replied_at: string | null
          replied_by: string | null
          status: string
          subject: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
          notes?: string | null
          replied_at?: string | null
          replied_by?: string | null
          status?: string
          subject?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          notes?: string | null
          replied_at?: string | null
          replied_by?: string | null
          status?: string
          subject?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_submissions_replied_by_fkey"
            columns: ["replied_by"]
            isOneToOne: false
            referencedRelation: "users_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      datagrid_configs: {
        Row: {
          config: Json
          created_at: string | null
          grid_id: string
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          config?: Json
          created_at?: string | null
          grid_id: string
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          config?: Json
          created_at?: string | null
          grid_id?: string
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "datagrid_configs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      dev_bookmarks: {
        Row: {
          created_at: string | null
          icon: string | null
          icon_color: string | null
          id: string
          label: string
          path: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          icon_color?: string | null
          id?: string
          label: string
          path: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          icon_color?: string | null
          id?: string
          label?: string
          path?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dev_bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      dev_notes: {
        Row: {
          author_id: string
          author_name: string
          content: Json | null
          created_at: string | null
          id: string
          message: string
          priority: number
          status: string
          title: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          author_name: string
          content?: Json | null
          created_at?: string | null
          id?: string
          message: string
          priority?: number
          status?: string
          title?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          author_name?: string
          content?: Json | null
          created_at?: string | null
          id?: string
          message?: string
          priority?: number
          status?: string
          title?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dev_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_fee_items: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          fee_type: string
          fee_value: number
          id: string
          is_active: boolean
          label: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          fee_type: string
          fee_value: number
          id?: string
          is_active?: boolean
          label: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          fee_type?: string
          fee_value?: number
          id?: string
          is_active?: boolean
          label?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      environments: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          app_version: string | null
          created_at: string
          details: Json | null
          endpoint: string | null
          environment: string | null
          error_code: string | null
          id: string
          ip_address: unknown
          level: Database["public"]["Enums"]["error_log_level"]
          message: string
          metadata: Json | null
          method: string | null
          page_url: string | null
          request_id: string | null
          session_id: string | null
          source: Database["public"]["Enums"]["error_log_source"]
          stack_trace: string | null
          status_code: number | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          app_version?: string | null
          created_at?: string
          details?: Json | null
          endpoint?: string | null
          environment?: string | null
          error_code?: string | null
          id?: string
          ip_address?: unknown
          level?: Database["public"]["Enums"]["error_log_level"]
          message: string
          metadata?: Json | null
          method?: string | null
          page_url?: string | null
          request_id?: string | null
          session_id?: string | null
          source?: Database["public"]["Enums"]["error_log_source"]
          stack_trace?: string | null
          status_code?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          app_version?: string | null
          created_at?: string
          details?: Json | null
          endpoint?: string | null
          environment?: string | null
          error_code?: string | null
          id?: string
          ip_address?: unknown
          level?: Database["public"]["Enums"]["error_log_level"]
          message?: string
          metadata?: Json | null
          method?: string | null
          page_url?: string | null
          request_id?: string | null
          session_id?: string | null
          source?: Database["public"]["Enums"]["error_log_source"]
          stack_trace?: string | null
          status_code?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "error_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs_archive: {
        Row: {
          app_version: string | null
          archived_at: string
          created_at: string
          details: Json | null
          endpoint: string | null
          environment: string | null
          error_code: string | null
          id: string
          ip_address: unknown
          level: Database["public"]["Enums"]["error_log_level"]
          message: string
          metadata: Json | null
          method: string | null
          page_url: string | null
          request_id: string | null
          session_id: string | null
          source: Database["public"]["Enums"]["error_log_source"]
          stack_trace: string | null
          status_code: number | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          app_version?: string | null
          archived_at?: string
          created_at?: string
          details?: Json | null
          endpoint?: string | null
          environment?: string | null
          error_code?: string | null
          id?: string
          ip_address?: unknown
          level?: Database["public"]["Enums"]["error_log_level"]
          message: string
          metadata?: Json | null
          method?: string | null
          page_url?: string | null
          request_id?: string | null
          session_id?: string | null
          source?: Database["public"]["Enums"]["error_log_source"]
          stack_trace?: string | null
          status_code?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          app_version?: string | null
          archived_at?: string
          created_at?: string
          details?: Json | null
          endpoint?: string | null
          environment?: string | null
          error_code?: string | null
          id?: string
          ip_address?: unknown
          level?: Database["public"]["Enums"]["error_log_level"]
          message?: string
          metadata?: Json | null
          method?: string | null
          page_url?: string | null
          request_id?: string | null
          session_id?: string | null
          source?: Database["public"]["Enums"]["error_log_source"]
          stack_trace?: string | null
          status_code?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      event_artists: {
        Row: {
          artist_id: string
          created_at: string | null
          event_id: string
          id: string
          set_order: number | null
          set_time: string | null
        }
        Insert: {
          artist_id: string
          created_at?: string | null
          event_id: string
          id?: string
          set_order?: number | null
          set_time?: string | null
        }
        Update: {
          artist_id?: string
          created_at?: string | null
          event_id?: string
          id?: string
          set_order?: number | null
          set_time?: string | null
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
      event_images: {
        Row: {
          created_at: string | null
          event_id: string | null
          file_name: string
          file_size: number
          height: number | null
          id: string
          is_primary: boolean | null
          mime_type: string
          storage_path: string
          updated_at: string | null
          uploaded_by: string | null
          width: number | null
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          file_name: string
          file_size: number
          height?: number | null
          id?: string
          is_primary?: boolean | null
          mime_type: string
          storage_path: string
          updated_at?: string | null
          uploaded_by?: string | null
          width?: number | null
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          file_name?: string
          file_size?: number
          height?: number | null
          id?: string
          is_primary?: boolean | null
          mime_type?: string
          storage_path?: string
          updated_at?: string | null
          uploaded_by?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_images_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_images_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      event_partners: {
        Row: {
          created_at: string | null
          display_order: number | null
          event_id: string
          id: string
          importance: number
          is_hidden: boolean
          organization_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          event_id: string
          id?: string
          importance?: number
          is_hidden?: boolean
          organization_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          event_id?: string
          id?: string
          importance?: number
          is_hidden?: boolean
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_partners_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_partners_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_promo_codes: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          promo_code_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          promo_code_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          promo_code_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_promo_codes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_promo_codes_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      event_rsvps: {
        Row: {
          checked_in_at: string | null
          checked_in_by: string | null
          created_at: string
          event_id: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string
          event_id: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string
          event_id?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_rsvps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_rsvps_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_rsvps_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_guest_list_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_staff: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          organization_id: string | null
          role: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          organization_id?: string | null
          role: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          organization_id?: string | null
          role?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_staff_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_staff_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_staff_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      event_views: {
        Row: {
          created_at: string
          event_id: string
          id: string
          ip_address: unknown
          session_id: string | null
          user_agent: string | null
          viewed_at: string
          viewer_id: string | null
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          ip_address?: unknown
          session_id?: string | null
          user_agent?: string | null
          viewed_at?: string
          viewer_id?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          ip_address?: unknown
          session_id?: string | null
          user_agent?: string | null
          viewed_at?: string
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_views_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "users_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          about_event: string | null
          created_at: string | null
          description: string | null
          display_subtitle: boolean
          end_time: string | null
          fee_flat_cents: number
          fee_pct_bps: number
          gallery_id: string | null
          headliner_id: string | null
          hero_image: string | null
          hero_image_focal_x: number | null
          hero_image_focal_y: number | null
          id: string
          is_after_hours: boolean
          is_free_event: boolean
          is_rsvp_only_event: boolean | null
          is_tba: boolean | null
          looking_for_undercard: boolean
          min_interest_count_display: number
          min_share_count_display: number
          mobile_full_hero_height: boolean
          no_headliner: boolean | null
          organization_id: string | null
          rsvp_button_subtitle: string | null
          rsvp_capacity: number | null
          send_rsvp_email: boolean
          share_count: number
          show_guest_list: boolean
          show_partners: boolean
          show_venue_map: boolean
          show_view_count: boolean | null
          start_time: string | null
          status: string
          subtitle: string | null
          test_data: boolean
          title: string
          updated_at: string | null
          use_default_fees: boolean
          venue_id: string | null
          view_count: number
        }
        Insert: {
          about_event?: string | null
          created_at?: string | null
          description?: string | null
          display_subtitle?: boolean
          end_time?: string | null
          fee_flat_cents?: number
          fee_pct_bps?: number
          gallery_id?: string | null
          headliner_id?: string | null
          hero_image?: string | null
          hero_image_focal_x?: number | null
          hero_image_focal_y?: number | null
          id?: string
          is_after_hours?: boolean
          is_free_event?: boolean
          is_rsvp_only_event?: boolean | null
          is_tba?: boolean | null
          looking_for_undercard?: boolean
          min_interest_count_display?: number
          min_share_count_display?: number
          mobile_full_hero_height?: boolean
          no_headliner?: boolean | null
          organization_id?: string | null
          rsvp_button_subtitle?: string | null
          rsvp_capacity?: number | null
          send_rsvp_email?: boolean
          share_count?: number
          show_guest_list?: boolean
          show_partners?: boolean
          show_venue_map?: boolean
          show_view_count?: boolean | null
          start_time?: string | null
          status?: string
          subtitle?: string | null
          test_data?: boolean
          title: string
          updated_at?: string | null
          use_default_fees?: boolean
          venue_id?: string | null
          view_count?: number
        }
        Update: {
          about_event?: string | null
          created_at?: string | null
          description?: string | null
          display_subtitle?: boolean
          end_time?: string | null
          fee_flat_cents?: number
          fee_pct_bps?: number
          gallery_id?: string | null
          headliner_id?: string | null
          hero_image?: string | null
          hero_image_focal_x?: number | null
          hero_image_focal_y?: number | null
          id?: string
          is_after_hours?: boolean
          is_free_event?: boolean
          is_rsvp_only_event?: boolean | null
          is_tba?: boolean | null
          looking_for_undercard?: boolean
          min_interest_count_display?: number
          min_share_count_display?: number
          mobile_full_hero_height?: boolean
          no_headliner?: boolean | null
          organization_id?: string | null
          rsvp_button_subtitle?: string | null
          rsvp_capacity?: number | null
          send_rsvp_email?: boolean
          share_count?: number
          show_guest_list?: boolean
          show_partners?: boolean
          show_venue_map?: boolean
          show_view_count?: boolean | null
          start_time?: string | null
          status?: string
          subtitle?: string | null
          test_data?: boolean
          title?: string
          updated_at?: string | null
          use_default_fees?: boolean
          venue_id?: string | null
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "events_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "media_galleries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_headliner_id_fkey"
            columns: ["headliner_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_venue_id_fkey"
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
          {
            foreignKeyName: "exclusive_content_grants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          created_at: string | null
          description: string | null
          environment_id: string
          flag_name: string
          group_name: string | null
          id: string
          is_archived: boolean
          is_enabled: boolean
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          environment_id: string
          flag_name: string
          group_name?: string | null
          id?: string
          is_archived?: boolean
          is_enabled?: boolean
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          environment_id?: string
          flag_name?: string
          group_name?: string | null
          id?: string
          is_archived?: boolean
          is_enabled?: boolean
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_environment_id_fkey"
            columns: ["environment_id"]
            isOneToOne: false
            referencedRelation: "environments"
            referencedColumns: ["id"]
          },
        ]
      }
      genres: {
        Row: {
          created_at: string | null
          id: string
          name: string
          parent_id: string | null
          selection_count: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          parent_id?: string | null
          selection_count?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          selection_count?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "genres_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "genres"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          invited_by: string | null
          joined_at: string | null
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "public_guest_list_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_guest_list_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string | null
          creator_id: string
          event_id: string | null
          id: string
          is_active: boolean | null
          max_members: number | null
          name: string
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          event_id?: string | null
          id?: string
          is_active?: boolean | null
          max_members?: number | null
          name: string
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          event_id?: string | null
          id?: string
          is_active?: boolean | null
          max_members?: number | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "public_guest_list_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_list_settings: {
        Row: {
          created_at: string
          event_id: string
          id: string
          is_enabled: boolean
          min_guest_threshold: number
          min_interested_guests: number
          min_private_guests: number
          min_public_guests: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          is_enabled?: boolean
          min_guest_threshold?: number
          min_interested_guests?: number
          min_private_guests?: number
          min_public_guests?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          is_enabled?: boolean
          min_guest_threshold?: number
          min_interested_guests?: number
          min_private_guests?: number
          min_public_guests?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_list_settings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          billing_address_line_1: string | null
          billing_address_line_2: string | null
          billing_city: string | null
          billing_country: string | null
          billing_state: string | null
          billing_zip_code: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          phone: string | null
          profile_id: string | null
          stripe_customer_id: string | null
          updated_at: string
        }
        Insert: {
          billing_address_line_1?: string | null
          billing_address_line_2?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_state?: string | null
          billing_zip_code?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          phone?: string | null
          profile_id?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Update: {
          billing_address_line_1?: string | null
          billing_address_line_2?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_state?: string | null
          billing_zip_code?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          profile_id?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_guest_list_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      link_clicks: {
        Row: {
          city: string | null
          clicked_at: string
          country: string | null
          device_info: Json | null
          id: string
          ip_address: unknown
          link_id: string
          referrer: string | null
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          city?: string | null
          clicked_at?: string
          country?: string | null
          device_info?: Json | null
          id?: string
          ip_address?: unknown
          link_id: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          city?: string | null
          clicked_at?: string
          country?: string | null
          device_info?: Json | null
          id?: string
          ip_address?: unknown
          link_id?: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "link_clicks_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "tracking_links"
            referencedColumns: ["id"]
          },
        ]
      }
      media_galleries: {
        Row: {
          allowed_types: Database["public"]["Enums"]["media_type"][] | null
          cover_required: boolean
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          slug: string
          updated_at: string | null
          venue_id: string | null
        }
        Insert: {
          allowed_types?: Database["public"]["Enums"]["media_type"][] | null
          cover_required?: boolean
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          slug: string
          updated_at?: string | null
          venue_id?: string | null
        }
        Update: {
          allowed_types?: Database["public"]["Enums"]["media_type"][] | null
          cover_required?: boolean
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          slug?: string
          updated_at?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_galleries_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      media_items: {
        Row: {
          alt_text: string | null
          created_at: string | null
          creator: string | null
          description: string | null
          display_order: number | null
          duration_seconds: number | null
          file_path: string
          file_size_bytes: number | null
          gallery_id: string | null
          height: number | null
          id: string
          is_active: boolean | null
          is_cover: boolean
          media_type: Database["public"]["Enums"]["media_type"]
          mime_type: string | null
          tags: string[] | null
          thumbnail_path: string | null
          title: string | null
          updated_at: string | null
          width: number | null
          year: number | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          creator?: string | null
          description?: string | null
          display_order?: number | null
          duration_seconds?: number | null
          file_path: string
          file_size_bytes?: number | null
          gallery_id?: string | null
          height?: number | null
          id?: string
          is_active?: boolean | null
          is_cover?: boolean
          media_type?: Database["public"]["Enums"]["media_type"]
          mime_type?: string | null
          tags?: string[] | null
          thumbnail_path?: string | null
          title?: string | null
          updated_at?: string | null
          width?: number | null
          year?: number | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          creator?: string | null
          description?: string | null
          display_order?: number | null
          duration_seconds?: number | null
          file_path?: string
          file_size_bytes?: number | null
          gallery_id?: string | null
          height?: number | null
          id?: string
          is_active?: boolean | null
          is_cover?: boolean
          media_type?: Database["public"]["Enums"]["media_type"]
          mime_type?: string | null
          tags?: string[] | null
          thumbnail_path?: string | null
          title?: string | null
          updated_at?: string | null
          width?: number | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_items_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "media_galleries"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          fee_breakdown: Json | null
          fees_cents: number | null
          id: string
          item_type: string
          order_id: string
          product_id: string | null
          quantity: number
          subtotal_cents: number | null
          ticket_tier_id: string | null
          total_cents: number | null
          unit_fee_cents: number
          unit_price_cents: number
        }
        Insert: {
          created_at?: string
          fee_breakdown?: Json | null
          fees_cents?: number | null
          id?: string
          item_type?: string
          order_id: string
          product_id?: string | null
          quantity: number
          subtotal_cents?: number | null
          ticket_tier_id?: string | null
          total_cents?: number | null
          unit_fee_cents?: number
          unit_price_cents: number
        }
        Update: {
          created_at?: string
          fee_breakdown?: Json | null
          fees_cents?: number | null
          id?: string
          item_type?: string
          order_id?: string
          product_id?: string | null
          quantity?: number
          subtotal_cents?: number | null
          ticket_tier_id?: string | null
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
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
          billing_address_line_1: string | null
          billing_address_line_2: string | null
          billing_city: string | null
          billing_country: string | null
          billing_state: string | null
          billing_zip_code: string | null
          created_at: string
          currency: string
          customer_email: string | null
          event_id: string
          fee_breakdown: Json | null
          fees_cents: number
          guest_id: string | null
          id: string
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          subtotal_cents: number
          test_data: boolean
          total_cents: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          billing_address_line_1?: string | null
          billing_address_line_2?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_state?: string | null
          billing_zip_code?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          event_id: string
          fee_breakdown?: Json | null
          fees_cents?: number
          guest_id?: string | null
          id?: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          subtotal_cents: number
          test_data?: boolean
          total_cents: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          billing_address_line_1?: string | null
          billing_address_line_2?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_state?: string | null
          billing_zip_code?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          event_id?: string
          fee_breakdown?: Json | null
          fees_cents?: number
          guest_id?: string | null
          id?: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          subtotal_cents?: number
          test_data?: boolean
          total_cents?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_guest_list_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_staff: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id: string
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_staff_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_staff_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          city: string | null
          country: string | null
          created_at: string | null
          id: string
          name: string
          owner_id: string
          profile_picture: string | null
          state: string | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          name: string
          owner_id: string
          profile_picture?: string | null
          state?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          name?: string
          owner_id?: string
          profile_picture?: string | null
          state?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      process_items: {
        Row: {
          created_at: string
          created_record_id: string | null
          created_record_type: string | null
          error_message: string | null
          external_id: string | null
          id: string
          input_data: Json | null
          item_index: number
          output_data: Json | null
          process_id: string
          status: string
        }
        Insert: {
          created_at?: string
          created_record_id?: string | null
          created_record_type?: string | null
          error_message?: string | null
          external_id?: string | null
          id?: string
          input_data?: Json | null
          item_index: number
          output_data?: Json | null
          process_id: string
          status?: string
        }
        Update: {
          created_at?: string
          created_record_id?: string | null
          created_record_type?: string | null
          error_message?: string | null
          external_id?: string | null
          id?: string
          input_data?: Json | null
          item_index?: number
          output_data?: Json | null
          process_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_items_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      processes: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string
          error_message: string | null
          failed_items: number | null
          id: string
          metadata: Json | null
          name: string | null
          process_type: string
          processed_items: number | null
          rollback_data: Json | null
          rolled_back_at: string | null
          rolled_back_by: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["process_status"]
          successful_items: number | null
          total_items: number | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by: string
          error_message?: string | null
          failed_items?: number | null
          id?: string
          metadata?: Json | null
          name?: string | null
          process_type: string
          processed_items?: number | null
          rollback_data?: Json | null
          rolled_back_at?: string | null
          rolled_back_by?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["process_status"]
          successful_items?: number | null
          total_items?: number | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string
          error_message?: string | null
          failed_items?: number | null
          id?: string
          metadata?: Json | null
          name?: string | null
          process_type?: string
          processed_items?: number | null
          rollback_data?: Json | null
          rolled_back_at?: string | null
          rolled_back_by?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["process_status"]
          successful_items?: number | null
          total_items?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "processes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processes_rolled_back_by_fkey"
            columns: ["rolled_back_by"]
            isOneToOne: false
            referencedRelation: "users_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          allow_backorder: boolean
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          low_stock_threshold: number | null
          metadata: Json | null
          name: string
          price_cents: number
          sku: string | null
          sort_order: number | null
          stock_quantity: number | null
          track_inventory: boolean
          type: string
          updated_at: string
        }
        Insert: {
          allow_backorder?: boolean
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          low_stock_threshold?: number | null
          metadata?: Json | null
          name: string
          price_cents: number
          sku?: string | null
          sort_order?: number | null
          stock_quantity?: number | null
          track_inventory?: boolean
          type: string
          updated_at?: string
        }
        Update: {
          allow_backorder?: boolean
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          low_stock_threshold?: number | null
          metadata?: Json | null
          name?: string
          price_cents?: number
          sku?: string | null
          sort_order?: number | null
          stock_quantity?: number | null
          track_inventory?: boolean
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age_range: string | null
          avatar_url: string | null
          billing_address_line_1: string | null
          billing_address_line_2: string | null
          billing_city: string | null
          billing_country: string | null
          billing_state: string | null
          billing_zip_code: string | null
          created_at: string
          deleted_at: string | null
          display_name: string | null
          email: string | null
          full_name: string | null
          gender: string | null
          guest_list_visible: boolean
          home_city: string | null
          id: string
          instagram_handle: string | null
          notification_settings: Json | null
          organization_id: string | null
          phone_number: string | null
          preferred_locale: string | null
          privacy_settings: Json | null
          stripe_customer_id: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          age_range?: string | null
          avatar_url?: string | null
          billing_address_line_1?: string | null
          billing_address_line_2?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_state?: string | null
          billing_zip_code?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          guest_list_visible?: boolean
          home_city?: string | null
          id: string
          instagram_handle?: string | null
          notification_settings?: Json | null
          organization_id?: string | null
          phone_number?: string | null
          preferred_locale?: string | null
          privacy_settings?: Json | null
          stripe_customer_id?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          age_range?: string | null
          avatar_url?: string | null
          billing_address_line_1?: string | null
          billing_address_line_2?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_state?: string | null
          billing_zip_code?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          guest_list_visible?: boolean
          home_city?: string | null
          id?: string
          instagram_handle?: string | null
          notification_settings?: Json | null
          organization_id?: string | null
          phone_number?: string | null
          preferred_locale?: string | null
          privacy_settings?: Json | null
          stripe_customer_id?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_code_groups: {
        Row: {
          created_at: string | null
          id: string
          promo_code_id: string
          ticket_group_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          promo_code_id: string
          ticket_group_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          promo_code_id?: string
          ticket_group_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_code_groups_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_code_groups_ticket_group_id_fkey"
            columns: ["ticket_group_id"]
            isOneToOne: false
            referencedRelation: "ticket_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_code_tiers: {
        Row: {
          created_at: string | null
          id: string
          promo_code_id: string
          ticket_tier_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          promo_code_id: string
          ticket_tier_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          promo_code_id?: string
          ticket_tier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_code_tiers_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_code_tiers_ticket_tier_id_fkey"
            columns: ["ticket_tier_id"]
            isOneToOne: false
            referencedRelation: "ticket_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          application_scope:
            | Database["public"]["Enums"]["promo_code_scope"]
            | null
          applies_to_order: boolean | null
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          application_scope?:
            | Database["public"]["Enums"]["promo_code_scope"]
            | null
          applies_to_order?: boolean | null
          code: string
          created_at?: string
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          application_scope?:
            | Database["public"]["Enums"]["promo_code_scope"]
            | null
          applies_to_order?: boolean | null
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      queue_configurations: {
        Row: {
          checkout_timeout_minutes: number
          created_at: string
          enable_queue: boolean
          event_id: string
          id: string
          max_concurrent_users: number
          session_timeout_minutes: number
          updated_at: string
        }
        Insert: {
          checkout_timeout_minutes?: number
          created_at?: string
          enable_queue?: boolean
          event_id: string
          id?: string
          max_concurrent_users?: number
          session_timeout_minutes?: number
          updated_at?: string
        }
        Update: {
          checkout_timeout_minutes?: number
          created_at?: string
          enable_queue?: boolean
          event_id?: string
          id?: string
          max_concurrent_users?: number
          session_timeout_minutes?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "queue_configurations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      rave_family: {
        Row: {
          connected_at: string | null
          connection_method: string | null
          created_at: string | null
          family_member_id: string
          id: string
          user_id: string
        }
        Insert: {
          connected_at?: string | null
          connection_method?: string | null
          created_at?: string | null
          family_member_id: string
          id?: string
          user_id: string
        }
        Update: {
          connected_at?: string | null
          connection_method?: string | null
          created_at?: string | null
          family_member_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rave_family_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rave_family_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "public_guest_list_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rave_family_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rave_family_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_guest_list_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      report_configurations: {
        Row: {
          created_at: string
          created_by: string
          event_id: string
          id: string
          is_active: boolean
          is_scheduled: boolean
          last_sent_at: string | null
          next_send_at: string | null
          report_type: string
          schedule_day_of_month: number | null
          schedule_day_of_week: number | null
          schedule_time: string
          schedule_type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          event_id: string
          id?: string
          is_active?: boolean
          is_scheduled?: boolean
          last_sent_at?: string | null
          next_send_at?: string | null
          report_type: string
          schedule_day_of_month?: number | null
          schedule_day_of_week?: number | null
          schedule_time?: string
          schedule_type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          event_id?: string
          id?: string
          is_active?: boolean
          is_scheduled?: boolean
          last_sent_at?: string | null
          next_send_at?: string | null
          report_type?: string
          schedule_day_of_month?: number | null
          schedule_day_of_week?: number | null
          schedule_time?: string
          schedule_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_configurations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      report_history: {
        Row: {
          created_at: string
          error_message: string | null
          file_url: string | null
          id: string
          recipients_count: number
          report_config_id: string
          sent_at: string
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          file_url?: string | null
          id?: string
          recipients_count?: number
          report_config_id: string
          sent_at?: string
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          file_url?: string | null
          id?: string
          recipients_count?: number
          report_config_id?: string
          sent_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_history_report_config_id_fkey"
            columns: ["report_config_id"]
            isOneToOne: false
            referencedRelation: "report_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      report_recipients: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string | null
          report_config_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          name?: string | null
          report_config_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string | null
          report_config_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_recipients_report_config_id_fkey"
            columns: ["report_config_id"]
            isOneToOne: false
            referencedRelation: "report_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          is_system_role: boolean | null
          name: string
          permissions: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          is_system_role?: boolean | null
          name: string
          permissions?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_system_role?: boolean | null
          name?: string
          permissions?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rsvp_scan_events: {
        Row: {
          created_at: string
          device_info: Json | null
          event_id: string
          id: string
          rsvp_id: string | null
          scan_location: Json | null
          scan_result: string
          scanned_by: string
        }
        Insert: {
          created_at?: string
          device_info?: Json | null
          event_id: string
          id?: string
          rsvp_id?: string | null
          scan_location?: Json | null
          scan_result: string
          scanned_by: string
        }
        Update: {
          created_at?: string
          device_info?: Json | null
          event_id?: string
          id?: string
          rsvp_id?: string | null
          scan_location?: Json | null
          scan_result?: string
          scanned_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "rsvp_scan_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rsvp_scan_events_rsvp_id_fkey"
            columns: ["rsvp_id"]
            isOneToOne: false
            referencedRelation: "event_rsvps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rsvp_scan_events_scanned_by_fkey"
            columns: ["scanned_by"]
            isOneToOne: false
            referencedRelation: "users_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      scavenger_claims: {
        Row: {
          created_at: string | null
          id: string
          location_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          location_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          location_id?: string
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
          {
            foreignKeyName: "scavenger_claims_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      scavenger_locations: {
        Row: {
          checkin_count: number
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          checkin_count?: number
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          checkin_count?: number
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      scavenger_tokens: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          location_id: string | null
          token: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location_id?: string | null
          token: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location_id?: string | null
          token?: string
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
      table_metadata: {
        Row: {
          columns: Json
          constraints: Json
          description: string | null
          display_name: string
          relations: Json
          table_name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          columns?: Json
          constraints?: Json
          description?: string | null
          display_name: string
          relations?: Json
          table_name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          columns?: Json
          constraints?: Json
          description?: string | null
          display_name?: string
          relations?: Json
          table_name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "table_metadata_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      test_event_interests: {
        Row: {
          created_at: string
          event_id: string
          id: string
          test_profile_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          test_profile_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          test_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_event_interests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_event_interests_test_profile_id_fkey"
            columns: ["test_profile_id"]
            isOneToOne: false
            referencedRelation: "test_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      test_event_rsvps: {
        Row: {
          created_at: string
          event_id: string
          id: string
          status: string
          test_profile_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          status?: string
          test_profile_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          status?: string
          test_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_event_rsvps_test_profile_id_fkey"
            columns: ["test_profile_id"]
            isOneToOne: false
            referencedRelation: "test_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      test_order_items: {
        Row: {
          created_at: string
          fees_cents: number | null
          id: string
          item_type: string
          product_id: string | null
          quantity: number
          subtotal_cents: number | null
          test_order_id: string
          ticket_tier_id: string | null
          total_cents: number | null
          unit_fee_cents: number
          unit_price_cents: number
        }
        Insert: {
          created_at?: string
          fees_cents?: number | null
          id?: string
          item_type?: string
          product_id?: string | null
          quantity: number
          subtotal_cents?: number | null
          test_order_id: string
          ticket_tier_id?: string | null
          total_cents?: number | null
          unit_fee_cents?: number
          unit_price_cents: number
        }
        Update: {
          created_at?: string
          fees_cents?: number | null
          id?: string
          item_type?: string
          product_id?: string | null
          quantity?: number
          subtotal_cents?: number | null
          test_order_id?: string
          ticket_tier_id?: string | null
          total_cents?: number | null
          unit_fee_cents?: number
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "test_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_order_items_test_order_id_fkey"
            columns: ["test_order_id"]
            isOneToOne: false
            referencedRelation: "test_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_order_items_ticket_tier_id_fkey"
            columns: ["ticket_tier_id"]
            isOneToOne: false
            referencedRelation: "ticket_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      test_orders: {
        Row: {
          created_at: string
          currency: string
          customer_email: string | null
          event_id: string
          fee_breakdown: Json | null
          fees_cents: number
          guest_id: string | null
          id: string
          status: string
          subtotal_cents: number
          test_profile_id: string | null
          total_cents: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          customer_email?: string | null
          event_id: string
          fee_breakdown?: Json | null
          fees_cents?: number
          guest_id?: string | null
          id?: string
          status?: string
          subtotal_cents: number
          test_profile_id?: string | null
          total_cents: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          customer_email?: string | null
          event_id?: string
          fee_breakdown?: Json | null
          fees_cents?: number
          guest_id?: string | null
          id?: string
          status?: string
          subtotal_cents?: number
          test_profile_id?: string | null
          total_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_orders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_orders_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_orders_test_profile_id_fkey"
            columns: ["test_profile_id"]
            isOneToOne: false
            referencedRelation: "test_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      test_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string
          guest_list_visible: boolean | null
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          guest_list_visible?: boolean | null
          id?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          guest_list_visible?: boolean | null
          id?: string
        }
        Relationships: []
      }
      test_tickets: {
        Row: {
          attendee_email: string | null
          attendee_name: string | null
          checked_in_at: string | null
          checked_in_by: string | null
          created_at: string
          event_id: string
          has_protection: boolean
          id: string
          qr_code_data: string
          status: string
          test_order_id: string
          test_order_item_id: string
          ticket_tier_id: string
          updated_at: string
        }
        Insert: {
          attendee_email?: string | null
          attendee_name?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string
          event_id: string
          has_protection?: boolean
          id?: string
          qr_code_data: string
          status?: string
          test_order_id: string
          test_order_item_id: string
          ticket_tier_id: string
          updated_at?: string
        }
        Update: {
          attendee_email?: string | null
          attendee_name?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string
          event_id?: string
          has_protection?: boolean
          id?: string
          qr_code_data?: string
          status?: string
          test_order_id?: string
          test_order_item_id?: string
          ticket_tier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_tickets_test_order_id_fkey"
            columns: ["test_order_id"]
            isOneToOne: false
            referencedRelation: "test_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_tickets_test_order_item_id_fkey"
            columns: ["test_order_item_id"]
            isOneToOne: false
            referencedRelation: "test_order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_tickets_ticket_tier_id_fkey"
            columns: ["ticket_tier_id"]
            isOneToOne: false
            referencedRelation: "ticket_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_groups: {
        Row: {
          color: string
          created_at: string
          description: string | null
          event_id: string
          fee_flat_cents: number
          fee_pct_bps: number
          group_order: number
          id: string
          inherit_event_fees: boolean
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          event_id: string
          fee_flat_cents?: number
          fee_pct_bps?: number
          group_order: number
          id?: string
          inherit_event_fees?: boolean
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          event_id?: string
          fee_flat_cents?: number
          fee_pct_bps?: number
          group_order?: number
          id?: string
          inherit_event_fees?: boolean
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_groups_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
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
          {
            foreignKeyName: "ticket_holds_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_scan_events: {
        Row: {
          created_at: string
          device_info: Json | null
          event_id: string
          id: string
          scan_location: Json | null
          scan_result: string
          scanned_by: string | null
          ticket_id: string
        }
        Insert: {
          created_at?: string
          device_info?: Json | null
          event_id: string
          id?: string
          scan_location?: Json | null
          scan_result: string
          scanned_by?: string | null
          ticket_id: string
        }
        Update: {
          created_at?: string
          device_info?: Json | null
          event_id?: string
          id?: string
          scan_location?: Json | null
          scan_result?: string
          scanned_by?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_scan_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_scan_events_scanned_by_fkey"
            columns: ["scanned_by"]
            isOneToOne: false
            referencedRelation: "users_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_scan_events_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_scans: {
        Row: {
          event_id: string
          id: string
          scan_method: string | null
          scanned_at: string | null
          scanned_by: string | null
          ticket_id: string
        }
        Insert: {
          event_id: string
          id?: string
          scan_method?: string | null
          scanned_at?: string | null
          scanned_by?: string | null
          ticket_id: string
        }
        Update: {
          event_id?: string
          id?: string
          scan_method?: string | null
          scanned_at?: string | null
          scanned_by?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_scans_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_scans_scanned_by_fkey"
            columns: ["scanned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_scans_scanned_by_fkey"
            columns: ["scanned_by"]
            isOneToOne: false
            referencedRelation: "public_guest_list_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_scans_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "order_items"
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
          group_id: string | null
          hide_until_previous_sold_out: boolean
          id: string
          inherit_group_fees: boolean
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
          group_id?: string | null
          hide_until_previous_sold_out?: boolean
          id?: string
          inherit_group_fees?: boolean
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
          group_id?: string | null
          hide_until_previous_sold_out?: boolean
          id?: string
          inherit_group_fees?: boolean
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
          {
            foreignKeyName: "ticket_tiers_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "ticket_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      ticketing_fees: {
        Row: {
          created_at: string
          environment_id: string
          fee_name: string
          fee_type: string
          fee_value: number
          id: string
          is_active: boolean
          label: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          environment_id: string
          fee_name: string
          fee_type: string
          fee_value: number
          id?: string
          is_active?: boolean
          label?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          environment_id?: string
          fee_name?: string
          fee_type?: string
          fee_value?: number
          id?: string
          is_active?: boolean
          label?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticketing_fees_environment_id_fkey"
            columns: ["environment_id"]
            isOneToOne: false
            referencedRelation: "environments"
            referencedColumns: ["id"]
          },
        ]
      }
      ticketing_sessions: {
        Row: {
          created_at: string
          entered_at: string | null
          event_id: string
          id: string
          status: string
          updated_at: string
          user_session_id: string
        }
        Insert: {
          created_at?: string
          entered_at?: string | null
          event_id: string
          id?: string
          status: string
          updated_at?: string
          user_session_id: string
        }
        Update: {
          created_at?: string
          entered_at?: string | null
          event_id?: string
          id?: string
          status?: string
          updated_at?: string
          user_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticketing_sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
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
          has_protection: boolean
          id: string
          order_id: string
          order_item_id: string
          qr_code_data: string
          status: string
          test_data: boolean
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
          has_protection?: boolean
          id?: string
          order_id: string
          order_item_id: string
          qr_code_data: string
          status?: string
          test_data?: boolean
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
          has_protection?: boolean
          id?: string
          order_id?: string
          order_item_id?: string
          qr_code_data?: string
          status?: string
          test_data?: boolean
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
      tracking_links: {
        Row: {
          click_count: number
          code: string
          created_at: string
          custom_destination_url: string | null
          event_id: string
          expires_at: string | null
          id: string
          is_active: boolean
          max_clicks: number | null
          name: string
          updated_at: string
          utm_campaign: string
          utm_content: string | null
          utm_medium: string
          utm_source: string
          utm_term: string | null
        }
        Insert: {
          click_count?: number
          code: string
          created_at?: string
          custom_destination_url?: string | null
          event_id: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_clicks?: number | null
          name: string
          updated_at?: string
          utm_campaign: string
          utm_content?: string | null
          utm_medium: string
          utm_source: string
          utm_term?: string | null
        }
        Update: {
          click_count?: number
          code?: string
          created_at?: string
          custom_destination_url?: string | null
          event_id?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_clicks?: number | null
          name?: string
          updated_at?: string
          utm_campaign?: string
          utm_content?: string | null
          utm_medium?: string
          utm_source?: string
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tracking_links_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      undercard_requests: {
        Row: {
          artist_id: string | null
          artist_registration_id: string | null
          created_at: string
          event_id: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          status: string
          suggested_recording_id: string | null
          updated_at: string
        }
        Insert: {
          artist_id?: string | null
          artist_registration_id?: string | null
          created_at?: string
          event_id: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          suggested_recording_id?: string | null
          updated_at?: string
        }
        Update: {
          artist_id?: string | null
          artist_registration_id?: string | null
          created_at?: string
          event_id?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          suggested_recording_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "undercard_requests_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "undercard_requests_artist_registration_id_fkey"
            columns: ["artist_registration_id"]
            isOneToOne: false
            referencedRelation: "artist_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "undercard_requests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "undercard_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "undercard_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "public_guest_list_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "undercard_requests_suggested_recording_id_fkey"
            columns: ["suggested_recording_id"]
            isOneToOne: false
            referencedRelation: "artist_recordings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_event_interests: {
        Row: {
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_event_interests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_event_interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      user_requests: {
        Row: {
          created_at: string
          denial_reason: string | null
          id: string
          parameters: Json | null
          request_type: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          denial_reason?: string | null
          id?: string
          parameters?: Json | null
          request_type: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          denial_reason?: string | null
          id?: string
          parameters?: Json | null
          request_type?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_requests_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          capacity: number | null
          city: string | null
          city_id: string | null
          country: string | null
          created_at: string | null
          description: string | null
          facebook_url: string | null
          id: string
          image_url: string | null
          instagram_handle: string | null
          logo_url: string | null
          name: string
          social_email: string | null
          state: string | null
          test_data: boolean
          tiktok_handle: string | null
          twitter_handle: string | null
          updated_at: string | null
          website: string | null
          youtube_url: string | null
          zip_code: string | null
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          capacity?: number | null
          city?: string | null
          city_id?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          facebook_url?: string | null
          id?: string
          image_url?: string | null
          instagram_handle?: string | null
          logo_url?: string | null
          name: string
          social_email?: string | null
          state?: string | null
          test_data?: boolean
          tiktok_handle?: string | null
          twitter_handle?: string | null
          updated_at?: string | null
          website?: string | null
          youtube_url?: string | null
          zip_code?: string | null
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          capacity?: number | null
          city?: string | null
          city_id?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          facebook_url?: string | null
          id?: string
          image_url?: string | null
          instagram_handle?: string | null
          logo_url?: string | null
          name?: string
          social_email?: string | null
          state?: string | null
          test_data?: boolean
          tiktok_handle?: string | null
          twitter_handle?: string | null
          updated_at?: string | null
          website?: string | null
          youtube_url?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venues_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
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
      analytics_daily_page_views: {
        Row: {
          avg_scroll_depth: number | null
          avg_time_on_page_ms: number | null
          day: string | null
          page_path: string | null
          page_type: string | null
          unique_sessions: number | null
          unique_users: number | null
          view_count: number | null
        }
        Relationships: []
      }
      analytics_funnel_summary: {
        Row: {
          add_to_carts: number | null
          avg_time_to_purchase_ms: number | null
          cart_abandons: number | null
          checkout_abandons: number | null
          checkout_completes: number | null
          checkout_starts: number | null
          event_id: string | null
          event_views: number | null
          ticket_tier_views: number | null
          total_revenue_cents: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_funnel_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_performance_summary: {
        Row: {
          avg_value: number | null
          day: string | null
          good_count: number | null
          metric_type:
            | Database["public"]["Enums"]["performance_metric_type"]
            | null
          needs_improvement_count: number | null
          p50_value: number | null
          p75_value: number | null
          p95_value: number | null
          poor_count: number | null
          sample_count: number | null
        }
        Relationships: []
      }
      daily_scan_statistics: {
        Row: {
          duplicate_scans: number | null
          event_id: string | null
          first_scan: string | null
          invalid_scans: number | null
          last_scan: string | null
          rejected_scans: number | null
          scan_date: string | null
          successful_scans: number | null
          total_scans: number | null
          unique_tickets_scanned: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_scan_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      public_guest_list_profiles: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          first_name: string | null
          guest_list_visible: boolean | null
          id: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          display_name?: string | null
          first_name?: never
          guest_list_visible?: boolean | null
          id?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          display_name?: string | null
          first_name?: never
          guest_list_visible?: boolean | null
          id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users_complete"
            referencedColumns: ["id"]
          },
        ]
      }
      users_complete: {
        Row: {
          auth_created_at: string | null
          avatar_url: string | null
          display_name: string | null
          email: string | null
          email_confirmed_at: string | null
          full_name: string | null
          id: string | null
          is_verified: boolean | null
          last_sign_in_at: string | null
          organization_id: string | null
          organization_name: string | null
          profile_created_at: string | null
          profile_updated_at: string | null
          roles: Json | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      archive_old_activity_logs: {
        Args: { p_retention_days?: number }
        Returns: number
      }
      archive_old_analytics: {
        Args: { p_retention_days?: number }
        Returns: {
          funnel_events_archived: number
          page_views_archived: number
          sessions_archived: number
        }[]
      }
      archive_old_error_logs: {
        Args: { p_retention_days?: number }
        Returns: number
      }
      can_access_order: { Args: { p_order_id: string }; Returns: boolean }
      cleanup_old_ticketing_sessions: { Args: never; Returns: undefined }
      convert_hold_to_sale: { Args: { p_hold_id: string }; Returns: boolean }
      create_artist_gallery: {
        Args: { p_artist_id: string; p_artist_name: string }
        Returns: string
      }
      create_event_gallery: {
        Args: { p_event_id: string; p_event_title: string }
        Returns: string
      }
      create_event_with_tiers: {
        Args: { p_event_data: Json; p_ticket_tiers: Json }
        Returns: Json
      }
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
      decrement_product_stock: {
        Args: { p_product_id: string; p_quantity: number }
        Returns: boolean
      }
      delete_mock_orders_by_event: {
        Args: { p_event_id: string }
        Returns: {
          deleted_guests: number
          deleted_interests: number
          deleted_order_items: number
          deleted_orders: number
          deleted_rsvps: number
          deleted_test_order_items: number
          deleted_test_orders: number
          deleted_test_profiles: number
          deleted_test_tickets: number
          deleted_tickets: number
        }[]
      }
      end_analytics_session: {
        Args: { p_session_id: string }
        Returns: undefined
      }
      generate_rsvp_signature: {
        Args: { p_event_id: string; p_rsvp_id: string }
        Returns: string
      }
      get_activity_log_archive_status: {
        Args: never
        Returns: {
          active: boolean
          job_name: string
          last_run: string
          next_run: string
          schedule: string
        }[]
      }
      get_all_users: {
        Args: never
        Returns: {
          auth_created_at: string
          avatar_url: string
          display_name: string
          email: string
          email_confirmed_at: string
          full_name: string
          id: string
          last_sign_in_at: string
          organization_id: string
          organization_name: string
          profile_created_at: string
          profile_updated_at: string
          roles: Json
          user_id: string
        }[]
      }
      get_all_users_with_email: {
        Args: never
        Returns: {
          age_range: string
          avatar_url: string
          billing_address_line_1: string
          billing_city: string
          billing_state: string
          billing_zip_code: string
          created_at: string
          display_name: string
          email: string
          full_name: string
          gender: string
          home_city: string
          id: string
          organization_id: string
          organization_name: string
          roles: string[]
          stripe_customer_id: string
          updated_at: string
          user_id: string
        }[]
      }
      get_artist_genres: {
        Args: { artist_id_param: string }
        Returns: {
          genre_id: string
          genre_name: string
          is_primary: boolean
          parent_genre_id: string
          parent_genre_name: string
        }[]
      }
      get_artists_by_genre: {
        Args: { genre_id_param: string; include_subgenres?: boolean }
        Returns: {
          artist_id: string
          artist_image_url: string
          artist_name: string
          genre_name: string
          is_primary: boolean
        }[]
      }
      get_comp_ticket_by_token: {
        Args: { p_claim_token: string }
        Returns: {
          event_id: string
          event_title: string
          expires_at: string
          id: string
          recipient_email: string
          status: string
          ticket_tier_id: string
          tier_name: string
        }[]
      }
      get_event_attendee_summary: {
        Args: { event_id_param: string }
        Returns: {
          guest_count: number
          interest_count: number
          private_attendee_count: number
          public_attendee_count: number
          rsvp_count: number
          ticket_holder_count: number
        }[]
      }
      get_event_guest_order_count: {
        Args: { event_id_param: string }
        Returns: number
      }
      get_event_interest_count: {
        Args: { event_id_param: string }
        Returns: number
      }
      get_event_inventory_stats: {
        Args: { p_event_id: string }
        Returns: {
          available_count: number
          is_active: boolean
          pending_count: number
          price_cents: number
          reserved_count: number
          sold_count: number
          tier_id: string
          tier_name: string
          tier_order: number
          total_tickets: number
        }[]
      }
      get_event_order_count: {
        Args: { event_id_param: string }
        Returns: number
      }
      get_event_rsvp_count: { Args: { p_event_id: string }; Returns: number }
      get_event_view_count: { Args: { p_event_id: string }; Returns: number }
      get_foreign_keys: {
        Args: { p_table_name: string }
        Returns: {
          column_name: string
          constraint_name: string
          foreign_column_name: string
          foreign_table_name: string
          on_delete_action: string
          on_update_action: string
        }[]
      }
      get_genre_hierarchy: {
        Args: { genre_id_param: string }
        Returns: {
          id: string
          level: number
          name: string
        }[]
      }
      get_genre_path: { Args: { genre_id_param: string }; Returns: string }
      get_guest_billing_address: {
        Args: { p_guest_id: string }
        Returns: {
          city: string
          country: string
          id: string
          line_1: string
          line_2: string
          state: string
          zip_code: string
        }[]
      }
      get_organization_role: {
        Args: { p_organization_id: string; p_user_id: string }
        Returns: string
      }
      get_profile_addresses: {
        Args: { p_profile_id: string }
        Returns: {
          address_type: Database["public"]["Enums"]["address_type"]
          city: string | null
          country: string | null
          created_at: string
          guest_id: string | null
          id: string
          is_default: boolean | null
          label: string | null
          line_1: string | null
          line_2: string | null
          organization_id: string | null
          profile_id: string | null
          state: string | null
          updated_at: string
          zip_code: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "addresses"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_profile_billing_address: {
        Args: { p_profile_id: string }
        Returns: {
          city: string
          country: string
          id: string
          line_1: string
          line_2: string
          state: string
          zip_code: string
        }[]
      }
      get_rsvp_with_details: {
        Args: { p_rsvp_id: string }
        Returns: {
          attendee_email: string
          attendee_name: string
          checked_in_at: string
          checked_in_by: string
          event_id: string
          event_start_time: string
          event_title: string
          id: string
          status: string
          user_id: string
          venue_name: string
        }[]
      }
      get_table_list: {
        Args: never
        Returns: {
          row_count: number
          table_name: string
          table_size: string
        }[]
      }
      get_table_schema: {
        Args: { p_table_name: string }
        Returns: {
          character_maximum_length: number
          column_default: string
          column_name: string
          data_type: string
          is_nullable: string
          is_primary_key: boolean
          is_unique: boolean
          numeric_precision: number
          ordinal_position: number
        }[]
      }
      get_tier_inventory_stats: {
        Args: { p_tier_id: string }
        Returns: {
          available_count: number
          pending_count: number
          reserved_count: number
          sold_count: number
          tier_id: string
          total_tickets: number
        }[]
      }
      get_user_roles: {
        Args: { user_id_param: string }
        Returns: {
          display_name: string
          permission_names: string[]
          role_name: string
        }[]
      }
      has_permission: {
        Args: { permission_name: string; user_id_param: string }
        Returns: boolean
      }
      has_role: {
        Args: { role_name_param: string; user_id_param: string }
        Returns: boolean
      }
      has_user_rsvp: {
        Args: { p_event_id: string; p_user_id: string }
        Returns: boolean
      }
      increment_event_share_count: {
        Args: { p_event_id: string }
        Returns: number
      }
      increment_event_view: { Args: { p_event_id: string }; Returns: number }
      increment_genre_selection_count: {
        Args: { genre_id: string }
        Returns: undefined
      }
      increment_product_stock: {
        Args: { p_product_id: string; p_quantity: number }
        Returns: boolean
      }
      increment_recording_click: {
        Args: { recording_id: string }
        Returns: number
      }
      init_analytics_session: {
        Args: {
          p_browser?: string
          p_device_type?: string
          p_entry_page?: string
          p_os?: string
          p_referrer?: string
          p_screen_height?: number
          p_screen_width?: number
          p_session_id: string
          p_user_agent?: string
          p_utm_campaign?: string
          p_utm_content?: string
          p_utm_medium?: string
          p_utm_source?: string
          p_utm_term?: string
        }
        Returns: string
      }
      is_dev_admin: { Args: { user_id_param: string }; Returns: boolean }
      is_event_manager: {
        Args: { p_event_id: string; p_user_id: string }
        Returns: boolean
      }
      is_event_staff: {
        Args: { p_event_id: string; p_user_id: string }
        Returns: boolean
      }
      is_organization_admin: {
        Args: { p_organization_id: string; p_user_id: string }
        Returns: boolean
      }
      is_organization_staff: {
        Args: { p_organization_id: string; p_user_id: string }
        Returns: boolean
      }
      is_pg_trgm_available: { Args: never; Returns: boolean }
      is_user_interested: {
        Args: { p_event_id: string; p_user_id: string }
        Returns: boolean
      }
      link_guest_to_profile: {
        Args: { p_guest_email: string; p_profile_id: string }
        Returns: number
      }
      link_orders_for_user: {
        Args: { user_email: string; user_uuid: string }
        Returns: number
      }
      log_activity: {
        Args: {
          p_category: Database["public"]["Enums"]["activity_category"]
          p_description: string
          p_event_type: Database["public"]["Enums"]["activity_event_type"]
          p_ip_address?: unknown
          p_metadata?: Json
          p_target_resource_id?: string
          p_target_resource_name?: string
          p_target_resource_type?: string
          p_user_agent?: string
          p_user_id?: string
        }
        Returns: string
      }
      log_error: {
        Args: {
          p_app_version?: string
          p_details?: Json
          p_endpoint?: string
          p_environment?: string
          p_error_code?: string
          p_ip_address?: unknown
          p_level?: Database["public"]["Enums"]["error_log_level"]
          p_message?: string
          p_metadata?: Json
          p_method?: string
          p_page_url?: string
          p_request_id?: string
          p_session_id?: string
          p_source?: Database["public"]["Enums"]["error_log_source"]
          p_stack_trace?: string
          p_status_code?: number
          p_user_agent?: string
          p_user_id?: string
        }
        Returns: string
      }
      promo_code_applies_to_tier: {
        Args: { p_promo_code_id: string; p_ticket_tier_id: string }
        Returns: boolean
      }
      record_funnel_event: {
        Args: {
          p_cart_id?: string
          p_event_id: string
          p_event_type: Database["public"]["Enums"]["funnel_event_type"]
          p_metadata?: Json
          p_order_id?: string
          p_quantity?: number
          p_session_id: string
          p_ticket_tier_id?: string
          p_value_cents?: number
        }
        Returns: string
      }
      record_page_view: {
        Args: {
          p_page_path: string
          p_page_title?: string
          p_page_type?: string
          p_referrer_page?: string
          p_resource_id?: string
          p_session_id: string
          p_source?: Database["public"]["Enums"]["analytics_page_source"]
          p_user_agent?: string
          p_viewport_height?: number
          p_viewport_width?: number
        }
        Returns: string
      }
      record_performance_metric: {
        Args: {
          p_endpoint?: string
          p_metadata?: Json
          p_metric_rating?: string
          p_metric_type: Database["public"]["Enums"]["performance_metric_type"]
          p_metric_value: number
          p_page_path: string
          p_session_id: string
        }
        Returns: string
      }
      refresh_all_table_metadata: { Args: never; Returns: Json }
      refresh_table_metadata: { Args: { p_table_name: string }; Returns: Json }
      release_ticket_hold: { Args: { p_hold_id: string }; Returns: boolean }
      search_artists_fuzzy: {
        Args: { p_limit?: number; p_query: string; p_threshold?: number }
        Returns: {
          bio: string
          id: string
          image_url: string
          name: string
          similarity_score: number
        }[]
      }
      search_events_fuzzy: {
        Args: {
          p_limit?: number
          p_query: string
          p_threshold?: number
          p_upcoming_only?: boolean
        }
        Returns: {
          description: string
          headliner_name: string
          hero_image: string
          id: string
          similarity_score: number
          start_time: string
          title: string
          venue_id: string
        }[]
      }
      search_organizations_fuzzy: {
        Args: { p_limit?: number; p_query: string; p_threshold?: number }
        Returns: {
          id: string
          logo_url: string
          name: string
          similarity_score: number
        }[]
      }
      search_profiles_fuzzy: {
        Args: { p_limit?: number; p_query: string; p_threshold?: number }
        Returns: {
          avatar_url: string
          display_name: string
          full_name: string
          id: string
          similarity_score: number
          user_id: string
        }[]
      }
      search_venues_fuzzy: {
        Args: { p_limit?: number; p_query: string; p_threshold?: number }
        Returns: {
          city: string
          id: string
          image_url: string
          name: string
          similarity_score: number
          state: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      sync_event_inventory_counters: {
        Args: { p_event_id: string }
        Returns: {
          new_available: number
          new_sold: number
          old_available: number
          old_sold: number
          tier_id: string
          tier_name: string
          was_updated: boolean
        }[]
      }
      sync_tier_inventory_counters: {
        Args: { p_tier_id?: string }
        Returns: {
          new_available: number
          new_sold: number
          old_available: number
          old_sold: number
          tier_id: string
          was_updated: boolean
        }[]
      }
      toggle_event_rsvp: {
        Args: { p_event_id: string }
        Returns: {
          action: string
          rsvp_id: string
        }[]
      }
      trigger_activity_log_archive: {
        Args: { p_retention_days?: number }
        Returns: Json
      }
      update_page_view_duration: {
        Args: {
          p_scroll_depth_percent?: number
          p_time_on_page_ms: number
          p_view_id: string
        }
        Returns: undefined
      }
      upsert_guest_billing_address: {
        Args: {
          p_city?: string
          p_country?: string
          p_guest_id: string
          p_line_1?: string
          p_line_2?: string
          p_state?: string
          p_zip_code?: string
        }
        Returns: string
      }
      upsert_profile_billing_address: {
        Args: {
          p_city?: string
          p_country?: string
          p_line_1?: string
          p_line_2?: string
          p_profile_id: string
          p_state?: string
          p_zip_code?: string
        }
        Returns: string
      }
      verify_rsvp_signature: {
        Args: { p_event_id: string; p_rsvp_id: string; p_signature: string }
        Returns: boolean
      }
    }
    Enums: {
      activity_category:
        | "account"
        | "event"
        | "artist"
        | "venue"
        | "recording"
        | "ticket_tier"
        | "ticket"
        | "system"
      activity_event_type:
        | "account_created"
        | "role_assigned"
        | "role_removed"
        | "permission_changed"
        | "resource_created"
        | "resource_updated"
        | "resource_deleted"
        | "ticket_sold"
        | "ticket_scanned"
        | "ticket_refunded"
        | "ticket_cancelled"
        | "rsvp_scanned"
      address_type: "billing" | "shipping" | "headquarters" | "other"
      analytics_page_source:
        | "direct"
        | "internal"
        | "external"
        | "search_engine"
        | "social"
        | "email"
        | "advertisement"
      app_role: "user" | "admin" | "developer" | "org_admin" | "org_staff"
      error_log_level: "debug" | "info" | "warn" | "error" | "fatal"
      error_log_source:
        | "client"
        | "edge_function"
        | "database"
        | "external_service"
      funnel_event_type:
        | "event_view"
        | "ticket_tier_view"
        | "add_to_cart"
        | "checkout_start"
        | "checkout_complete"
        | "checkout_abandon"
        | "cart_abandon"
      media_type: "image" | "video" | "audio"
      performance_metric_type:
        | "page_load"
        | "first_contentful_paint"
        | "largest_contentful_paint"
        | "first_input_delay"
        | "interaction_to_next_paint"
        | "cumulative_layout_shift"
        | "time_to_first_byte"
        | "api_response"
      process_status:
        | "pending"
        | "running"
        | "completed"
        | "failed"
        | "rolled_back"
      promo_code_scope:
        | "all_tickets"
        | "specific_groups"
        | "specific_tiers"
        | "disabled"
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
      activity_category: [
        "account",
        "event",
        "artist",
        "venue",
        "recording",
        "ticket_tier",
        "ticket",
        "system",
      ],
      activity_event_type: [
        "account_created",
        "role_assigned",
        "role_removed",
        "permission_changed",
        "resource_created",
        "resource_updated",
        "resource_deleted",
        "ticket_sold",
        "ticket_scanned",
        "ticket_refunded",
        "ticket_cancelled",
        "rsvp_scanned",
      ],
      address_type: ["billing", "shipping", "headquarters", "other"],
      analytics_page_source: [
        "direct",
        "internal",
        "external",
        "search_engine",
        "social",
        "email",
        "advertisement",
      ],
      app_role: ["user", "admin", "developer", "org_admin", "org_staff"],
      error_log_level: ["debug", "info", "warn", "error", "fatal"],
      error_log_source: [
        "client",
        "edge_function",
        "database",
        "external_service",
      ],
      funnel_event_type: [
        "event_view",
        "ticket_tier_view",
        "add_to_cart",
        "checkout_start",
        "checkout_complete",
        "checkout_abandon",
        "cart_abandon",
      ],
      media_type: ["image", "video", "audio"],
      performance_metric_type: [
        "page_load",
        "first_contentful_paint",
        "largest_contentful_paint",
        "first_input_delay",
        "interaction_to_next_paint",
        "cumulative_layout_shift",
        "time_to_first_byte",
        "api_response",
      ],
      process_status: [
        "pending",
        "running",
        "completed",
        "failed",
        "rolled_back",
      ],
      promo_code_scope: [
        "all_tickets",
        "specific_groups",
        "specific_tiers",
        "disabled",
      ],
    },
  },
} as const
