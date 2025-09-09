import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react'
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
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Prevent multiple simultaneous auth operations
  const authOperationRef = useRef(false)
  const initializationRef = useRef(false)

  useEffect(() => {
    // Prevent multiple initializations
    if (initializationRef.current) return
    initializationRef.current = true

    // Check if Supabase is properly configured
    if (!isSupabaseConfigured) {
      console.warn('⚠️ Supabase not configured, skipping auth initialization')
      setLoading(false)
      setIsInitialized(true)
      return
    }

    let mounted = true

    // Get initial session with single attempt
    const initAuth = async () => {
      try {
        console.log('🔄 Initializing authentication...')
        
        const { data, error } = await supabase.auth.getSession()
        
        if (mounted) {
          if (error) {
            console.error('❌ Session error:', error)
            setUser(null)
            setSession(null)
          } else if (data.session) {
            console.log('✅ Session found:', data.session.user?.email || 'No user')
            setSession(data.session)
            setUser(data.session.user)
          } else {
            console.log('👤 No session found')
            setUser(null)
            setSession(null)
          }
          
          setLoading(false)
          setIsInitialized(true)
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error)
        if (mounted) {
          setUser(null)
          setSession(null)
          setLoading(false)
          setIsInitialized(true)
        }
      }
    }

    initAuth()

    // Listen for auth changes with debouncing
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Prevent rapid state changes
      if (authOperationRef.current) {
        console.log('⚠️ Auth operation in progress, skipping state change')
        return
      }

      console.log('🔄 Auth state change:', event, session?.user?.email || 'No user')
      
      if (mounted && isInitialized) {
        authOperationRef.current = true
        
        try {
          if (event === 'SIGNED_OUT') {
            console.log('🧹 User signed out, clearing data...')
            setUser(null)
            setSession(null)
          } else if (event === 'SIGNED_IN' && session?.user) {
            console.log('✅ User signed in:', session.user.email)
            setSession(session)
            setUser(session.user)
            
            // Create profile in background without blocking
            createUserProfile(session.user.id, session.user.email || '')
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            console.log('🔄 Token refreshed for user:', session.user.email)
            setSession(session)
            setUser(session.user)
          } else {
            // No user in session
            setUser(null)
            setSession(null)
          }
        } finally {
          // Reset operation flag after a short delay
          setTimeout(() => {
            authOperationRef.current = false
          }, 500)
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
    
    if (authOperationRef.current) {
      return { error: { message: 'Authentication operation in progress. Please wait.' } as AuthError }
    }
    
    try {
      authOperationRef.current = true
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
    } finally {
      setTimeout(() => {
        authOperationRef.current = false
      }, 1000)
    }
  }

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: { message: 'Supabase not configured. Please check environment variables.' } as AuthError }
    }
    
    if (authOperationRef.current) {
      return { error: { message: 'Authentication operation in progress. Please wait.' } as AuthError }
    }
    
    try {
      authOperationRef.current = true
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
    } finally {
      setTimeout(() => {
        authOperationRef.current = false
      }, 1000)
    }
  }

  const signOut = async () => {
    if (!isSupabaseConfigured) {
      return { error: { message: 'Supabase not configured. Please check environment variables.' } as AuthError }
    }
    
    if (authOperationRef.current) {
      return { error: { message: 'Authentication operation in progress. Please wait.' } as AuthError }
    }
    
    try {
      authOperationRef.current = true
      console.log('🔄 Signing out user...')
      
      // Clear local state immediately
      setUser(null)
      setSession(null)
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('❌ Sign out error:', error)
        return { error }
      }
      
      console.log('✅ User signed out successfully')
      return { error }
    } catch (err) {
      console.error('SignOut error:', err)
      return { error: { message: 'Authentication service unavailable' } as AuthError }
    } finally {
      setTimeout(() => {
        authOperationRef.current = false
      }, 1000)
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

  // Helper function to create user profile - non-blocking
  const createUserProfile = async (userId: string, email: string) => {
    try {
      console.log('👤 Creating user profile for:', email, 'ID:', userId)
      
      // Check if profile already exists first
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single()
      
      if (existingProfile) {
        console.log('✅ User profile already exists for:', email)
        return
      }
      
      // Simple profile creation without timeout
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
      } else {
        console.log('✅ User profile created successfully for:', email)
      }
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
