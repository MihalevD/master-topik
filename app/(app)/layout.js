'use client'

import { useApp } from '@/app/providers'
import AuthComponent from '@/components/AuthComponent'
import NavBar from '@/components/NavBar'

export default function AppLayout({ children }) {
  const { user, loading, error, setError } = useApp()

  if (loading) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-2xl text-purple-400">Loading...</div>
      </div>
    )
  }

  if (!user) return <AuthComponent />

  return (
    <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">
      {error && (
        <div className="bg-red-900 border-b border-red-700 text-red-200 px-4 py-2 text-sm flex justify-between items-center z-50">
          <span>⚠ {error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-100 ml-4 font-bold">✕</button>
        </div>
      )}
      <NavBar />
      {children}
    </div>
  )
}
