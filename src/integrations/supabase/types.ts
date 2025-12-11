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
        Relationships: []
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
          city: string
          city_id: string | null
          created_at: string
          email: string
          equipment: string | null
          genre: string
          id: string
          instagram_handle: string | null
          phone: string
          previous_venues: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          set_length: string | null
          soundcloud_url: string | null
          spotify_url: string | null
          state: string
          status: string
          submitted_at: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          artist_name: string
          availability?: string | null
          bio: string
          city: string
          city_id?: string | null
          created_at?: string
          email: string
          equipment?: string | null
          genre: string
          id?: string
          instagram_handle?: string | null
          phone: string
          previous_venues?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          set_length?: string | null
          soundcloud_url?: string | null
          spotify_url?: string | null
          state: string
          status?: string
          submitted_at?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          artist_name?: string
          availability?: string | null
          bio?: string
          city?: string
          city_id?: string | null
          created_at?: string
          email?: string
          equipment?: string | null
          genre?: string
          id?: string
          instagram_handle?: string | null
          phone?: string
          previous_venues?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          set_length?: string | null
          soundcloud_url?: string | null
          spotify_url?: string | null
          state?: string
          status?: string
          submitted_at?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artist_registrations_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      artists: {
        Row: {
          bio: string | null
          city_id: string | null
          created_at: string | null
          genre: string | null
          id: string
          image_url: string | null
          name: string
          spotify_data: Json | null
          spotify_id: string | null
          test_data: boolean
          updated_at: string | null
          user_id: string | null
          website: string | null
        }
        Insert: {
          bio?: string | null
          city_id?: string | null
          created_at?: string | null
          genre?: string | null
          id?: string
          image_url?: string | null
          name: string
          spotify_data?: Json | null
          spotify_id?: string | null
          test_data?: boolean
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Update: {
          bio?: string | null
          city_id?: string | null
          created_at?: string | null
          genre?: string | null
          id?: string
          image_url?: string | null
          name?: string
          spotify_data?: Json | null
          spotify_id?: string | null
          test_data?: boolean
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artists_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
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
        Relationships: []
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
        Relationships: []
      }
      dev_notes: {
        Row: {
          author_id: string
          author_name: string
          created_at: string | null
          id: string
          message: string
          status: string
          type: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          author_name: string
          created_at?: string | null
          id?: string
          message: string
          status?: string
          type: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          author_name?: string
          created_at?: string | null
          id?: string
          message?: string
          status?: string
          type?: string
          updated_at?: string | null
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
        ]
      }
      events: {
        Row: {
          about_event: string | null
          created_at: string | null
          description: string | null
          display_subtitle: boolean
          end_time: string | null
          headliner_id: string | null
          hero_image: string | null
          hero_image_focal_x: number | null
          hero_image_focal_y: number | null
          id: string
          is_after_hours: boolean
          is_tba: boolean | null
          looking_for_undercard: boolean
          min_interest_count_display: number
          min_share_count_display: number
          organization_id: string | null
          share_count: number
          show_view_count: boolean | null
          start_time: string | null
          status: string
          subtitle: string | null
          test_data: boolean
          title: string
          updated_at: string | null
          venue_id: string | null
        }
        Insert: {
          about_event?: string | null
          created_at?: string | null
          description?: string | null
          display_subtitle?: boolean
          end_time?: string | null
          headliner_id?: string | null
          hero_image?: string | null
          hero_image_focal_x?: number | null
          hero_image_focal_y?: number | null
          id?: string
          is_after_hours?: boolean
          is_tba?: boolean | null
          looking_for_undercard?: boolean
          min_interest_count_display?: number
          min_share_count_display?: number
          organization_id?: string | null
          share_count?: number
          show_view_count?: boolean | null
          start_time?: string | null
          status?: string
          subtitle?: string | null
          test_data?: boolean
          title: string
          updated_at?: string | null
          venue_id?: string | null
        }
        Update: {
          about_event?: string | null
          created_at?: string | null
          description?: string | null
          display_subtitle?: boolean
          end_time?: string | null
          headliner_id?: string | null
          hero_image?: string | null
          hero_image_focal_x?: number | null
          hero_image_focal_y?: number | null
          id?: string
          is_after_hours?: boolean
          is_tba?: boolean | null
          looking_for_undercard?: boolean
          min_interest_count_display?: number
          min_share_count_display?: number
          organization_id?: string | null
          share_count?: number
          show_view_count?: boolean | null
          start_time?: string | null
          status?: string
          subtitle?: string | null
          test_data?: boolean
          title?: string
          updated_at?: string | null
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
        ]
      }
      feature_flags: {
        Row: {
          created_at: string | null
          description: string | null
          environment_id: string
          flag_name: string
          id: string
          is_enabled: boolean
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          environment_id: string
          flag_name: string
          id?: string
          is_enabled?: boolean
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          environment_id?: string
          flag_name?: string
          id?: string
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
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          parent_id?: string | null
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
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          event_id: string
          fee_breakdown: Json | null
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
          billing_address_line_1?: string | null
          billing_address_line_2?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_state?: string | null
          billing_zip_code?: string | null
          created_at?: string
          currency?: string
          event_id: string
          fee_breakdown?: Json | null
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
          billing_address_line_1?: string | null
          billing_address_line_2?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_state?: string | null
          billing_zip_code?: string | null
          created_at?: string
          currency?: string
          event_id?: string
          fee_breakdown?: Json | null
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
        Relationships: []
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          metadata: Json | null
          name: string
          price_cents: number
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          name: string
          price_cents: number
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          name?: string
          price_cents?: number
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
          display_name: string | null
          email: string | null
          full_name: string | null
          gender: string | null
          home_city: string | null
          id: string
          instagram_handle: string | null
          organization_id: string | null
          phone_number: string | null
          preferred_locale: string | null
          privacy_settings: Json | null
          stripe_customer_id: string | null
          updated_at: string
          user_id: string
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
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          home_city?: string | null
          id: string
          instagram_handle?: string | null
          organization_id?: string | null
          phone_number?: string | null
          preferred_locale?: string | null
          privacy_settings?: Json | null
          stripe_customer_id?: string | null
          updated_at?: string
          user_id: string
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
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          home_city?: string | null
          id?: string
          instagram_handle?: string | null
          organization_id?: string | null
          phone_number?: string | null
          preferred_locale?: string | null
          privacy_settings?: Json | null
          stripe_customer_id?: string | null
          updated_at?: string
          user_id?: string
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
      promo_codes: {
        Row: {
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
            foreignKeyName: "rave_family_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
        Relationships: []
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
          artist_registration_id: string
          created_at: string
          event_id: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          artist_registration_id: string
          created_at?: string
          event_id: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          artist_registration_id?: string
          created_at?: string
          event_id?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
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
        Relationships: []
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
        ]
      }
      venues: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          capacity: number | null
          city: string | null
          city_id: string | null
          created_at: string | null
          id: string
          image_url: string | null
          name: string
          state: string | null
          test_data: boolean
          updated_at: string | null
          website: string | null
          zip_code: string | null
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          capacity?: number | null
          city?: string | null
          city_id?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          name: string
          state?: string | null
          test_data?: boolean
          updated_at?: string | null
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          capacity?: number | null
          city?: string | null
          city_id?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          name?: string
          state?: string | null
          test_data?: boolean
          updated_at?: string | null
          website?: string | null
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
      users_complete: {
        Row: {
          auth_created_at: string | null
          avatar_url: string | null
          display_name: string | null
          email: string | null
          email_confirmed_at: string | null
          full_name: string | null
          id: string | null
          last_sign_in_at: string | null
          organization_id: string | null
          organization_name: string | null
          profile_created_at: string | null
          profile_updated_at: string | null
          roles: Json | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      archive_old_activity_logs: {
        Args: { p_retention_days?: number }
        Returns: number
      }
      cleanup_old_ticketing_sessions: { Args: never; Returns: undefined }
      convert_hold_to_sale: { Args: { p_hold_id: string }; Returns: boolean }
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
      get_event_interest_count: {
        Args: { p_event_id: string }
        Returns: number
      }
      get_event_order_count: {
        Args: { event_id_param: string }
        Returns: number
      }
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
      increment_event_share_count: {
        Args: { p_event_id: string }
        Returns: number
      }
      is_dev_admin: { Args: { user_id_param: string }; Returns: boolean }
      is_user_interested: {
        Args: { p_event_id: string; p_user_id: string }
        Returns: boolean
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
      record_event_view: {
        Args: {
          p_event_id: string
          p_ip_address?: unknown
          p_session_id?: string
          p_user_agent?: string
        }
        Returns: string
      }
      refresh_all_table_metadata: { Args: never; Returns: Json }
      refresh_table_metadata: { Args: { p_table_name: string }; Returns: Json }
      release_ticket_hold: { Args: { p_hold_id: string }; Returns: boolean }
      trigger_activity_log_archive: {
        Args: { p_retention_days?: number }
        Returns: Json
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
      app_role: "user" | "admin" | "developer" | "org_admin" | "org_staff"
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
      ],
      app_role: ["user", "admin", "developer", "org_admin", "org_staff"],
    },
  },
} as const
