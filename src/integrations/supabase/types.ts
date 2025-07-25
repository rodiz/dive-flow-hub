export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      dive_sites: {
        Row: {
          created_at: string
          description: string | null
          difficulty_level: number | null
          id: string
          location: string
          max_depth: number
          name: string
          updated_at: string
          visibility: number | null
          water_temperature: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty_level?: number | null
          id?: string
          location: string
          max_depth: number
          name: string
          updated_at?: string
          visibility?: number | null
          water_temperature?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty_level?: number | null
          id?: string
          location?: string
          max_depth?: number
          name?: string
          updated_at?: string
          visibility?: number | null
          water_temperature?: number | null
        }
        Relationships: []
      }
      dives: {
        Row: {
          bottom_time: number
          certification_level:
            | Database["public"]["Enums"]["dive_certification"]
            | null
          created_at: string
          depth_achieved: number
          dive_date: string
          dive_site_id: string
          dive_time: string | null
          dive_type: Database["public"]["Enums"]["dive_type"]
          equipment_check: boolean | null
          id: string
          instructor_id: string
          medical_check: boolean | null
          notes: string | null
          student_id: string
          surface_interval: number | null
          updated_at: string
          visibility: number | null
          water_temperature: number | null
        }
        Insert: {
          bottom_time: number
          certification_level?:
            | Database["public"]["Enums"]["dive_certification"]
            | null
          created_at?: string
          depth_achieved: number
          dive_date: string
          dive_site_id: string
          dive_time?: string | null
          dive_type?: Database["public"]["Enums"]["dive_type"]
          equipment_check?: boolean | null
          id?: string
          instructor_id: string
          medical_check?: boolean | null
          notes?: string | null
          student_id: string
          surface_interval?: number | null
          updated_at?: string
          visibility?: number | null
          water_temperature?: number | null
        }
        Update: {
          bottom_time?: number
          certification_level?:
            | Database["public"]["Enums"]["dive_certification"]
            | null
          created_at?: string
          depth_achieved?: number
          dive_date?: string
          dive_site_id?: string
          dive_time?: string | null
          dive_type?: Database["public"]["Enums"]["dive_type"]
          equipment_check?: boolean | null
          id?: string
          instructor_id?: string
          medical_check?: boolean | null
          notes?: string | null
          student_id?: string
          surface_interval?: number | null
          updated_at?: string
          visibility?: number | null
          water_temperature?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dives_dive_site_id_fkey"
            columns: ["dive_site_id"]
            isOneToOne: false
            referencedRelation: "dive_sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dives_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "dives_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      medical_records: {
        Row: {
          allergies: string | null
          blood_pressure_diastolic: number | null
          blood_pressure_systolic: number | null
          cleared_to_dive: boolean | null
          created_at: string
          dive_id: string | null
          fitness_level: number | null
          heart_rate: number | null
          height: number | null
          id: string
          instructor_id: string
          medical_conditions: string | null
          medications: string | null
          notes: string | null
          recorded_at: string
          student_id: string
          updated_at: string
          weight: number | null
        }
        Insert: {
          allergies?: string | null
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          cleared_to_dive?: boolean | null
          created_at?: string
          dive_id?: string | null
          fitness_level?: number | null
          heart_rate?: number | null
          height?: number | null
          id?: string
          instructor_id: string
          medical_conditions?: string | null
          medications?: string | null
          notes?: string | null
          recorded_at?: string
          student_id: string
          updated_at?: string
          weight?: number | null
        }
        Update: {
          allergies?: string | null
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          cleared_to_dive?: boolean | null
          created_at?: string
          dive_id?: string | null
          fitness_level?: number | null
          heart_rate?: number | null
          height?: number | null
          id?: string
          instructor_id?: string
          medical_conditions?: string | null
          medications?: string | null
          notes?: string | null
          recorded_at?: string
          student_id?: string
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_records_dive_id_fkey"
            columns: ["dive_id"]
            isOneToOne: false
            referencedRelation: "dives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "medical_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          certification_agency: string | null
          certification_level: string | null
          created_at: string
          email: string
          experience_years: number | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          certification_agency?: string | null
          certification_level?: string | null
          created_at?: string
          email: string
          experience_years?: number | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          certification_agency?: string | null
          certification_level?: string | null
          created_at?: string
          email?: string
          experience_years?: number | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          interval_days: number
          name: string
          price_cop: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          interval_days?: number
          name: string
          price_cop: number
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          interval_days?: number
          name?: string
          price_cop?: number
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          plan_id: string
          starts_at: string
          status: string
          updated_at: string
          user_id: string | null
          wompi_transaction_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          plan_id: string
          starts_at?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          wompi_transaction_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          plan_id?: string
          starts_at?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          wompi_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_active_subscription: {
        Args: { user_email: string }
        Returns: boolean
      }
    }
    Enums: {
      dive_certification:
        | "open_water"
        | "advanced"
        | "rescue"
        | "divemaster"
        | "instructor"
      dive_type: "training" | "fun" | "certification" | "specialty"
      user_role: "instructor" | "student" | "diving_center"
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
      dive_certification: [
        "open_water",
        "advanced",
        "rescue",
        "divemaster",
        "instructor",
      ],
      dive_type: ["training", "fun", "certification", "specialty"],
      user_role: ["instructor", "student", "diving_center"],
    },
  },
} as const
