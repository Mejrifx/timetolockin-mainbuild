import { useState } from 'react'
import { Mail, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/AuthContextSync'
import { ConfigurationStatus } from '@/components/ConfigurationStatus'
import { cn } from '@/lib/utils'

interface AuthFormProps {
  mode: 'signin' | 'signup'
  onToggleMode: () => void
}

export const AuthForm = ({ mode, onToggleMode }: AuthFormProps) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { signIn, signUp, resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          setError('Passwords do not match')
          setLoading(false)
          return
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters')
          setLoading(false)
          return
        }
        const { error } = await signUp(email, password)
        if (error) {
          setError(error.message)
        } else {
          setSuccess('Check your email for verification link!')
        }
      } else {
        const { error } = await signIn(email, password)
        if (error) {
          setError(error.message)
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first')
      return
    }
    setLoading(true)
    setError('')
    const { error } = await resetPassword(email)
    if (error) {
      setError(error.message)
    } else {
      setSuccess('Password reset email sent!')
    }
    setLoading(false)
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-black/60 backdrop-blur-xl rounded-2xl border border-green-500/30 shadow-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img 
              src="/timetolockin MAIN LOGO NEW.png" 
              alt="timetolockin Logo" 
              className="h-14 w-auto object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-gray-400">
            {mode === 'signin' 
              ? 'Sign in to access your workspace' 
              : 'Start organizing your thoughts and habits'
            }
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-green-400 text-sm">{success}</p>
          </div>
        )}

        {/* Configuration Status */}
        <ConfigurationStatus />

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-300">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-black/20 border-green-500/30 text-white placeholder:text-gray-400 focus-visible:ring-green-500/50 focus-visible:border-green-500/50"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-300">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 bg-black/20 border-green-500/30 text-white placeholder:text-gray-400 focus-visible:ring-green-500/50 focus-visible:border-green-500/50"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field (Signup only) */}
          {mode === 'signup' && (
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-300">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 bg-black/20 border-green-500/30 text-white placeholder:text-gray-400 focus-visible:ring-green-500/50 focus-visible:border-green-500/50"
                  required
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 px-6 rounded-lg font-medium transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
              </div>
            ) : (
              <div className="flex items-center justify-center">
                {mode === 'signin' ? 'Sign in' : 'Create account'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </div>
            )}
          </Button>

          {/* Forgot Password (Signin only) */}
          {mode === 'signin' && (
            <div className="text-center">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                className="text-green-400 hover:text-green-300 text-sm transition-colors disabled:opacity-50"
              >
                Forgot your password?
              </button>
            </div>
          )}
        </form>

        {/* Toggle Mode */}
        <div className="mt-8 pt-6 border-t border-green-500/20 text-center">
          <p className="text-gray-400 text-sm">
            {mode === 'signin' 
              ? "Don't have an account?" 
              : "Already have an account?"
            }
            <button
              onClick={onToggleMode}
              className="ml-2 text-green-400 hover:text-green-300 font-medium transition-colors"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
} 