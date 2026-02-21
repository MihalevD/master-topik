'use client'

import { useRouter } from 'next/navigation'
import { Library, BookOpen, Sparkles, Lock } from 'lucide-react'
import { APP_NAME } from '@/lib/constants'
import { useApp } from '@/app/providers'

export default function HomePage() {
  const router = useRouter()
  const { totalCompleted } = useApp()
  const grammarLocked = totalCompleted < 5

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="mb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-3">
          {APP_NAME}
        </h1>
        <p className="text-gray-400 text-base">What do you want to practice today?</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-lg">
        <button
          onClick={() => router.push('/words')}
          className="group flex flex-col items-center gap-4 p-8 rounded-2xl bg-gray-800/80 border border-gray-700/50 hover:border-purple-500/60 hover:bg-gray-800 transition-all cursor-pointer shadow-xl"
        >
          <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center group-hover:bg-purple-600/30 transition-colors">
            <Library className="text-purple-400" size={32} />
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-lg mb-1">Words</p>
            <p className="text-gray-500 text-sm">Vocabulary flashcards & daily challenges</p>
          </div>
        </button>

        <div className={`relative flex flex-col items-center gap-4 p-8 rounded-2xl border shadow-xl transition-all group/grammar ${
          grammarLocked
            ? 'bg-gray-800/40 border-gray-700/30 cursor-not-allowed opacity-60'
            : 'bg-gray-800/80 border-gray-700/50 hover:border-blue-500/60 hover:bg-gray-800 cursor-pointer'
        }`}
          onClick={() => !grammarLocked && router.push('/grammar')}
        >
          {grammarLocked && (
            <>
              <div className="absolute top-3 right-3 flex items-center gap-1 bg-gray-700/80 rounded-lg px-2 py-1">
                <Lock size={11} className="text-gray-400" />
                <span className="text-gray-400 text-[10px] font-semibold">{5 - totalCompleted} words to go</span>
              </div>
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-900 border border-gray-700 text-gray-300 text-xs px-3 py-1.5 rounded-lg shadow-lg opacity-0 group-hover/grammar:opacity-100 transition-opacity pointer-events-none z-10">
                Learn 5 words in Words to unlock Grammar
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-700" />
              </div>
            </>
          )}
          <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center transition-colors ${
            grammarLocked
              ? 'bg-gray-700/20 border-gray-600/20'
              : 'bg-blue-600/20 border-blue-500/30 group-hover:bg-blue-600/30'
          }`}>
            {grammarLocked
              ? <Lock className="text-gray-500" size={32} />
              : <BookOpen className="text-blue-400" size={32} />
            }
          </div>
          <div className="text-center">
            <p className={`font-bold text-lg mb-1 ${grammarLocked ? 'text-gray-500' : 'text-white'}`}>Grammar</p>
            <p className="text-gray-500 text-sm">Patterns, rules & sentence structure</p>
          </div>
        </div>
      </div>

      <div className="mt-8 w-full max-w-lg p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center gap-4">
        <span className="text-3xl flex-shrink-0">한</span>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm">New to Korean?</p>
          <p className="text-gray-400 text-xs">Learn the Hangul alphabet before you start — it only takes a few minutes.</p>
        </div>
        <button
          onClick={() => router.push('/alphabet')}
          className="flex-shrink-0 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3 py-2 rounded-xl cursor-pointer transition-colors whitespace-nowrap"
        >
          Learn Hangul →
        </button>
      </div>
    </div>
  )
}
