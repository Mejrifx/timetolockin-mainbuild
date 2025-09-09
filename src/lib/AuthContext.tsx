import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from './supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if Supabase is properly configured
    if (!isSupabaseConfigured) {
      console.warn('⚠️ Supabase not configured, skipping auth initialization')
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }).catch((error) => {
      console.error('❌ Failed to get session:', error)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      // Create profile and workspace when user signs in
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('🔄 User signed in, ensuring profile exists...')
        await createUserProfile(session.user.id, session.user.email || '')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: { message: 'Supabase not configured. Please check environment variables.' } as AuthError }
    }
    
    try {
      console.log('🔄 Starting user signup with email verification...')
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        console.error('❌ Signup error:', error)
        return { error }
      }
      
      if (data.user) {
        if (data.user.email_confirmed_at) {
          console.log('✅ User created and email confirmed, setting up profile...')
          // User is immediately confirmed, create profile and default workspace
          await createUserProfile(data.user.id, email)
        } else {
          console.log('✅ User created, email verification sent')
          console.log('📧 Please check your email and click the verification link')
        }
      }
      
      return { error }
    } catch (err) {
      console.error('SignUp error:', err)
      return { error: { message: 'Authentication service unavailable' } as AuthError }
    }
  }

  // Helper function to create user profile and default workspace
  const createUserProfile = async (userId: string, email: string) => {
    try {
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: email,
          username: email.split('@')[0]
        }, {
          onConflict: 'id'
        })
      
      if (profileError) {
        console.error('⚠️ Profile creation failed:', profileError)
        return
      }
      
      // Create default workspace
      const workspaceId = crypto.randomUUID()
      const { error: workspaceError } = await supabase
        .from('workspaces')
        .insert({
          id: workspaceId,
          user_id: userId,
          name: 'My Workspace',
          is_default: true
        })
      
      if (workspaceError) {
        console.error('⚠️ Workspace creation failed:', workspaceError)
        return
      }
      
      // Create default user settings
      const { error: settingsError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId
        }, {
          onConflict: 'user_id'
        })
      
      if (settingsError) {
        console.error('⚠️ Settings creation failed:', settingsError)
      }
      
      // Create default health settings
      const { error: healthError } = await supabase
        .from('health_settings')
        .upsert({
          user_id: userId
        }, {
          onConflict: 'user_id'
        })
      
      if (healthError) {
        console.error('⚠️ Health settings creation failed:', healthError)
      }
      
      // Check if welcome page already exists
      const { data: existingWelcomePage } = await supabase
        .from('pages')
        .select('id')
        .eq('user_id', userId)
        .eq('title', 'Welcome to Your Workspace')
        .single()

      // Only create welcome page if it doesn't exist
      if (!existingWelcomePage) {
        const pageId = crypto.randomUUID()
        const { error: pageError } = await supabase
          .from('pages')
          .insert({
            id: pageId,
            user_id: userId,
            workspace_id: workspaceId,
            title: 'Welcome to Your Workspace',
            content: `# Welcome to Your Workspace! 🚀

This is your personal productivity hub where you can organize your thoughts, track your goals, and build better habits.

## Getting Started

### 📝 **Workspace Pages**
- Create pages to organize your ideas, notes, and projects
- Use different icons to categorize your content
- Click on any page to start editing

### ✅ **Daily Non-Negotiables**
- Track your daily habits and tasks
- Set priorities and time allocations
- Build consistency with your goals

### 💰 **Finance Tracker**
- Monitor your income and expenses
- Set financial goals and budgets
- Track your financial progress

### 🏥 **Health Lab**
- Track your health protocols
- Monitor habits you want to quit
- Build a healthier lifestyle

## Tips for Success
- Start small and build momentum
- Review your progress regularly
- Use the workspace to plan your day
- Stay consistent with your daily tasks

Ready to get started? Create your first page or set up your daily tasks!`,
            icon: 'document'
          })
        
        if (pageError) {
          console.error('⚠️ Welcome page creation failed:', pageError)
        } else {
          console.log('✅ Welcome page created for new user')
        }
      } else {
        console.log('✅ Welcome page already exists for user')
      }
      
      console.log('✅ User profile and workspace setup complete')
    } catch (error) {
      console.error('❌ Error setting up user profile:', error)
    }
  }

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: { message: 'Supabase not configured. Please check environment variables.' } as AuthError }
    }
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error }
    } catch (err) {
      console.error('SignIn error:', err)
      return { error: { message: 'Authentication service unavailable' } as AuthError }
    }
  }

  const signOut = async () => {
    if (!isSupabaseConfigured) {
      return { error: { message: 'Supabase not configured. Please check environment variables.' } as AuthError }
    }
    
    try {
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (err) {
      console.error('SignOut error:', err)
      return { error: { message: 'Authentication service unavailable' } as AuthError }
    }
  }

  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured) {
      return { error: { message: 'Supabase not configured. Please check environment variables.' } as AuthError }
    }
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      return { error }
    } catch (err) {
      console.error('Reset password error:', err)
      return { error: { message: 'Authentication service unavailable' } as AuthError }
    }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
} 