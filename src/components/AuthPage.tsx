import { useState } from 'react'
import { AuthForm } from './AuthForm'
import { GridBackground } from '@/components/ui/grid-background'

export const AuthPage = () => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin')
  }

  return (
    <GridBackground className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AuthForm mode={mode} onToggleMode={toggleMode} />
      </div>
    </GridBackground>
  )
} 