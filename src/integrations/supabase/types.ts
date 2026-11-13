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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          child_id: string
          created_at: string
          end_time: string
          id: string
          location: string
          name: string
          recurrence: string
          start_date: string
          start_time: string
          until_date: string | null
          weekdays: number[]
        }
        Insert: {
          child_id: string
          created_at?: string
          end_time: string
          id?: string
          location?: string
          name: string
          recurrence?: string
          start_date: string
          start_time: string
          until_date?: string | null
          weekdays?: number[]
        }
        Update: {
          child_id?: string
          created_at?: string
          end_time?: string
          id?: string
          location?: string
          name?: string
          recurrence?: string
          start_date?: string
          start_time?: string
          until_date?: string | null
          weekdays?: number[]
        }
        Relationships: [
          {
            foreignKeyName: "activities_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_assignments: {
        Row: {
          activity_id: string
          id: string
          kind: string
          member_id: string | null
          updated_at: string
        }
        Insert: {
          activity_id: string
          id?: string
          kind: string
          member_id?: string | null
          updated_at?: string
        }
        Update: {
          activity_id?: string
          id?: string
          kind?: string
          member_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_assignments_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_assignments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_items: {
        Row: {
          activity_id: string
          checked: boolean
          created_at: string
          id: string
          label: string
          position: number
        }
        Insert: {
          activity_id: string
          checked?: boolean
          created_at?: string
          id?: string
          label: string
          position?: number
        }
        Update: {
          activity_id?: string
          checked?: boolean
          created_at?: string
          id?: string
          label?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "activity_items_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      children: {
        Row: {
          age: number | null
          color: string
          created_at: string
          household_id: string
          id: string
          name: string
        }
        Insert: {
          age?: number | null
          color?: string
          created_at?: string
          household_id: string
          id?: string
          name: string
        }
        Update: {
          age?: number | null
          color?: string
          created_at?: string
          household_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "children_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      family_members: {
        Row: {
          created_at: string
          email: string | null
          household_id: string
          id: string
          name: string
          role_label: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          household_id: string
          id?: string
          name: string
          role_label?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          household_id?: string
          id?: string
          name?: string
          role_label?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          read_at: string | null
          recipient_member_id: string
          request_id: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_member_id: string
          request_id: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_member_id?: string
          request_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_member_id_fkey"
            columns: ["recipient_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "reassignment_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      reassignment_requests: {
        Row: {
          acknowledged_at: string | null
          assignment_id: string
          created_at: string
          from_member_id: string
          id: string
          message: string | null
          requested_by_member_id: string
          responded_at: string | null
          status: string
          to_member_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          assignment_id: string
          created_at?: string
          from_member_id: string
          id?: string
          message?: string | null
          requested_by_member_id: string
          responded_at?: string | null
          status?: string
          to_member_id: string
        }
        Update: {
          acknowledged_at?: string | null
          assignment_id?: string
          created_at?: string
          from_member_id?: string
          id?: string
          message?: string | null
          requested_by_member_id?: string
          responded_at?: string | null
          status?: string
          to_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reassignment_requests_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "activity_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reassignment_requests_from_member_id_fkey"
            columns: ["from_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reassignment_requests_requested_by_member_id_fkey"
            columns: ["requested_by_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reassignment_requests_to_member_id_fkey"
            columns: ["to_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      acknowledge_decline: { Args: { _request: string }; Returns: undefined }
      activity_household: { Args: { _activity: string }; Returns: string }
      cancel_change: { Args: { _request: string }; Returns: undefined }
      create_household: {
        Args: { _me: string; _name: string }
        Returns: string
      }
      is_household_member: { Args: { _household: string }; Returns: boolean }
      link_me: { Args: never; Returns: string }
      request_change: {
        Args: { _assignment: string; _message?: string; _to: string }
        Returns: string
      }
      respond_change: {
        Args: { _accept: boolean; _request: string }
        Returns: undefined
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
