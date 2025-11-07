export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.4';
  };
  public: {
    Tables: {
      artists: {
        Row: {
          bio: string | null;
          created_at: string;
          genre: string | null;
          id: string;
          image_url: string | null;
          name: string;
          social_links: Json | null;
          updated_at: string;
        };
        Insert: {
          bio?: string | null;
          created_at?: string;
          genre?: string | null;
          id?: string;
          image_url?: string | null;
          name: string;
          social_links?: Json | null;
          updated_at?: string;
        };
        Update: {
          bio?: string | null;
          created_at?: string;
          genre?: string | null;
          id?: string;
          image_url?: string | null;
          name?: string;
          social_links?: Json | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          created_at: string;
          date: string;
          description: string | null;
          headliner_id: string | null;
          hero_image: string | null;
          id: string;
          ticket_url: string | null;
          time: string;
          title: string;
          undercard_ids: string[] | null;
          updated_at: string;
          venue: string;
        };
        Insert: {
          created_at?: string;
          date: string;
          description?: string | null;
          headliner_id?: string | null;
          hero_image?: string | null;
          id?: string;
          ticket_url?: string | null;
          time: string;
          title: string;
          undercard_ids?: string[] | null;
          updated_at?: string;
          venue: string;
        };
        Update: {
          created_at?: string;
          date?: string;
          description?: string | null;
          headliner_id?: string | null;
          hero_image?: string | null;
          id?: string;
          ticket_url?: string | null;
          time?: string;
          title?: string;
          undercard_ids?: string[] | null;
          updated_at?: string;
          venue?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'events_headliner_id_fkey';
            columns: ['headliner_id'];
            isOneToOne: false;
            referencedRelation: 'artists';
            referencedColumns: ['id'];
          },
        ];
      };
      feature_flags: {
        Row: {
          description: string | null;
          flag_name: string;
          id: string;
          is_enabled: boolean;
          updated_at: string;
        };
        Insert: {
          description?: string | null;
          flag_name: string;
          id?: string;
          is_enabled?: boolean;
          updated_at?: string;
        };
        Update: {
          description?: string | null;
          flag_name?: string;
          id?: string;
          is_enabled?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      dev_notes: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          author_id: string;
          author_name: string;
          message: string;
          type: 'TODO' | 'INFO' | 'BUG' | 'QUESTION';
          status:
            | 'TODO'
            | 'IN_PROGRESS'
            | 'ARCHIVED'
            | 'RESOLVED'
            | 'CANCELLED';
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          author_id: string;
          author_name: string;
          message: string;
          type: 'TODO' | 'INFO' | 'BUG' | 'QUESTION';
          status?:
            | 'TODO'
            | 'IN_PROGRESS'
            | 'ARCHIVED'
            | 'RESOLVED'
            | 'CANCELLED';
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          author_id?: string;
          author_name?: string;
          message?: string;
          type?: 'TODO' | 'INFO' | 'BUG' | 'QUESTION';
          status?:
            | 'TODO'
            | 'IN_PROGRESS'
            | 'ARCHIVED'
            | 'RESOLVED'
            | 'CANCELLED';
        };
        Relationships: [
          {
            foreignKeyName: 'dev_notes_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      merch: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          image_url: string | null;
          in_stock: boolean;
          name: string;
          price: number;
          type: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          in_stock?: boolean;
          name: string;
          price: number;
          type: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          in_stock?: boolean;
          name?: string;
          price?: number;
          type?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string | null;
          id: string;
          spotify_access_token_encrypted: string | null;
          spotify_connected: boolean | null;
          spotify_refresh_token_encrypted: string | null;
          spotify_token_expires_at: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          spotify_access_token_encrypted?: string | null;
          spotify_connected?: boolean | null;
          spotify_refresh_token_encrypted?: string | null;
          spotify_token_expires_at?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          spotify_access_token_encrypted?: string | null;
          spotify_connected?: boolean | null;
          spotify_refresh_token_encrypted?: string | null;
          spotify_token_expires_at?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      scavenger_claims: {
        Row: {
          claim_position: number;
          claimed_at: string;
          device_fingerprint: string | null;
          id: string;
          location_id: string;
          promo_code: string | null;
          reward_type: string;
          show_on_leaderboard: boolean;
          user_id: string;
        };
        Insert: {
          claim_position: number;
          claimed_at?: string;
          device_fingerprint?: string | null;
          id?: string;
          location_id: string;
          promo_code?: string | null;
          reward_type: string;
          show_on_leaderboard?: boolean;
          user_id: string;
        };
        Update: {
          claim_position?: number;
          claimed_at?: string;
          device_fingerprint?: string | null;
          id?: string;
          location_id?: string;
          promo_code?: string | null;
          reward_type?: string;
          show_on_leaderboard?: boolean;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'scavenger_claims_location_id_fkey';
            columns: ['location_id'];
            isOneToOne: false;
            referencedRelation: 'scavenger_locations';
            referencedColumns: ['id'];
          },
        ];
      };
      scavenger_locations: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          label: string | null;
          location_description: string | null;
          location_name: string;
          promo_code: string | null;
          reward_type: Database['public']['Enums']['reward_type'] | null;
          tokens_remaining: number;
          total_tokens: number;
          updated_at: string;
          validation_count: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          label?: string | null;
          location_description?: string | null;
          location_name: string;
          promo_code?: string | null;
          reward_type?: Database['public']['Enums']['reward_type'] | null;
          tokens_remaining?: number;
          total_tokens?: number;
          updated_at?: string;
          validation_count?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          label?: string | null;
          location_description?: string | null;
          location_name?: string;
          promo_code?: string | null;
          reward_type?: Database['public']['Enums']['reward_type'] | null;
          tokens_remaining?: number;
          total_tokens?: number;
          updated_at?: string;
          validation_count?: number;
        };
        Relationships: [];
      };
      songs: {
        Row: {
          artist_id: string;
          created_at: string;
          duration: number | null;
          id: string;
          is_preview: boolean | null;
          music_source: string | null;
          song_name: string;
          streaming_link: string;
          updated_at: string;
        };
        Insert: {
          artist_id: string;
          created_at?: string;
          duration?: number | null;
          id?: string;
          is_preview?: boolean | null;
          music_source?: string | null;
          song_name: string;
          streaming_link: string;
          updated_at?: string;
        };
        Update: {
          artist_id?: string;
          created_at?: string;
          duration?: number | null;
          id?: string;
          is_preview?: boolean | null;
          music_source?: string | null;
          song_name?: string;
          streaming_link?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'songs_artist_id_fkey';
            columns: ['artist_id'];
            isOneToOne: false;
            referencedRelation: 'artists';
            referencedColumns: ['id'];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database['public']['Enums']['app_role'];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database['public']['Enums']['app_role'];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database['public']['Enums']['app_role'];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_roles_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['user_id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      decrypt_token: {
        Args: { encrypted_token: string; user_salt: string };
        Returns: string;
      };
      encrypt_token: {
        Args: { token_value: string; user_salt: string };
        Returns: string;
      };
      get_location_preview: {
        Args: { p_location_id: string };
        Returns: {
          id: string;
          is_active: boolean;
          location_description: string;
          location_name: string;
          reward_type: string;
          tokens_remaining: number;
          total_tokens: number;
        }[];
      };
      get_location_with_promo: {
        Args: { p_location_id: string };
        Returns: {
          id: string;
          is_active: boolean;
          location_description: string;
          location_name: string;
          promo_code: string;
          reward_type: string;
          tokens_remaining: number;
          total_tokens: number;
        }[];
      };
      has_role: {
        Args: {
          _role: Database['public']['Enums']['app_role'];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: 'admin' | 'user';
      reward_type: 'free_ticket' | 'promo_code_20';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ['admin', 'user'],
      reward_type: ['free_ticket', 'promo_code_20'],
    },
  },
} as const;
