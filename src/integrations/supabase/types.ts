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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          alert_type: string
          batch_id: string
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          message: string
          resolved: boolean
          risk_score: number | null
          severity: string
        }
        Insert: {
          alert_type: string
          batch_id: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          message: string
          resolved?: boolean
          risk_score?: number | null
          severity?: string
        }
        Update: {
          alert_type?: string
          batch_id?: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          message?: string
          resolved?: boolean
          risk_score?: number | null
          severity?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_wallet: string | null
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_wallet?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_wallet?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      batches: {
        Row: {
          batch_hash: string
          batch_id: string
          blockchain_tx_hash: string | null
          country_of_origin: string | null
          created_at: string
          dosage: string | null
          expiry_date: string | null
          id: string
          image_url: string | null
          manufacturer_name: string
          manufacturing_date: string | null
          medicine_name: string | null
          recalled_at: string | null
          recalled_by: string | null
          registered_by: string | null
          status: Database["public"]["Enums"]["batch_status"]
          storage_conditions: string | null
        }
        Insert: {
          batch_hash: string
          batch_id: string
          blockchain_tx_hash?: string | null
          country_of_origin?: string | null
          created_at?: string
          dosage?: string | null
          expiry_date?: string | null
          id?: string
          image_url?: string | null
          manufacturer_name: string
          manufacturing_date?: string | null
          medicine_name?: string | null
          recalled_at?: string | null
          recalled_by?: string | null
          registered_by?: string | null
          status?: Database["public"]["Enums"]["batch_status"]
          storage_conditions?: string | null
        }
        Update: {
          batch_hash?: string
          batch_id?: string
          blockchain_tx_hash?: string | null
          country_of_origin?: string | null
          created_at?: string
          dosage?: string | null
          expiry_date?: string | null
          id?: string
          image_url?: string | null
          manufacturer_name?: string
          manufacturing_date?: string | null
          medicine_name?: string | null
          recalled_at?: string | null
          recalled_by?: string | null
          registered_by?: string | null
          status?: Database["public"]["Enums"]["batch_status"]
          storage_conditions?: string | null
        }
        Relationships: []
      }
      consumer_reports: {
        Row: {
          batch_id: string
          created_at: string
          description: string | null
          id: string
          photo_url: string | null
          report_type: string
          reporter_id: string | null
          status: string
        }
        Insert: {
          batch_id: string
          created_at?: string
          description?: string | null
          id?: string
          photo_url?: string | null
          report_type?: string
          reporter_id?: string | null
          status?: string
        }
        Update: {
          batch_id?: string
          created_at?: string
          description?: string | null
          id?: string
          photo_url?: string | null
          report_type?: string
          reporter_id?: string | null
          status?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          organization: string | null
          updated_at: string
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          organization?: string | null
          updated_at?: string
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          organization?: string | null
          updated_at?: string
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      scan_logs: {
        Row: {
          anomaly_flags: Json | null
          batch_id: string
          id: string
          latitude: number | null
          longitude: number | null
          scanned_at: string
          scanner_user_id: string | null
          verification_status: string
        }
        Insert: {
          anomaly_flags?: Json | null
          batch_id: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          scanned_at?: string
          scanner_user_id?: string | null
          verification_status: string
        }
        Update: {
          anomaly_flags?: Json | null
          batch_id?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          scanned_at?: string
          scanner_user_id?: string | null
          verification_status?: string
        }
        Relationships: []
      }
      supply_chain_events: {
        Row: {
          actor_id: string | null
          batch_id: string
          created_at: string
          event_type: string
          from_wallet: string | null
          id: string
          location: string | null
          notes: string | null
          to_wallet: string | null
        }
        Insert: {
          actor_id?: string | null
          batch_id: string
          created_at?: string
          event_type: string
          from_wallet?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          to_wallet?: string | null
        }
        Update: {
          actor_id?: string | null
          batch_id?: string
          created_at?: string
          event_type?: string
          from_wallet?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          to_wallet?: string | null
        }
        Relationships: []
      }
      trust_scores: {
        Row: {
          complaint_count: number
          id: string
          manufacturer_id: string
          manufacturer_name: string
          score: number
          suspicious_count: number
          total_batches: number
          updated_at: string
          verified_count: number
        }
        Insert: {
          complaint_count?: number
          id?: string
          manufacturer_id: string
          manufacturer_name: string
          score?: number
          suspicious_count?: number
          total_batches?: number
          updated_at?: string
          verified_count?: number
        }
        Update: {
          complaint_count?: number
          id?: string
          manufacturer_id?: string
          manufacturer_name?: string
          score?: number
          suspicious_count?: number
          total_batches?: number
          updated_at?: string
          verified_count?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "manufacturer"
        | "pharmacy"
        | "regulator"
        | "distributor"
        | "auditor"
        | "consumer"
      batch_status: "active" | "sold" | "recalled" | "expired"
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
      app_role: [
        "manufacturer",
        "pharmacy",
        "regulator",
        "distributor",
        "auditor",
        "consumer",
      ],
      batch_status: ["active", "sold", "recalled", "expired"],
    },
  },
} as const
