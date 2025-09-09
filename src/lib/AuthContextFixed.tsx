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
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    // Check if Supabase is properly configured
    if (!isSupabaseConfigured) {
      console.warn('⚠️ Supabase not configured, skipping auth initialization')
      setLoading(false)
      return
    }

    let mounted = true

    // Get initial session with timeout
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (mounted) {
          if (error) {
            console.error('❌ Failed to get session:', error)
            setUser(null)
            setSession(null)
          } else {
            setSession(session)
            setUser(session?.user ?? null)
            
            if (session?.user) {
              console.log('✅ User authenticated:', session.user.email)
            }
          }
          setLoading(false)
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error)
        if (mounted) {
          setUser(null)
          setSession(null)
          setLoading(false)
        }
      }
    }

    initAuth()

    // Listen for auth changes with debouncing
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change:', event, session?.user?.email)
      
      if (mounted) {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        setIsSigningOut(false)

        // Only create profile on SIGNED_IN event, not on TOKEN_REFRESHED
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('🔄 User signed in, ensuring profile exists...')
          await createUserProfile(session.user.id, session.user.email || '')
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: { message: 'Supabase not configured. Please check environment variables.' } as AuthError }
    }
    
    try {
      console.log('🔄 Starting user signup...')
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
          console.log('✅ User created and email confirmed')
        } else {
          console.log('✅ User created, email verification sent')
        }
      }
      
      return { error }
    } catch (err) {
      console.error('SignUp error:', err)
      return { error: { message: 'Authentication service unavailable' } as AuthError }
    }
  }

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: { message: 'Supabase not configured. Please check environment variables.' } as AuthError }
    }
    
    try {
      console.log('🔄 Signing in user:', email)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        console.error('❌ Sign in error:', error)
      } else {
        console.log('✅ User signed in successfully')
      }
      
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
    
    if (isSigningOut) {
      console.log('⚠️ Sign out already in progress')
      return { error: null }
    }
    
    try {
      setIsSigningOut(true)
      console.log('🔄 Signing out user...')
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('❌ Sign out error:', error)
        setIsSigningOut(false)
        return { error }
      }
      
      console.log('✅ User signed out successfully')
      
      // Clear local state immediately
      setUser(null)
      setSession(null)
      setIsSigningOut(false)
      
      return { error }
    } catch (err) {
      console.error('SignOut error:', err)
      setIsSigningOut(false)
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

  // Helper function to create user profile and default workspace
  const createUserProfile = async (userId: string, email: string) => {
    try {
      console.log('👤 Creating user profile for:', email)
      
      // Create profile with timeout
      const profilePromise = supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: email,
          username: email.split('@')[0]
        }, {
          onConflict: 'id'
        })
      
      const profileTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile creation timeout')), 5000)
      )
      
      const { error: profileError } = await Promise.race([profilePromise, profileTimeout]) as any
      
      if (profileError) {
        console.error('⚠️ Profile creation failed:', profileError)
        return
      }
      
      console.log('✅ User profile created successfully')
    } catch (error) {
      console.error('❌ Error setting up user profile:', error)
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
