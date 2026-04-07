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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      feedback: {
        Row: {
          city: string | null
          created_at: string
          email: string | null
          feedback_text: string
          id: string
          name: string | null
          phone: string | null
          rating: number | null
          state: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          email?: string | null
          feedback_text: string
          id?: string
          name?: string | null
          phone?: string | null
          rating?: number | null
          state?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          email?: string | null
          feedback_text?: string
          id?: string
          name?: string | null
          phone?: string | null
          rating?: number | null
          state?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: string
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
        ]
      }
      group_study_sessions: {
        Row: {
          group_id: string
          id: string
          is_active: boolean
          mode: string
          started_at: string
          started_by: string
          subject: string
          target_duration: number | null
        }
        Insert: {
          group_id: string
          id?: string
          is_active?: boolean
          mode: string
          started_at?: string
          started_by: string
          subject?: string
          target_duration?: number | null
        }
        Update: {
          group_id?: string
          id?: string
          is_active?: boolean
          mode?: string
          started_at?: string
          started_by?: string
          subject?: string
          target_duration?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "group_study_sessions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          group_code: string
          id: string
          is_public: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          group_code: string
          id?: string
          is_public?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          group_code?: string
          id?: string
          is_public?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          from_user_id: string | null
          group_id: string | null
          id: string
          is_read: boolean
          message: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          from_user_id?: string | null
          group_id?: string | null
          id?: string
          is_read?: boolean
          message: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          from_user_id?: string | null
          group_id?: string | null
          id?: string
          is_read?: boolean
          message?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          access_key: string
          auth_user_id: string | null
          city: string
          class: string
          created_at: string | null
          currently_studying_subject: string | null
          email: string
          id: string
          is_studying: boolean | null
          name: string
          password_last_updated: string | null
          phone: string
          state: string
          total_study_time: number | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          access_key: string
          auth_user_id?: string | null
          city: string
          class: string
          created_at?: string | null
          currently_studying_subject?: string | null
          email: string
          id?: string
          is_studying?: boolean | null
          name: string
          password_last_updated?: string | null
          phone: string
          state: string
          total_study_time?: number | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          access_key?: string
          auth_user_id?: string | null
          city?: string
          class?: string
          created_at?: string | null
          currently_studying_subject?: string | null
          email?: string
          id?: string
          is_studying?: boolean | null
          name?: string
          password_last_updated?: string | null
          phone?: string
          state?: string
          total_study_time?: number | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_group_members: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      find_user_by_username: {
        Args: { _username: string }
        Returns: {
          auth_user_id: string
          name: string
          username: string
        }[]
      }
      generate_group_code: { Args: never; Returns: string }
      get_all_user_auth_ids: {
        Args: never
        Returns: {
          auth_user_id: string
          username: string
        }[]
      }
      get_app_stats: {
        Args: never
        Returns: {
          active_studiers: number
          total_study_time_all: number
          total_users: number
        }[]
      }
      get_group_by_code: {
        Args: { _group_code: string }
        Returns: {
          created_by: string
          description: string
          group_code: string
          id: string
          is_public: boolean
          name: string
        }[]
      }
      get_group_member_profiles: {
        Args: { _group_id: string }
        Returns: {
          currently_studying_subject: string
          is_studying: boolean
          name: string
          role: string
          total_study_time: number
          user_id: string
          username: string
        }[]
      }
      get_leaderboard: {
        Args: never
        Returns: {
          class: string
          currently_studying_subject: string
          id: string
          is_studying: boolean
          name: string
          total_study_time: number
          updated_at: string
          username: string
        }[]
      }
      is_group_member: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
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
    Enums: {},
  },
} as const
