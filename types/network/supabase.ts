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
      backtest_data: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          name: string
          results: Json
          start_date: string
          strategy: Json
          symbol: string
          timeframe: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          name: string
          results: Json
          start_date: string
          strategy: Json
          symbol: string
          timeframe: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          name?: string
          results?: Json
          start_date?: string
          strategy?: Json
          symbol?: string
          timeframe?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "backtest_data_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cached_data: {
        Row: {
          created_at: string | null
          data: Json
          data_type: string
          expires_at: string
          id: string
          symbol: string
          timeframe: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data: Json
          data_type: string
          expires_at: string
          id?: string
          symbol: string
          timeframe?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json
          data_type?: string
          expires_at?: string
          id?: string
          symbol?: string
          timeframe?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      chart_settings: {
        Row: {
          chart_type: string
          created_at: string | null
          id: string
          show_grid: boolean | null
          show_legend: boolean | null
          show_volume: boolean | null
          theme: string | null
          timeframe: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chart_type: string
          created_at?: string | null
          id?: string
          show_grid?: boolean | null
          show_legend?: boolean | null
          show_volume?: boolean | null
          theme?: string | null
          timeframe: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chart_type?: string
          created_at?: string | null
          id?: string
          show_grid?: boolean | null
          show_legend?: boolean | null
          show_volume?: boolean | null
          theme?: string | null
          timeframe?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chart_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_images: {
        Row: {
          created_at: string | null
          id: string
          image_caption: string | null
          image_data: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_caption?: string | null
          image_data: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_caption?: string | null
          image_data?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_images_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string | null
          id: string
          image_id: string | null
          is_proposal: boolean | null
          is_public: boolean | null
          price: number | null
          proposal_type: string | null
          role: string
          stop_loss: number | null
          take_profit: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          image_id?: string | null
          is_proposal?: boolean | null
          is_public?: boolean | null
          price?: number | null
          proposal_type?: string | null
          role: string
          stop_loss?: number | null
          take_profit?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          image_id?: string | null
          is_proposal?: boolean | null
          is_public?: boolean | null
          price?: number | null
          proposal_type?: string | null
          role?: string
          stop_loss?: number | null
          take_profit?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_fk"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "chat_images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          system_prompt: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          system_prompt?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          system_prompt?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      entries: {
        Row: {
          created_at: string | null
          exit_price: number | null
          exit_time: string | null
          id: string
          is_public: boolean | null
          price: number
          profit: number | null
          side: string
          status: string
          stop_loss: number | null
          symbol: string
          take_profit: number | null
          time: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          exit_price?: number | null
          exit_time?: string | null
          id?: string
          is_public?: boolean | null
          price: number
          profit?: number | null
          side: string
          status: string
          stop_loss?: number | null
          symbol: string
          take_profit?: number | null
          time: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          exit_price?: number | null
          exit_time?: string | null
          id?: string
          is_public?: boolean | null
          price?: number
          profit?: number | null
          side?: string
          status?: string
          stop_loss?: number | null
          symbol?: string
          take_profit?: number | null
          time?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      indicator_settings: {
        Row: {
          chart_settings_id: string
          color: string | null
          created_at: string | null
          id: string
          params: Json
          type: string
          updated_at: string | null
          user_id: string
          visible: boolean | null
        }
        Insert: {
          chart_settings_id: string
          color?: string | null
          created_at?: string | null
          id?: string
          params?: Json
          type: string
          updated_at?: string | null
          user_id: string
          visible?: boolean | null
        }
        Update: {
          chart_settings_id?: string
          color?: string | null
          created_at?: string | null
          id?: string
          params?: Json
          type?: string
          updated_at?: string | null
          user_id?: string
          visible?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "indicator_settings_chart_settings_id_fkey"
            columns: ["chart_settings_id"]
            isOneToOne: false
            referencedRelation: "chart_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicator_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      symbol_settings: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_favorite: boolean | null
          symbol: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_favorite?: boolean | null
          symbol: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_favorite?: boolean | null
          symbol?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "symbol_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_relations: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_relations_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_relations_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_admin: boolean | null
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          is_admin?: boolean | null
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_admin?: boolean | null
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      memories: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          embedding: number[] | null;
          metadata: Json;
          external_id: string | null;
          is_synced: boolean;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          content: string;
          embedding?: number[] | null;
          metadata?: Json;
          external_id?: string | null;
          is_synced?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          content?: string;
          embedding?: number[] | null;
          metadata?: Json;
          external_id?: string | null;
          is_synced?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "memories_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

