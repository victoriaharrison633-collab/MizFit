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
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
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
      meal_plan_days: {
        Row: {
          approved_at: string | null
          breakfast: Json
          created_at: string
          day_index: number
          day_macro_type: Database["public"]["Enums"]["day_macro_type"]
          id: string
          lunch: Json
          macro_targets: Json
          meal_plan_id: string
          regenerated_count: number
          selected_supper_index: number | null
          snack: Json
          supper_options: Json
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          breakfast: Json
          created_at?: string
          day_index: number
          day_macro_type: Database["public"]["Enums"]["day_macro_type"]
          id?: string
          lunch: Json
          macro_targets: Json
          meal_plan_id: string
          regenerated_count?: number
          selected_supper_index?: number | null
          snack: Json
          supper_options: Json
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          breakfast?: Json
          created_at?: string
          day_index?: number
          day_macro_type?: Database["public"]["Enums"]["day_macro_type"]
          id?: string
          lunch?: Json
          macro_targets?: Json
          meal_plan_id?: string
          regenerated_count?: number
          selected_supper_index?: number | null
          snack?: Json
          supper_options?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_plan_days_meal_plan_id_fkey"
            columns: ["meal_plan_id"]
            isOneToOne: false
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plans: {
        Row: {
          calorie_target: number
          created_at: string
          created_by: string
          cuisine_preferences: string[]
          diet_methodology: Database["public"]["Enums"]["diet_methodology"]
          error_message: string | null
          generation_source: string
          id: string
          model_id: string | null
          schema_version: number
          servings_per_meal: number
          status: Database["public"]["Enums"]["meal_plan_status"]
          updated_at: string
          week_start_date: string
          workspace_id: string
        }
        Insert: {
          calorie_target: number
          created_at?: string
          created_by: string
          cuisine_preferences?: string[]
          diet_methodology: Database["public"]["Enums"]["diet_methodology"]
          error_message?: string | null
          generation_source: string
          id?: string
          model_id?: string | null
          schema_version?: number
          servings_per_meal: number
          status?: Database["public"]["Enums"]["meal_plan_status"]
          updated_at?: string
          week_start_date: string
          workspace_id: string
        }
        Update: {
          calorie_target?: number
          created_at?: string
          created_by?: string
          cuisine_preferences?: string[]
          diet_methodology?: Database["public"]["Enums"]["diet_methodology"]
          error_message?: string | null
          generation_source?: string
          id?: string
          model_id?: string | null
          schema_version?: number
          servings_per_meal?: number
          status?: Database["public"]["Enums"]["meal_plan_status"]
          updated_at?: string
          week_start_date?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_plans_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      pantry_items: {
        Row: {
          created_at: string
          expiry_date: string | null
          id: string
          is_frozen: boolean
          name: string
          quantity: number
          source: string
          unit: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          expiry_date?: string | null
          id?: string
          is_frozen?: boolean
          name: string
          quantity: number
          source?: string
          unit: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          expiry_date?: string | null
          id?: string
          is_frozen?: boolean
          name?: string
          quantity?: number
          source?: string
          unit?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pantry_items_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activity_level: Database["public"]["Enums"]["activity_level"] | null
          age: number | null
          biological_sex: Database["public"]["Enums"]["profile_sex"] | null
          calorie_target: number | null
          created_at: string
          current_weight_lbs: number | null
          daily_deficit: number | null
          diet_methodology:
            | Database["public"]["Enums"]["diet_methodology"]
            | null
          dietary_exclusions: string[]
          display_name: string | null
          estimated_completion_date: string | null
          goal_weight_lbs: number | null
          height_cm: number | null
          onboarding_step: string | null
          servings_per_meal: number
          target_date: string | null
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          activity_level?: Database["public"]["Enums"]["activity_level"] | null
          age?: number | null
          biological_sex?: Database["public"]["Enums"]["profile_sex"] | null
          calorie_target?: number | null
          created_at?: string
          current_weight_lbs?: number | null
          daily_deficit?: number | null
          diet_methodology?:
            | Database["public"]["Enums"]["diet_methodology"]
            | null
          dietary_exclusions?: string[]
          display_name?: string | null
          estimated_completion_date?: string | null
          goal_weight_lbs?: number | null
          height_cm?: number | null
          onboarding_step?: string | null
          servings_per_meal?: number
          target_date?: string | null
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          activity_level?: Database["public"]["Enums"]["activity_level"] | null
          age?: number | null
          biological_sex?: Database["public"]["Enums"]["profile_sex"] | null
          calorie_target?: number | null
          created_at?: string
          current_weight_lbs?: number | null
          daily_deficit?: number | null
          diet_methodology?:
            | Database["public"]["Enums"]["diet_methodology"]
            | null
          dietary_exclusions?: string[]
          display_name?: string | null
          estimated_completion_date?: string | null
          goal_weight_lbs?: number | null
          height_cm?: number | null
          onboarding_step?: string | null
          servings_per_meal?: number
          target_date?: string | null
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: Database["public"]["Enums"]["plan_tier"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["plan_tier"]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["plan_tier"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_meal_plan: {
        Args: { p_meal_plan_id: string }
        Returns: boolean
      }
      is_workspace_member: {
        Args: { p_workspace_id: string }
        Returns: boolean
      }
      is_workspace_owner: { Args: { p_workspace_id: string }; Returns: boolean }
      seed_baseline_pantry: {
        Args: { p_workspace_id: string }
        Returns: number
      }
    }
    Enums: {
      activity_level:
        | "sedentary"
        | "lightly_active"
        | "moderately_active"
        | "very_active"
        | "extra_active"
      day_macro_type: "high" | "mid" | "low" | "fixed"
      diet_methodology:
        | "carb_cycling"
        | "high_protein"
        | "vegetarian"
        | "pescatarian"
      meal_plan_status: "generating" | "ready" | "failed"
      plan_tier: "free" | "pro" | "elite"
      profile_sex: "male" | "female" | "prefer_not_to_say"
      subscription_status: "trialing" | "active" | "past_due" | "canceled"
      workspace_role: "owner" | "member"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      activity_level: [
        "sedentary",
        "lightly_active",
        "moderately_active",
        "very_active",
        "extra_active",
      ],
      day_macro_type: ["high", "mid", "low", "fixed"],
      diet_methodology: [
        "carb_cycling",
        "high_protein",
        "vegetarian",
        "pescatarian",
      ],
      meal_plan_status: ["generating", "ready", "failed"],
      plan_tier: ["free", "pro", "elite"],
      profile_sex: ["male", "female", "prefer_not_to_say"],
      subscription_status: ["trialing", "active", "past_due", "canceled"],
      workspace_role: ["owner", "member"],
    },
  },
} as const

