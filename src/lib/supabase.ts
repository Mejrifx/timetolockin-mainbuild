import { createClient } from '@supabase/supabase-js'

// Supabase configuration - uses environment variables with fallback to your project credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vjeuslhqjwrgjqqqojkn.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqZXVzbGhxandyZ2pxcXFvamtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzY0NTIsImV4cCI6MjA2ODk1MjQ1Mn0.wudyPrIpNRgDI42V9ch18vSLpfSln0hW3ZbLxS6-c6M'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Database types for our application
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          email?: string
          updated_at?: string
        }
      }
      pages: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
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