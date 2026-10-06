export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      billing_payments: {
        Row: {
          amount_in_cents: number;
          created_at: string;
          currency: string;
          id: string;
          metadata: Json;
          paid_at: string | null;
          plan_id: string;
          provider: string;
          provider_reference: string;
          provider_transaction_id: string | null;
          status: Database["public"]["Enums"]["billing_payment_status"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount_in_cents: number;
          created_at?: string;
          currency: string;
          id?: string;
          metadata?: Json;
          paid_at?: string | null;
          plan_id: string;
          provider?: string;
          provider_reference: string;
          provider_transaction_id?: string | null;
          status?: Database["public"]["Enums"]["billing_payment_status"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount_in_cents?: number;
          created_at?: string;
          currency?: string;
          id?: string;
          metadata?: Json;
          paid_at?: string | null;
          plan_id?: string;
          provider?: string;
          provider_reference?: string;
          provider_transaction_id?: string | null;
          status?: Database["public"]["Enums"]["billing_payment_status"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      billing_webhook_events: {
        Row: {
          created_at: string;
          event_hash: string;
          event_id: string | null;
          event_type: string | null;
          id: string;
          payload: Json;
          processed: boolean;
          processed_at: string | null;
          provider: string;
        };
        Insert: {
          created_at?: string;
          event_hash: string;
          event_id?: string | null;
          event_type?: string | null;
          id?: string;
          payload: Json;
          processed?: boolean;
          processed_at?: string | null;
          provider?: string;
        };
        Update: {
          created_at?: string;
          event_hash?: string;
          event_id?: string | null;
          event_type?: string | null;
          id?: string;
          payload?: Json;
          processed?: boolean;
          processed_at?: string | null;
          provider?: string;
        };
        Relationships: [];
      };
      user_books: {
        Row: {
          content: Json | null;
          creationTime: string;
          id: string;
          owner_id: string | null;
          title: string | null;
        };
        Insert: {
          content?: Json | null;
          creationTime: string;
          id?: string;
          owner_id?: string | null;
          title?: string | null;
        };
        Update: {
          content?: Json | null;
          creationTime?: string;
          id?: string;
          owner_id?: string | null;
          title?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_books_owner_bookid_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "user_profile";
            referencedColumns: ["book_id"];
          },
        ];
      };
      user_memberships: {
        Row: {
          auto_renew: boolean;
          canceled_at: string | null;
          created_at: string;
          ends_at: string | null;
          provider: string | null;
          provider_subscription_id: string | null;
          starts_at: string;
          status: Database["public"]["Enums"]["membership_status"];
          tier: Database["public"]["Enums"]["membership_tier"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          auto_renew?: boolean;
          canceled_at?: string | null;
          created_at?: string;
          ends_at?: string | null;
          provider?: string | null;
          provider_subscription_id?: string | null;
          starts_at?: string;
          status?: Database["public"]["Enums"]["membership_status"];
          tier?: Database["public"]["Enums"]["membership_tier"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          auto_renew?: boolean;
          canceled_at?: string | null;
          created_at?: string;
          ends_at?: string | null;
          provider?: string | null;
          provider_subscription_id?: string | null;
          starts_at?: string;
          status?: Database["public"]["Enums"]["membership_status"];
          tier?: Database["public"]["Enums"]["membership_tier"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_profile: {
        Row: {
          book_id: string | null;
          id: string;
          name: string | null;
        };
        Insert: {
          book_id?: string | null;
          id?: string;
          name?: string | null;
        };
        Update: {
          book_id?: string | null;
          id?: string;
          name?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      expire_user_memberships: { Args: never; Returns: number };
      get_user_books_page_preview: {
        Args: { p_from: number; p_search_query?: string; p_to: number };
        Returns: {
          content: Json;
          creationTime: string;
          id: string;
          owner_id: string;
          title: string;
          total_count: number;
        }[];
      };
      show_limit: { Args: never; Returns: number };
      show_trgm: { Args: { "": string }; Returns: string[] };
    };
    Enums: {
      billing_payment_status: "pending" | "approved" | "declined" | "voided" | "error";
      membership_status: "active" | "trialing" | "past_due" | "canceled" | "expired" | "suspended";
      membership_tier: "free" | "member" | "admin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      billing_payment_status: ["pending", "approved", "declined", "voided", "error"],
      membership_status: ["active", "trialing", "past_due", "canceled", "expired", "suspended"],
      membership_tier: ["free", "member", "admin"],
    },
  },
} as const;
