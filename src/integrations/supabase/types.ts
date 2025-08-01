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
      course_completion_reports: {
        Row: {
          certificate_url: string | null
          course_id: string
          created_at: string
          enrollment_id: string
          generated_at: string
          id: string
          instructor_id: string
          max_depth_achieved: number | null
          multimedia_urls: Json | null
          qr_code_url: string | null
          report_data: Json
          skills_assessment: Json | null
          student_id: string
          total_bottom_time: number | null
          total_dives: number | null
          updated_at: string
        }
        Insert: {
          certificate_url?: string | null
          course_id: string
          created_at?: string
          enrollment_id: string
          generated_at?: string
          id?: string
          instructor_id: string
          max_depth_achieved?: number | null
          multimedia_urls?: Json | null
          qr_code_url?: string | null
          report_data?: Json
          skills_assessment?: Json | null
          student_id: string
          total_bottom_time?: number | null
          total_dives?: number | null
          updated_at?: string
        }
        Update: {
          certificate_url?: string | null
          course_id?: string
          created_at?: string
          enrollment_id?: string
          generated_at?: string
          id?: string
          instructor_id?: string
          max_depth_achieved?: number | null
          multimedia_urls?: Json | null
          qr_code_url?: string | null
          report_data?: Json
          skills_assessment?: Json | null
          student_id?: string
          total_bottom_time?: number | null
          total_dives?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      course_enrollments: {
        Row: {
          certification_issued: boolean | null
          certification_number: string | null
          completion_date: string | null
          course_id: string
          created_at: string
          diving_center_id: string | null
          enrollment_status: string
          final_score: number | null
          id: string
          instructor_id: string
          progress_percentage: number | null
          report_generated: boolean | null
          report_sent_at: string | null
          skills_completed: Json | null
          start_date: string
          student_id: string
          updated_at: string
        }
        Insert: {
          certification_issued?: boolean | null
          certification_number?: string | null
          completion_date?: string | null
          course_id: string
          created_at?: string
          diving_center_id?: string | null
          enrollment_status?: string
          final_score?: number | null
          id?: string
          instructor_id: string
          progress_percentage?: number | null
          report_generated?: boolean | null
          report_sent_at?: string | null
          skills_completed?: Json | null
          start_date: string
          student_id: string
          updated_at?: string
        }
        Update: {
          certification_issued?: boolean | null
          certification_number?: string | null
          completion_date?: string | null
          course_id?: string
          created_at?: string
          diving_center_id?: string | null
          enrollment_status?: string
          final_score?: number | null
          id?: string
          instructor_id?: string
          progress_percentage?: number | null
          report_generated?: boolean | null
          report_sent_at?: string | null
          skills_completed?: Json | null
          start_date?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_diving_center_id_fkey"
            columns: ["diving_center_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_enrollments_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      courses: {
        Row: {
          active: boolean
          certification_agency: string
          code: string
          created_at: string
          description: string | null
          id: string
          max_depth_limit: number | null
          min_dives_required: number | null
          name: string
          practical_hours: number | null
          prerequisites: string[] | null
          price_cop: number | null
          theory_hours: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          certification_agency: string
          code: string
          created_at?: string
          description?: string | null
          id?: string
          max_depth_limit?: number | null
          min_dives_required?: number | null
          name: string
          practical_hours?: number | null
          prerequisites?: string[] | null
          price_cop?: number | null
          theory_hours?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          certification_agency?: string
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          max_depth_limit?: number | null
          min_dives_required?: number | null
          name?: string
          practical_hours?: number | null
          prerequisites?: string[] | null
          price_cop?: number | null
          theory_hours?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      dive_participants: {
        Row: {
          ballast_weight: number | null
          bottom_time: number | null
          created_at: string
          current_strength: number | null
          depth_achieved: number | null
          dive_id: string
          equipment_check: boolean | null
          gas_mix: string | null
          id: string
          images: string[] | null
          individual_notes: string | null
          instructor_id: string
          medical_check: boolean | null
          oxygen_amount: number | null
          performance_rating: number | null
          safety_stop_time: number | null
          skills_completed: Json | null
          student_id: string
          tank_pressure_end: number | null
          tank_pressure_start: number | null
          updated_at: string
          videos: string[] | null
          visibility_conditions: number | null
          water_temperature: number | null
          wetsuit_thickness: number | null
        }
        Insert: {
          ballast_weight?: number | null
          bottom_time?: number | null
          created_at?: string
          current_strength?: number | null
          depth_achieved?: number | null
          dive_id: string
          equipment_check?: boolean | null
          gas_mix?: string | null
          id?: string
          images?: string[] | null
          individual_notes?: string | null
          instructor_id: string
          medical_check?: boolean | null
          oxygen_amount?: number | null
          performance_rating?: number | null
          safety_stop_time?: number | null
          skills_completed?: Json | null
          student_id: string
          tank_pressure_end?: number | null
          tank_pressure_start?: number | null
          updated_at?: string
          videos?: string[] | null
          visibility_conditions?: number | null
          water_temperature?: number | null
          wetsuit_thickness?: number | null
        }
        Update: {
          ballast_weight?: number | null
          bottom_time?: number | null
          created_at?: string
          current_strength?: number | null
          depth_achieved?: number | null
          dive_id?: string
          equipment_check?: boolean | null
          gas_mix?: string | null
          id?: string
          images?: string[] | null
          individual_notes?: string | null
          instructor_id?: string
          medical_check?: boolean | null
          oxygen_amount?: number | null
          performance_rating?: number | null
          safety_stop_time?: number | null
          skills_completed?: Json | null
          student_id?: string
          tank_pressure_end?: number | null
          tank_pressure_start?: number | null
          updated_at?: string
          videos?: string[] | null
          visibility_conditions?: number | null
          water_temperature?: number | null
          wetsuit_thickness?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dive_participants_dive_id_fkey"
            columns: ["dive_id"]
            isOneToOne: false
            referencedRelation: "dives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dive_participants_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
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
          actual_participants: number | null
          bottom_time: number
          certification_level:
            | Database["public"]["Enums"]["dive_certification"]
            | null
          course_id: string | null
          created_at: string
          current_direction: string | null
          current_strength: number | null
          depth_achieved: number
          dive_date: string
          dive_site_id: string
          dive_time: string | null
          dive_type: Database["public"]["Enums"]["dive_type"]
          equipment_check: boolean | null
          equipment_type: string | null
          gas_mix: string | null
          id: string
          instructor_id: string
          max_participants: number | null
          medical_check: boolean | null
          notes: string | null
          photos: string[] | null
          sea_conditions: string | null
          surface_interval: number | null
          tank_pressure_end: number | null
          tank_pressure_start: number | null
          updated_at: string
          videos: string[] | null
          visibility: number | null
          water_temperature: number | null
          weather_conditions: string | null
          weight_used: number | null
          wetsuit_thickness: number | null
          wetsuit_type: string | null
        }
        Insert: {
          actual_participants?: number | null
          bottom_time: number
          certification_level?:
            | Database["public"]["Enums"]["dive_certification"]
            | null
          course_id?: string | null
          created_at?: string
          current_direction?: string | null
          current_strength?: number | null
          depth_achieved: number
          dive_date: string
          dive_site_id: string
          dive_time?: string | null
          dive_type?: Database["public"]["Enums"]["dive_type"]
          equipment_check?: boolean | null
          equipment_type?: string | null
          gas_mix?: string | null
          id?: string
          instructor_id: string
          max_participants?: number | null
          medical_check?: boolean | null
          notes?: string | null
          photos?: string[] | null
          sea_conditions?: string | null
          surface_interval?: number | null
          tank_pressure_end?: number | null
          tank_pressure_start?: number | null
          updated_at?: string
          videos?: string[] | null
          visibility?: number | null
          water_temperature?: number | null
          weather_conditions?: string | null
          weight_used?: number | null
          wetsuit_thickness?: number | null
          wetsuit_type?: string | null
        }
        Update: {
          actual_participants?: number | null
          bottom_time?: number
          certification_level?:
            | Database["public"]["Enums"]["dive_certification"]
            | null
          course_id?: string | null
          created_at?: string
          current_direction?: string | null
          current_strength?: number | null
          depth_achieved?: number
          dive_date?: string
          dive_site_id?: string
          dive_time?: string | null
          dive_type?: Database["public"]["Enums"]["dive_type"]
          equipment_check?: boolean | null
          equipment_type?: string | null
          gas_mix?: string | null
          id?: string
          instructor_id?: string
          max_participants?: number | null
          medical_check?: boolean | null
          notes?: string | null
          photos?: string[] | null
          sea_conditions?: string | null
          surface_interval?: number | null
          tank_pressure_end?: number | null
          tank_pressure_start?: number | null
          updated_at?: string
          videos?: string[] | null
          visibility?: number | null
          water_temperature?: number | null
          weather_conditions?: string | null
          weight_used?: number | null
          wetsuit_thickness?: number | null
          wetsuit_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dives_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
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
        ]
      }
      diving_center_schedules: {
        Row: {
          close_time: string | null
          created_at: string
          day_of_week: number
          diving_center_id: string
          id: string
          is_closed: boolean
          open_time: string | null
          updated_at: string
        }
        Insert: {
          close_time?: string | null
          created_at?: string
          day_of_week: number
          diving_center_id: string
          id?: string
          is_closed?: boolean
          open_time?: string | null
          updated_at?: string
        }
        Update: {
          close_time?: string | null
          created_at?: string
          day_of_week?: number
          diving_center_id?: string
          id?: string
          is_closed?: boolean
          open_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_diving_center_schedule"
            columns: ["diving_center_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      diving_center_specialties: {
        Row: {
          active: boolean
          certification_agency: string
          created_at: string
          diving_center_id: string
          id: string
          specialty_name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          certification_agency: string
          created_at?: string
          diving_center_id: string
          id?: string
          specialty_name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          certification_agency?: string
          created_at?: string
          diving_center_id?: string
          id?: string
          specialty_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_diving_center"
            columns: ["diving_center_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      equipment_inventory: {
        Row: {
          brand: string | null
          condition_rating: number | null
          created_at: string
          diving_center_id: string
          equipment_type_id: string
          id: string
          last_service_date: string | null
          model: string | null
          next_service_due: string | null
          notes: string | null
          photo_url: string | null
          purchase_date: string | null
          serial_number: string | null
          status: string
          updated_at: string
        }
        Insert: {
          brand?: string | null
          condition_rating?: number | null
          created_at?: string
          diving_center_id: string
          equipment_type_id: string
          id?: string
          last_service_date?: string | null
          model?: string | null
          next_service_due?: string | null
          notes?: string | null
          photo_url?: string | null
          purchase_date?: string | null
          serial_number?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          brand?: string | null
          condition_rating?: number | null
          created_at?: string
          diving_center_id?: string
          equipment_type_id?: string
          id?: string
          last_service_date?: string | null
          model?: string | null
          next_service_due?: string | null
          notes?: string | null
          photo_url?: string | null
          purchase_date?: string | null
          serial_number?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      equipment_types: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      equipment_usage: {
        Row: {
          condition_after: number | null
          condition_before: number | null
          created_at: string
          dive_id: string
          equipment_id: string
          id: string
          issues_reported: string | null
          updated_at: string
        }
        Insert: {
          condition_after?: number | null
          condition_before?: number | null
          created_at?: string
          dive_id: string
          equipment_id: string
          id?: string
          issues_reported?: string | null
          updated_at?: string
        }
        Update: {
          condition_after?: number | null
          condition_before?: number | null
          created_at?: string
          dive_id?: string
          equipment_id?: string
          id?: string
          issues_reported?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      instructor_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          assignment_status: string
          created_at: string
          diving_center_id: string
          id: string
          instructor_id: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          assignment_status?: string
          created_at?: string
          diving_center_id: string
          id?: string
          instructor_id: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          assignment_status?: string
          created_at?: string
          diving_center_id?: string
          id?: string
          instructor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "instructor_assignments_diving_center_id_fkey"
            columns: ["diving_center_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "instructor_assignments_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      instructor_students: {
        Row: {
          created_at: string
          id: string
          instructor_id: string
          invited_at: string
          notes: string | null
          status: string
          student_email: string
          student_id: string | null
          student_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          instructor_id: string
          invited_at?: string
          notes?: string | null
          status?: string
          student_email: string
          student_id?: string | null
          student_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          instructor_id?: string
          invited_at?: string
          notes?: string | null
          status?: string
          student_email?: string
          student_id?: string | null
          student_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      instructor_verifications: {
        Row: {
          certification_agency: string
          certification_document_url: string | null
          certification_level: string
          certification_number: string | null
          created_at: string
          expiration_date: string | null
          id: string
          instructor_id: string
          notes: string | null
          updated_at: string
          verification_status: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          certification_agency: string
          certification_document_url?: string | null
          certification_level: string
          certification_number?: string | null
          created_at?: string
          expiration_date?: string | null
          id?: string
          instructor_id: string
          notes?: string | null
          updated_at?: string
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          certification_agency?: string
          certification_document_url?: string | null
          certification_level?: string
          certification_number?: string | null
          created_at?: string
          expiration_date?: string | null
          id?: string
          instructor_id?: string
          notes?: string | null
          updated_at?: string
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instructor_verifications_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "instructor_verifications_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      maintenance_logs: {
        Row: {
          cost_cop: number | null
          created_at: string
          description: string
          equipment_id: string
          id: string
          maintenance_photos: string[] | null
          maintenance_type: string
          next_maintenance_due: string | null
          performed_at: string
          performed_by: string
          updated_at: string
        }
        Insert: {
          cost_cop?: number | null
          created_at?: string
          description: string
          equipment_id: string
          id?: string
          maintenance_photos?: string[] | null
          maintenance_type: string
          next_maintenance_due?: string | null
          performed_at?: string
          performed_by: string
          updated_at?: string
        }
        Update: {
          cost_cop?: number | null
          created_at?: string
          description?: string
          equipment_id?: string
          id?: string
          maintenance_photos?: string[] | null
          maintenance_type?: string
          next_maintenance_due?: string | null
          performed_at?: string
          performed_by?: string
          updated_at?: string
        }
        Relationships: []
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
          address: string | null
          business_license: string | null
          business_name: string | null
          certification_agency: string | null
          certification_level: string | null
          city: string | null
          country: string | null
          created_at: string
          description: string | null
          email: string
          experience_years: number | null
          first_name: string | null
          id: string
          last_name: string | null
          max_students_per_instructor: number | null
          operating_hours: Json | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          services_offered: string[] | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          business_license?: string | null
          business_name?: string | null
          certification_agency?: string | null
          certification_level?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          email: string
          experience_years?: number | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          max_students_per_instructor?: number | null
          operating_hours?: Json | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          services_offered?: string[] | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          business_license?: string | null
          business_name?: string | null
          certification_agency?: string | null
          certification_level?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          email?: string
          experience_years?: number | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          max_students_per_instructor?: number | null
          operating_hours?: Json | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          services_offered?: string[] | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      report_templates: {
        Row: {
          certification_agency: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          name: string
          template_data: Json
          updated_at: string
        }
        Insert: {
          certification_agency: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name: string
          template_data?: Json
          updated_at?: string
        }
        Update: {
          certification_agency?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          template_data?: Json
          updated_at?: string
        }
        Relationships: []
      }
      student_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          instructor_id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          instructor_id: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          instructor_id?: string
          token?: string
          used_at?: string | null
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
