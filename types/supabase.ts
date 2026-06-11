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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      "Ai Memory": {
        Row: {
          created_at: string
          id: number
          message: string | null
          recipient: string | null
          sender: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          message?: string | null
          recipient?: string | null
          sender?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          message?: string | null
          recipient?: string | null
          sender?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          credit_limit: number | null
          email: string | null
          id: string
          is_credit_approved: boolean | null
          name: string
          phone: string | null
          tenant_id: string
          total_purchases: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          credit_limit?: number | null
          email?: string | null
          id?: string
          is_credit_approved?: boolean | null
          name: string
          phone?: string | null
          tenant_id: string
          total_purchases?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          credit_limit?: number | null
          email?: string | null
          id?: string
          is_credit_approved?: boolean | null
          name?: string
          phone?: string | null
          tenant_id?: string
          total_purchases?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      debt_payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          payment_date: string | null
          payment_method: string
          recorded_by: string
          tenant_id: string
          transaction_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          payment_date?: string | null
          payment_method: string
          recorded_by: string
          tenant_id: string
          transaction_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          payment_date?: string | null
          payment_method?: string
          recorded_by?: string
          tenant_id?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "debt_payments_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debt_payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debt_payments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_audit: {
        Row: {
          changed_by: string
          changes: Json
          created_at: string | null
          expense_id: string
          id: string
        }
        Insert: {
          changed_by: string
          changes: Json
          created_at?: string | null
          expense_id: string
          id?: string
        }
        Update: {
          changed_by?: string
          changes?: Json
          created_at?: string | null
          expense_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_audit_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_audit_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category_id: string
          created_at: string | null
          created_by: string
          description: string | null
          expense_date: string
          id: string
          receipt_reference: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string | null
          created_by: string
          description?: string | null
          expense_date: string
          id?: string
          receipt_reference?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          expense_date?: string
          id?: string
          receipt_reference?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }

      n8n_chat_histories: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          base_unit: string
          barcode: string | null
          category: string
          cost: number | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          image_url: string | null
          is_archived: boolean
          is_variable_price: boolean | null
          low_stock_threshold: number
          name: string
          price: number | null
          purchase_unit: string
          sku: string
          stock_quantity: number
          tenant_id: string
          unit_conversion_ratio: number
          updated_at: string
        }
        Insert: {
          base_unit: string
          barcode?: string | null
          category: string
          cost?: number | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_archived?: boolean
          is_variable_price?: boolean | null
          low_stock_threshold?: number
          name: string
          price?: number | null
          purchase_unit: string
          sku: string
          stock_quantity?: number
          tenant_id: string
          unit_conversion_ratio?: number
          updated_at?: string
        }
        Update: {
          base_unit?: string
          barcode?: string | null
          category?: string
          cost?: number | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_archived?: boolean
          is_variable_price?: boolean | null
          low_stock_threshold?: number
          name?: string
          price?: number | null
          purchase_unit?: string
          sku?: string
          stock_quantity?: number
          tenant_id?: string
          unit_conversion_ratio?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          cost_per_unit: number
          created_at: string
          id: string
          product_id: string
          product_name: string
          purchase_order_id: string
          quantity: number
          tenant_id: string
          total_cost: number
        }
        Insert: {
          cost_per_unit: number
          created_at?: string
          id?: string
          product_id: string
          product_name: string
          purchase_order_id: string
          quantity: number
          tenant_id: string
          total_cost: number
        }
        Update: {
          cost_per_unit?: number
          created_at?: string
          id?: string
          product_id?: string
          product_name?: string
          purchase_order_id?: string
          quantity?: number
          tenant_id?: string
          total_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          created_by: string
          expected_delivery_date: string | null
          id: string
          notes: string | null
          po_number: string
          status: string
          supplier_contact: string | null
          supplier_name: string
          tenant_id: string
          total_cost: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          po_number: string
          status?: string
          supplier_contact?: string | null
          supplier_name: string
          tenant_id: string
          total_cost?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          po_number?: string
          status?: string
          supplier_contact?: string | null
          supplier_name?: string
          tenant_id?: string
          total_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      receipt_settings: {
        Row: {
          business_address: string | null
          business_name: string | null
          business_phone: string | null
          created_at: string
          footer_message: string | null
          id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          business_address?: string | null
          business_name?: string | null
          business_phone?: string | null
          created_at?: string
          footer_message?: string | null
          id?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          business_address?: string | null
          business_name?: string | null
          business_phone?: string | null
          created_at?: string
          footer_message?: string | null
          id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipt_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      return_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          product_name: string
          quantity: number
          return_id: string
          subtotal: number
          tenant_id: string
          transaction_item_id: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          product_name: string
          quantity: number
          return_id: string
          subtotal: number
          tenant_id: string
          transaction_item_id: string
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          return_id?: string
          subtotal?: number
          tenant_id?: string
          transaction_item_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "return_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_items_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "returns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_items_transaction_item_id_fkey"
            columns: ["transaction_item_id"]
            isOneToOne: false
            referencedRelation: "transaction_items"
            referencedColumns: ["id"]
          },
        ]
      }
      returns: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string
          id: string
          reason: string
          return_number: string
          status: string
          tenant_id: string
          total_amount: number
          transaction_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by: string
          id?: string
          reason: string
          return_number: string
          status?: string
          tenant_id: string
          total_amount: number
          transaction_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string
          id?: string
          reason?: string
          return_number?: string
          status?: string
          tenant_id?: string
          total_amount?: number
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "returns_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_history: {
        Row: {
          created_at: string
          created_by: string
          id: string
          product_id: string
          quantity_after: number
          quantity_change: number
          reason: string | null
          reference_id: string | null
          tenant_id: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          product_id: string
          quantity_after: number
          quantity_change: number
          reason?: string | null
          reference_id?: string | null
          tenant_id: string
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          product_id?: string
          quantity_after?: number
          quantity_change?: number
          reason?: string | null
          reference_id?: string | null
          tenant_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_history_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          name: string
          settings: Json
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          settings?: Json
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          settings?: Json
        }
        Relationships: []
      }
      tour_analytics: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          step_id: string | null
          tenant_id: string
          tour_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          step_id?: string | null
          tenant_id: string
          tour_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          step_id?: string | null
          tenant_id?: string
          tour_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tour_analytics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          product_name: string
          product_sku: string
          quantity: number
          subtotal: number
          tenant_id: string
          transaction_id: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          product_name: string
          product_sku: string
          quantity: number
          subtotal: number
          tenant_id: string
          transaction_id: string
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          product_name?: string
          product_sku?: string
          quantity?: number
          subtotal?: number
          tenant_id?: string
          transaction_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "transaction_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_items_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          created_at: string
          created_by: string
          customer_id: string | null
          discount_amount: number
          discount_type: string
          discount_value: number
          id: string
          outstanding_balance: number | null
          payment_method: string
          served_by: string | null
          status: string
          store_id: string
          subtotal: number
          tenant_id: string
          total: number
          transaction_number: string
        }
        Insert: {
          created_at?: string
          created_by: string
          customer_id?: string | null
          discount_amount?: number
          discount_type: string
          discount_value?: number
          id?: string
          outstanding_balance?: number | null
          payment_method: string
          served_by?: string | null
          status?: string
          store_id: string
          subtotal: number
          tenant_id: string
          total: number
          transaction_number: string
        }
        Update: {
          created_at?: string
          created_by?: string
          customer_id?: string | null
          discount_amount?: number
          discount_type?: string
          discount_value?: number
          id?: string
          outstanding_balance?: number | null
          payment_method?: string
          served_by?: string | null
          status?: string
          store_id?: string
          subtotal?: number
          tenant_id?: string
          total?: number
          transaction_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_served_by_fkey"
            columns: ["served_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_tour_hints_dismissed: {
        Row: {
          dismissed_at: string | null
          hint_id: string
          id: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          dismissed_at?: string | null
          hint_id: string
          id?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          dismissed_at?: string | null
          hint_id?: string
          id?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tour_hints_dismissed_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tour_hints_dismissed_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_tour_progress: {
        Row: {
          completed_at: string | null
          created_at: string | null
          current_step: number | null
          id: string
          started_at: string | null
          status: string
          tenant_id: string
          time_spent_seconds: number | null
          total_steps: number | null
          tour_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          current_step?: number | null
          id?: string
          started_at?: string | null
          status: string
          tenant_id: string
          time_spent_seconds?: number | null
          total_steps?: number | null
          tour_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          current_step?: number | null
          id?: string
          started_at?: string | null
          status?: string
          tenant_id?: string
          time_spent_seconds?: number | null
          total_steps?: number | null
          tour_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tour_progress_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tour_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          role: "admin" | "sales_person"
          store_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          role: "admin" | "sales_person"
          store_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          role?: "admin" | "sales_person"
          store_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_po_number: { Args: { p_tenant_id: string }; Returns: string }
      generate_return_number: { Args: { p_tenant_id: string }; Returns: string }
      generate_transaction_number: {
        Args: { p_tenant_id: string }
        Returns: string
      }
      get_user_tour_stats: {
        Args: { p_user_id: string }
        Returns: {
          completed_tours: number
          completion_percentage: number
          in_progress_tours: number
          skipped_tours: number
          total_tours: number
        }[]
      }
      track_tour_event: {
        Args: {
          p_event_type: string
          p_metadata?: Json
          p_step_id: string
          p_tenant_id: string
          p_tour_id: string
          p_user_id: string
        }
        Returns: {
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          step_id: string | null
          tenant_id: string
          tour_id: string
          user_id: string | null
        }
      }
      update_tour_progress: {
        Args: {
          p_current_step: number
          p_status: string
          p_tenant_id: string
          p_total_steps: number
          p_tour_id: string
          p_user_id: string
        }
        Returns: {
          completed_at: string | null
          created_at: string | null
          current_step: number | null
          id: string
          started_at: string | null
          status: string
          tenant_id: string
          time_spent_seconds: number | null
          total_steps: number | null
          tour_id: string
          updated_at: string | null
          user_id: string
        }
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
