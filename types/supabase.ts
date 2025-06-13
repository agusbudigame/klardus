export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      cardboard_prices: {
        Row: {
          condition: string
          created_at: string
          id: string
          is_active: boolean
          price_per_kg: number
          type: string
          collector_id: string | null
        }
        Insert: {
          condition: string
          created_at?: string
          id?: string
          is_active?: boolean
          price_per_kg: number
          type: string
          collector_id?: string | null
        }
        Update: {
          condition?: string
          created_at?: string
          id?: string
          is_active?: boolean
          price_per_kg?: number
          type?: string
          collector_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cardboard_prices_collector_id_fkey"
            columns: ["collector_id"]
            referencedTable: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cardboard_submissions: {
        Row: {
          condition: string | null
          created_at: string
          customer_id: string | null
          estimated_price: number
          id: string
          notes: string | null
          photo_urls: string[] | null
          priority: string | null
          scheduled_collector_id: string | null
          scheduled_pickup_date: string | null
          status: string | null
          type: string
          weight: number
          completed_at: string | null
        }
        Insert: {
          condition?: string | null
          created_at?: string
          customer_id?: string | null
          estimated_price: number
          id?: string
          notes?: string | null
          photo_urls?: string[] | null
          priority?: string | null
          scheduled_collector_id?: string | null
          scheduled_pickup_date?: string | null
          status?: string | null
          type: string
          weight: number
          completed_at?: string | null
        }
        Update: {
          condition?: string | null
          created_at?: string
          customer_id?: string | null
          estimated_price?: number
          id?: string
          notes?: string | null
          photo_urls?: string[] | null
          priority?: string | null
          scheduled_collector_id?: string | null
          scheduled_pickup_date?: string | null
          status?: string | null
          type?: string
          weight?: number
          completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cardboard_submissions_customer_id_fkey"
            columns: ["customer_id"]
            referencedTable: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cardboard_submissions_scheduled_collector_id_fkey"
            columns: ["scheduled_collector_id"]
            referencedTable: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_routes: {
        Row: {
          created_at: string
          id: string
          name: string | null
          collector_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          collector_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          collector_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_routes_collector_id_fkey"
            columns: ["collector_id"]
            referencedTable: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          acquired_date: string | null
          condition: string | null
          created_at: string
          id: string
          notes: string | null
          price_per_kg: number | null
          source: string | null
          status: string | null
          type: string | null
          weight: number | null
          collector_id: string | null
        }
        Insert: {
          acquired_date?: string | null
          condition?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          price_per_kg?: number | null
          source?: string | null
          status?: string | null
          type?: string | null
          weight?: number | null
          collector_id?: string | null
        }
        Update: {
          acquired_date?: string | null
          condition?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          price_per_kg?: number | null
          source?: string | null
          status?: string | null
          type?: string | null
          weight?: number | null
          collector_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_collector_id_fkey"
            columns: ["collector_id"]
            referencedTable: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string | null
          read: boolean | null
          related_id: string | null
          title: string | null
          type: string | null
          user_id: string | null
          action_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          read?: boolean | null
          related_id?: string | null
          title?: string | null
          type?: string | null
          user_id?: string | null
          action_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          read?: boolean | null
          related_id?: string | null
          title?: string | null
          type?: string | null
          user_id?: string | null
          action_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            referencedTable: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      price_history: {
        Row: {
          created_at: string
          id: string
          price_per_kg: number | null
          type: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          price_per_kg?: number | null
          type?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          price_per_kg?: number | null
          type?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          company_name: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string | null
          user_type: string | null
          operational_area: string | null
          vehicle_type: string | null
        }
        Insert: {
          address?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string | null
          user_type?: string | null
          operational_area?: string | null
          vehicle_type?: string | null
        }
        Update: {
          address?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
          user_type?: string | null
          operational_area?: string | null
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedTable: "auth.users"
            referencedColumns: ["id"]
          },
        ]
      }
      route_stops: {
        Row: {
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          route_id: string | null
          stop_address: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          route_id?: string | null
          stop_address?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          route_id?: string | null
          stop_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "route_stops_route_id_fkey"
            columns: ["route_id"]
            referencedTable: "collection_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_locations: {
        Row: {
          address: string | null
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          pickup_instructions: string | null
          submission_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          pickup_instructions?: string | null
          submission_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          pickup_instructions?: string | null
          submission_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submission_locations_submission_id_fkey"
            columns: ["submission_id"]
            referencedTable: "cardboard_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_photos: {
        Row: {
          created_at: string
          id: string
          photo_url: string | null
          submission_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          photo_url?: string | null
          submission_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          photo_url?: string | null
          submission_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submission_photos_submission_id_fkey"
            columns: ["submission_id"]
            referencedTable: "cardboard_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number | null
          created_at: string
          customer_id: string | null
          id: string
          notes: string | null
          payment_status: string | null
          submission_id: string | null
          collector_id: string | null
          type: string | null
          weight: number | null
          price_per_kg: number | null
          transaction_date: string | null
          pickup_location: string | null
          customer_notes: string | null
          collector_notes: string | null
          photo_urls: string[] | null
          estimated_value: number | null
          actual_value: number | null
          receipt_number: string | null
          invoice_generated: boolean | null
          invoice_date: string | null
          payment_terms: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          customer_id?: string | null
          id?: string
          notes?: string | null
          payment_status?: string | null
          submission_id?: string | null
          collector_id?: string | null
          type?: string | null
          weight?: number | null
          price_per_kg?: number | null
          transaction_date?: string | null
          pickup_location?: string | null
          customer_notes?: string | null
          collector_notes?: string | null
          photo_urls?: string[] | null
          estimated_value?: number | null
          actual_value?: number | null
          receipt_number?: string | null
          invoice_generated?: boolean | null
          invoice_date?: string | null
          payment_terms?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          customer_id?: string | null
          id?: string
          notes?: string | null
          payment_status?: string | null
          submission_id?: string | null
          collector_id?: string | null
          type?: string | null
          weight?: number | null
          price_per_kg?: number | null
          transaction_date?: string | null
          pickup_location?: string | null
          customer_notes?: string | null
          collector_notes?: string | null
          photo_urls?: string[] | null
          estimated_value?: number | null
          actual_value?: number | null
          receipt_number?: string | null
          invoice_generated?: boolean | null
          invoice_date?: string | null
          payment_terms?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_collector_id_fkey"
            columns: ["collector_id"]
            referencedTable: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            referencedTable: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_submission_id_fkey"
            columns: ["submission_id"]
            referencedTable: "cardboard_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          created_at: string
          id: string
          theme: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          theme?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          theme?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            referencedTable: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      _inner_invoice_data: {
        Row: {
          actual_value: number | null
          address: string | null
          amount: number | null
          collector_email: string | null
          collector_id: string | null
          collector_name: string | null
          collector_phone: string | null
          condition: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          customer_notes: string | null
          customer_phone: string | null
          estimated_value: number | null
          id: string | null
          invoice_date: string | null
          invoice_generated: boolean | null
          latitude: number | null
          longitude: number | null
          notes: string | null
          payment_status: string | null
          payment_terms: string | null
          photo_urls: string[] | null
          pickup_location: string | null
          price_per_kg: number | null
          receipt_number: string | null
          submission_id: string | null
          transaction_date: string | null
          type: string | null
          weight: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_collector_id_fkey"
            columns: ["collector_id"]
            referencedTable: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            referencedTable: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_submission_id_fkey"
            columns: ["submission_id"]
            referencedTable: "cardboard_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      collector_inventory_stats: {
        Row: {
          avg_quality_grade: number | null
          collector_id: string | null
          items_in_stock: number | null
          items_sold: number | null
          oldest_item_date: string | null
          total_items: number | null
          total_investment: number | null
          total_weight: number | null
          estimated_value: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_collector_id_fkey"
            columns: ["collector_id"]
            referencedTable: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      collector_transaction_stats: {
        Row: {
          avg_purchase_price: number | null
          collector_id: string | null
          completed_transactions: number | null
          last_transaction: string | null
          total_spent: number | null
          total_transactions: number | null
          total_weight_purchased: number | null
          unique_customers: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_collector_id_fkey"
            columns: ["collector_id"]
            referencedTable: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            referencedTable: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_submission_id_fkey"
            columns: ["submission_id"]
            referencedTable: "cardboard_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_transaction_stats: {
        Row: {
          avg_price_per_kg: number | null
          completed_transactions: number | null
          customer_id: string | null
          last_transaction: string | null
          pending_transactions: number | null
          total_amount: number | null
          total_transactions: number | null
          total_weight: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_collector_id_fkey"
            columns: ["collector_id"]
            referencedTable: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            referencedTable: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_submission_id_fkey"
            columns: ["submission_id"]
            referencedTable: "cardboard_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_transaction_summary: {
        Row: {
          active_collectors: number | null
          avg_price_per_kg: number | null
          transaction_count: number | null
          transaction_date: string | null
          total_amount: number | null
          total_weight: number | null
          unique_customers: number | null
        }
        Relationships: []
      }
      potential_role_issues: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          price_entries: number | null
          submission_count: number | null
          user_type: string | null
        }
        Relationships: []
      }
      suggest_role_fixes: {
        Row: {
          current_role: string | null
          reason: string | null
          suggested_role: string | null
          user_id: string | null
          user_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_inventory_value: {
        Args: {
          collector_uuid: string
        }
        Returns: {
          total_items: number
          total_weight: number
          estimated_value: number
          by_type: Json
        }
      }
      fix_user_role: {
        Args: {
          target_user_id: string
          desired_role: string
        }
        Returns: string
      }
      generate_receipt_number: {
        Args: {}
        Returns: string
      }
      get_invoice_statistics: {
        Args: {
          user_id: string
        }
        Returns: {
          total_invoices: number
          total_amount: number
          pending_invoices: number
          completed_invoices: number
        }
      }
      get_price_trends: {
        Args: {
          cardboard_type: string
          days_back: number
        }
        Returns: {
          date_recorded: string
          type: string
          condition: string
          avg_price: number
          transaction_count: number
        }
      }
      get_top_customers: {
        Args: {
          collector_uuid: string
          limit_count: number
        }
        Returns: {
          customer_id: string
          customer_name: string
          total_transactions: number
          total_weight: number
          total_amount: number
          last_transaction: string
        }
      }
      get_transaction_stats: {
        Args: {
          user_uuid: string
          user_role: string
          start_date: string
          end_date: string
        }
        Returns: {
          period_start: string
          period_end: string
          transaction_count: number
          total_weight: number
          total_amount: number
          avg_price_per_kg: number
        }
      }
      refresh_daily_summary: {
        Args: {}
        Returns: undefined
      }
      suggest_role_fixes: {
        Args: {}
        Returns: {
          user_id: string
          user_name: string
          current_role: string
          suggested_role: string
          reason: string
        }
      }
    }
    Enums: {
      cardboard_condition: "excellent" | "good" | "fair" | "poor"
      cardboard_type: "Kardus Tebal" | "Kardus Tipis" | "Kardus Bekas"
      payment_status: "pending" | "completed" | "cancelled"
      submission_priority: "low" | "medium" | "high"
      submission_status: "pending" | "scheduled" | "completed" | "cancelled"
      user_role: "customer" | "collector"
    }
    CompositeTypes: {
      _inner_get_invoice_statistics: {
        total_invoices: number
        total_amount: number
        pending_invoices: number
        completed_invoices: number
      }
      _inner_get_price_trends: {
        date_recorded: string
        type: string
        condition: string
        avg_price: number
        transaction_count: number
      }
      _inner_get_top_customers: {
        customer_id: string
        customer_name: string
        total_transactions: number
        total_weight: number
        total_amount: number
        last_transaction: string
      }
      _inner_get_transaction_stats: {
        period_start: string
        period_end: string
        transaction_count: number
        total_weight: number
        total_amount: number
        avg_price_per_kg: number
      }
      _inner_suggest_role_fixes: {
        user_id: string
        user_name: string
        current_role: string
        suggested_role: string
        reason: string
      }
    }
  }
}
\
type PublicSchema = Database[
