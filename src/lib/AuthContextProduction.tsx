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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    // Check if Supabase is properly configured
    if (!isSupabaseConfigured) {
      console.warn('⚠️ Supabase not configured, skipping auth initialization')
      setLoading(false)
      return
    }

    let mounted = true

    // Get initial session with retry logic
    const initAuth = async () => {
      try {
        console.log('🔄 Initializing authentication...')
        
        // Try to get session with retry
        let session = null;
        let retries = 3;
        
        while (retries > 0 && !session) {
          try {
            const { data, error } = await supabase.auth.getSession()
            if (error) {
              console.error('❌ Session error (retry', 4 - retries, '):', error)
              retries--;
              if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
                continue;
              }
            } else {
              session = data.session;
              break;
            }
          } catch (err) {
            console.error('❌ Session fetch error (retry', 4 - retries, '):', err)
            retries--;
            if (retries > 0) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
        
        if (mounted) {
          if (session) {
            console.log('✅ Session retrieved:', session.user?.email || 'No user')
            setSession(session)
            setUser(session.user)
            setCurrentUserId(session.user?.id || null)
            
            if (session.user) {
              console.log('✅ User authenticated:', session.user.email, 'ID:', session.user.id)
            }
          } else {
            console.log('👤 No valid session found')
            setUser(null)
            setSession(null)
            setCurrentUserId(null)
          }
          setLoading(false)
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error)
        if (mounted) {
          setUser(null)
          setSession(null)
          setCurrentUserId(null)
          setLoading(false)
        }
      }
    }

    initAuth()

    // Listen for auth changes with better user switching logic
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change:', event, session?.user?.email || 'No user')
      
      if (mounted) {
        // Clear previous user data immediately on any auth change
        if (event === 'SIGNED_OUT') {
          console.log('🧹 User signed out, clearing all data...')
          setUser(null)
          setSession(null)
          setCurrentUserId(null)
          setLoading(false)
          setIsSigningOut(false)
          return
        }
        
        // Handle user switching
        if (event === 'SIGNED_IN' && session?.user) {
          const newUserId = session.user.id
          
          // If user changed, clear previous user data
          if (currentUserId && currentUserId !== newUserId) {
            console.log('🔄 User switched from', currentUserId, 'to', newUserId)
            console.log('🧹 Clearing previous user data...')
            // Clear data by triggering a re-render
            setUser(null)
            setSession(null)
            setCurrentUserId(null)
            
            // Small delay to ensure cleanup
            await new Promise(resolve => setTimeout(resolve, 100))
          }
          
          console.log('✅ New user authenticated:', session.user.email, 'ID:', newUserId)
          setSession(session)
          setUser(session.user)
          setCurrentUserId(newUserId)
          setLoading(false)
          setIsSigningOut(false)
          
          // Create profile in background
          console.log('🔄 User signed in, ensuring profile exists...')
          createUserProfile(session.user.id, session.user.email || '')
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Just update the session, don't clear data
          console.log('🔄 Token refreshed for user:', session.user.email)
          setSession(session)
          setUser(session.user)
          setCurrentUserId(session.user.id)
        } else {
          // No user in session
          console.log('👤 No user in session')
          setUser(null)
          setSession(null)
          setCurrentUserId(null)
          setLoading(false)
          setIsSigningOut(false)
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [currentUserId])

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
      
      // Clear any existing session first to prevent confusion
      await supabase.auth.signOut()
      
      // Small delay to ensure cleanup
      await new Promise(resolve => setTimeout(resolve, 200))
      
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
      
      // Clear local state immediately
      setUser(null)
      setSession(null)
      setCurrentUserId(null)
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('❌ Sign out error:', error)
        setIsSigningOut(false)
        return { error }
      }
      
      console.log('✅ User signed out successfully')
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

  // Helper function to create user profile - simplified and non-blocking
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
        // Don't throw error - just log it
      } else {
        console.log('✅ User profile created successfully for:', email)
      }
    } catch (error) {
      console.error('❌ Error setting up user profile:', error)
      // Don't throw error - just log it
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
