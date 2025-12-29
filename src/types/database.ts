export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activities: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          merchant_id: string
          ticket_id: string | null
          type: Database["public"]["Enums"]["activity_type"]
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          merchant_id: string
          ticket_id?: string | null
          type?: Database["public"]["Enums"]["activity_type"]
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          merchant_id?: string
          ticket_id?: string | null
          type?: Database["public"]["Enums"]["activity_type"]
        }
        Relationships: []
      }
      contacts: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          is_primary: boolean | null
          merchant_id: string
          name: string
          phone: string | null
          role: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          merchant_id: string
          name: string
          phone?: string | null
          role?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          merchant_id?: string
          name?: string
          phone?: string | null
          role?: string | null
        }
        Relationships: []
      }
      merchants: {
        Row: {
          assigned_sales_rep: string | null
          assigned_support_rep: string | null
          created_at: string | null
          id: string
          legal_name: string | null
          mcc_code: string | null
          metadata: Json | null
          name: string
          onboarded_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          assigned_sales_rep?: string | null
          assigned_support_rep?: string | null
          created_at?: string | null
          id?: string
          legal_name?: string | null
          mcc_code?: string | null
          metadata?: Json | null
          name: string
          onboarded_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          assigned_sales_rep?: string | null
          assigned_support_rep?: string | null
          created_at?: string | null
          id?: string
          legal_name?: string | null
          mcc_code?: string | null
          metadata?: Json | null
          name?: string
          onboarded_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string | null
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          merchant_id: string
          priority: Database["public"]["Enums"]["ticket_priority"] | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["ticket_status"] | null
          subject: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          merchant_id: string
          priority?: Database["public"]["Enums"]["ticket_priority"] | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"] | null
          subject: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          merchant_id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"] | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"] | null
          subject?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string
          completed_at: string | null
          created_at: string | null
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          merchant_id: string
          ticket_id: string | null
          title: string
        }
        Insert: {
          assigned_to: string
          completed_at?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          merchant_id: string
          ticket_id?: string | null
          title: string
        }
        Update: {
          assigned_to?: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          merchant_id?: string
          ticket_id?: string | null
          title?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount_cents: number
          card_brand: string | null
          created_at: string | null
          currency: string
          id: string
          last_four: string | null
          merchant_id: string
          processed_at: string
          status: string
          type: string
        }
        Insert: {
          amount_cents: number
          card_brand?: string | null
          created_at?: string | null
          currency?: string
          id: string
          last_four?: string | null
          merchant_id: string
          processed_at: string
          status: string
          type: string
        }
        Update: {
          amount_cents?: number
          card_brand?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          last_four?: string | null
          merchant_id?: string
          processed_at?: string
          status?: string
          type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_merchant_summary: {
        Args: { p_merchant_id: string }
        Returns: Json
      }
      search_merchants: {
        Args: {
          p_query?: string
          p_status?: string
          p_assigned_to?: string
          p_limit?: number
          p_offset?: number
        }
        Returns: Database["public"]["Tables"]["merchants"]["Row"][]
      }
    }
    Enums: {
      activity_type: "note" | "call" | "email" | "meeting" | "status_change" | "system"
      ticket_priority: "low" | "medium" | "high" | "urgent"
      ticket_status: "open" | "in_progress" | "waiting_on_merchant" | "resolved" | "closed"
      user_role: "sales" | "support" | "ops" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"]
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T]

// Convenience types
export type Profile = Tables<"profiles">
export type Merchant = Tables<"merchants">
export type Contact = Tables<"contacts">
export type Transaction = Tables<"transactions">
export type SupportTicket = Tables<"support_tickets">
export type Activity = Tables<"activities">
export type Task = Tables<"tasks">

export type UserRole = Enums<"user_role">
export type ActivityType = Enums<"activity_type">
export type TicketStatus = Enums<"ticket_status">
export type TicketPriority = Enums<"ticket_priority">

// Extended types with relations
export type MerchantWithReps = Merchant & {
  sales_rep?: Profile | null
  support_rep?: Profile | null
  contacts?: Contact[]
}

export type TicketWithRelations = SupportTicket & {
  assigned_user?: Profile | null
  created_user?: Profile | null
  merchant?: Merchant | null
}

export type ActivityWithUser = Activity & {
  created_user?: Profile | null
}

export type TaskWithRelations = Task & {
  assigned_user?: Profile | null
  created_user?: Profile | null
  merchant?: Merchant | null
}
