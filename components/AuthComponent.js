'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/lib/supabase'

export default function AuthComponent() {
  // Get the current URL dynamically
  const redirectUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/auth/callback`
    : undefined

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            한글 TOPIK Master
          </h1>
          <p className="text-gray-600">Sign in to start learning Korean</p>
        </div>
        
        <Auth
          supabaseClient={supabase}
          appearance={{ 
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#9333ea',
                  brandAccent: '#7c3aed'
                }
              }
            }
          }}
          providers={['google']}
          redirectTo={redirectUrl}
          onlyThirdPartyProviders={false}
        />
        
        <p className="text-xs text-gray-500 text-center mt-4">
          By signing in, you agree to our Terms of Service
        </p>
      </div>
    </div>
  )
}