import { createClient } from '@supabase/supabase-js'

// Supabase configuration - require env variables for security
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Environment validation with helpful error messages
console.log('🔍 Environment Variables Check (Updated):');
console.log('- NODE_ENV:', import.meta.env.MODE);
console.log('- VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('- VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
console.log('- Database tables should be setup and working!');
console.log('- Deployment timestamp:', new Date().toISOString());

if (!supabaseUrl) {
  console.error('❌ VITE_SUPABASE_URL is not set in environment variables')
  console.error('📋 Please add VITE_SUPABASE_URL to your Netlify environment variables')
  console.error('🔗 Go to: Netlify Dashboard → Site Settings → Environment Variables')
  
  // Don't throw in production, let the app show error boundary instead
  if (import.meta.env.DEV) {
    throw new Error('Missing VITE_SUPABASE_URL environment variable')
  }
}

if (!supabaseAnonKey) {
  console.error('❌ VITE_SUPABASE_ANON_KEY is not set in environment variables')
  console.error('📋 Please add VITE_SUPABASE_ANON_KEY to your Netlify environment variables')
  console.error('🔗 Go to: Netlify Dashboard → Site Settings → Environment Variables')
  
  // Don't throw in production, let the app show error boundary instead
  if (import.meta.env.DEV) {
    throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable')
  }
}

// Validate URL format only if URL exists
if (supabaseUrl) {
  try {
    new URL(supabaseUrl)
    console.log('✅ Supabase environment variables loaded successfully')
    console.log('🔗 Connecting to:', supabaseUrl)
  } catch {
    console.error('❌ Invalid VITE_SUPABASE_URL format:', supabaseUrl)
    if (import.meta.env.DEV) {
      throw new Error('Invalid VITE_SUPABASE_URL format - should be https://xxx.supabase.co')
    }
  }
}

// Create Supabase client with fallback for missing environment variables
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key', 
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
)

// Export a flag to check if Supabase is properly configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

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
      calendar_events: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          event_date: string
          event_time: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_id: string
          title: string
          description?: string | null
          event_date: string
          event_time?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          event_date?: string
          event_time?: string | null
          updated_at?: string
        }
      }
    }
  }
} 