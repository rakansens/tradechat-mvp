/**
 * Supabaseデータベース型定義ファイル
 * 
 * このファイルはSupabaseデータベーステーブルの型情報を提供します。
 * データベースの構造変更時はこのファイルを更新する必要があります。
 * 
 * T-3フェーズで types/supabase.ts から移動されました。
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          is_admin: boolean
          created_at: string
          updated_at: string
          settings: Json
        }
        Insert: {
          id: string
          email: string
          is_admin?: boolean
          created_at?: string
          updated_at?: string
          settings?: Json
        }
        Update: {
          id?: string
          email?: string
          is_admin?: boolean
          created_at?: string
          updated_at?: string
          settings?: Json
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      chat_images: {
        Row: {
          id: string
          user_id: string
          image_data: string
          image_caption: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          image_data: string
          image_caption?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          image_data?: string
          image_caption?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_images_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      chat_messages: {
        Row: {
          id: string
          user_id: string
          role: string
          content: string
          is_proposal: boolean
          is_public: boolean
          proposal_type: string | null
          price: number | null
          take_profit: number | null
          stop_loss: number | null
          image_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: string
          content: string
          is_proposal?: boolean
          is_public?: boolean
          proposal_type?: string | null
          price?: number | null
          take_profit?: number | null
          stop_loss?: number | null
          image_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: string
          content?: string
          is_proposal?: boolean
          is_public?: boolean
          proposal_type?: string | null
          price?: number | null
          take_profit?: number | null
          stop_loss?: number | null
          image_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_image_id_fkey"
            columns: ["image_id"]
            referencedRelation: "chat_images"
            referencedColumns: ["id"]
          }
        ]
      }
      entries: {
        Row: {
          id: string
          user_id: string
          side: string
          symbol: string
          price: number
          time: string
          take_profit: number | null
          stop_loss: number | null
          status: string
          is_public: boolean
          exit_price: number | null
          exit_time: string | null
          profit: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          side: string
          symbol: string
          price: number
          time: string
          take_profit?: number | null
          stop_loss?: number | null
          status: string
          is_public?: boolean
          exit_price?: number | null
          exit_time?: string | null
          profit?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          side?: string
          symbol?: string
          price?: number
          time?: string
          take_profit?: number | null
          stop_loss?: number | null
          status?: string
          is_public?: boolean
          exit_price?: number | null
          exit_time?: string | null
          profit?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entries_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      symbol_settings: {
        Row: {
          id: string
          user_id: string
          symbol: string
          is_favorite: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          symbol: string
          is_favorite?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          symbol?: string
          is_favorite?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "symbol_settings_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      chart_settings: {
        Row: {
          id: string
          user_id: string
          timeframe: string
          chart_type: string
          show_volume: boolean
          show_grid: boolean
          show_legend: boolean
          theme: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          timeframe: string
          chart_type: string
          show_volume?: boolean
          show_grid?: boolean
          show_legend?: boolean
          theme?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          timeframe?: string
          chart_type?: string
          show_volume?: boolean
          show_grid?: boolean
          show_legend?: boolean
          theme?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chart_settings_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      indicator_settings: {
        Row: {
          id: string
          user_id: string
          chart_settings_id: string
          type: string
          params: Json
          color: string | null
          visible: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          chart_settings_id: string
          type: string
          params?: Json
          color?: string | null
          visible?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          chart_settings_id?: string
          type?: string
          params?: Json
          color?: string | null
          visible?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "indicator_settings_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicator_settings_chart_settings_id_fkey"
            columns: ["chart_settings_id"]
            referencedRelation: "chart_settings"
            referencedColumns: ["id"]
          }
        ]
      }
      cached_data: {
        Row: {
          id: string
          data_type: string
          symbol: string
          timeframe: string | null
          data: Json
          expires_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          data_type: string
          symbol: string
          timeframe?: string | null
          data: Json
          expires_at: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          data_type?: string
          symbol?: string
          timeframe?: string | null
          data?: Json
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_relations: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_relations_follower_id_fkey"
            columns: ["follower_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_relations_following_id_fkey"
            columns: ["following_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      backtest_data: {
        Row: {
          id: string
          user_id: string
          name: string
          symbol: string
          timeframe: string
          start_date: string
          end_date: string
          strategy: Json
          results: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          symbol: string
          timeframe: string
          start_date: string
          end_date: string
          strategy: Json
          results: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          symbol?: string
          timeframe?: string
          start_date?: string
          end_date?: string
          strategy?: Json
          results?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "backtest_data_user_id_fkey"
            columns: ["user_id"]
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