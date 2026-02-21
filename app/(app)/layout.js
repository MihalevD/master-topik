'use client'

import { useApp } from '@/app/providers'
import AuthComponent from '@/components/AuthComponent'
import NavBar from '@/components/NavBar'

export default function AppLayout({ children }) {
  const { user, loading, error, setError } = useApp()

  if (loading) {
    return (
      <div className="h-screen bg-[#0c0c14] flex items-center justify-center">
        <div className="text-2xl text-purple-400">Loading...</div>
      </div>
    )
  }

  if (!user) return <AuthComponent />

  return (
    <div className="relative h-screen bg-[#0c0c14] flex flex-col overflow-hidden">

      {/* ── Global ambient background glows ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-24 w-[600px] h-[420px] bg-purple-600/[0.08] rounded-full blur-[110px]" />
        <div className="absolute top-1/2 -translate-y-1/2 -right-28 w-[500px] h-[360px] bg-indigo-600/[0.07] rounded-full blur-[100px]" />
        <div className="absolute -bottom-28 left-1/3 w-[440px] h-[300px] bg-pink-600/[0.05] rounded-full blur-[90px]" />
      </div>

      {error && (
        <div className="relative z-50 bg-red-900 border-b border-red-700 text-red-200 px-4 py-2 text-sm flex justify-between items-center">
          <span>⚠ {error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-100 ml-4 font-bold">✕</button>
        </div>
      )}
      <NavBar />
      <div className="relative flex-1 min-h-0 flex flex-col">
        {children}
      </div>
    </div>
  )
}
