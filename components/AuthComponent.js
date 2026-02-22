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
    <div className="h-screen overflow-hidden bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-3">

        {/* Title */}
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-1">
            한글 TOPIK Master
          </h1>
          <p className="text-gray-500 text-xs">Your complete Korean exam prep toolkit</p>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { icon: '한', label: 'Learn Hangul', sub: 'Korean alphabet' },
            { icon: '📚', label: 'TOPIK Words', sub: '800+ vocabulary' },
            { icon: '📖', label: 'Grammar', sub: 'Rules & patterns' },
          ].map(f => (
            <div key={f.label} className="bg-white/[0.04] border border-white/[0.07] rounded-xl px-2 py-2.5">
              <div className="text-xl mb-0.5">{f.icon}</div>
              <p className="text-white text-xs font-semibold leading-tight">{f.label}</p>
              <p className="text-gray-500 text-[10px] mt-0.5">{f.sub}</p>
            </div>
          ))}
        </div>

        {/* Auth card */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#9333ea',
                    brandAccent: '#7c3aed',
                    inputBackground: 'rgba(255,255,255,0.05)',
                    inputBorder: 'rgba(255,255,255,0.1)',
                    inputText: '#f3f4f6',
                    inputPlaceholder: '#6b7280',
                    messageText: '#d1d5db',
                    anchorTextColor: '#a78bfa',
                    dividerBackground: 'rgba(255,255,255,0.1)',
                  },
                  radii: { borderRadiusButton: '12px', inputBorderRadius: '10px' },
                  space: { inputPadding: '10px', buttonPadding: '10px' },
                }
              }
            }}
            providers={['google']}
            redirectTo={redirectUrl}
            onlyThirdPartyProviders={false}
          />
        </div>

        <p className="text-[11px] text-gray-700 text-center">
          By signing in, you agree to our Terms of Service
        </p>
      </div>
    </div>
  )
}