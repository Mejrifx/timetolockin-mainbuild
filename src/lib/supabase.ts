import { createClient } from '@supabase/supabase-js'

// Supabase configuration - require env variables for security
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// Database types for our application
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          username: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          username?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          email?: string
          username?: string | null
          updated_at?: string
        }
      }
      pages: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          // Persisted structured editor blocks
          blocks: any[] | null
          icon: string
          parent_id: string | null
          children: string[]
          is_expanded: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_id: string
          title: string
          content?: string
          blocks?: any[] | null
          icon?: string
          parent_id?: string | null
          children?: string[]
          is_expanded?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          content?: string
          blocks?: any[] | null
          icon?: string
          parent_id?: string | null
          children?: string[]
          is_expanded?: boolean
          updated_at?: string
        }
      }
      daily_tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          time_allocation: number
          priority: 'low' | 'medium' | 'high'
          category: string
          completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_id: string
          title: string
          description?: string | null
          time_allocation: number
          priority: 'low' | 'medium' | 'high'
          category: string
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          time_allocation?: number
          priority?: 'low' | 'medium' | 'high'
          category?: string
          completed?: boolean
          updated_at?: string
        }
      }
    }
  }
} 