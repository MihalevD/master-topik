'use client'

import { useState } from 'react'
import { useApp } from '@/app/providers'
import dynamic from 'next/dynamic'
import { allWords } from '@/lib/words'
import { topikIGrammar, topikIIGrammar, topikIGrammarQuestions, topikIIGrammarQuestions } from '@/lib/grammar'
import { BookOpen, ChevronRight } from 'lucide-react'

const GrammarView = dynamic(() => import('@/components/GrammarView'))
const GrammarGame = dynamic(() => import('@/components/GrammarGame'))

export default function GrammarPage() {
  const { wordStats } = useApp()
  const [level, setLevel]       = useState(null)   // null | 'I' | 'II'
  const [showGame, setShowGame] = useState(false)
  const [gameCats, setGameCats] = useState(null)

  const grammarData      = level === 'II' ? topikIIGrammar      : topikIGrammar
  const staticQuestions  = level === 'II' ? topikIIGrammarQuestions : topikIGrammarQuestions

  if (showGame) {
    return (
      <GrammarGame
        wordStats={wordStats}
        allWords={allWords}
        onClose={() => setShowGame(false)}
        selectedCategories={gameCats}
        staticQuestions={staticQuestions}
      />
    )
  }

  if (level) {
    return (
      <GrammarView
        grammarData={grammarData}
        onBack={() => setLevel(null)}
        onStartGame={(cats) => {
          setGameCats(cats)
          setShowGame(true)
        }}
      />
    )
  }

  // ── Landing: pick level ──────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center mb-8">
          <BookOpen className="mx-auto mb-3 text-purple-400" size={40} />
          <h2 className="text-2xl font-bold text-white">Grammar</h2>
          <p className="text-gray-500 text-sm mt-1">Choose your level to start studying</p>
        </div>

        {/* TOPIK I */}
        <button
          onClick={() => setLevel('I')}
          className="w-full flex items-center gap-4 p-5 rounded-2xl bg-gray-800/80 border border-purple-500/40 hover:border-purple-500/80 hover:bg-gray-800 transition-all cursor-pointer text-left group shadow-lg"
        >
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
            <span className="text-purple-300 font-bold text-lg">I</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-base">TOPIK I</p>
            <p className="text-gray-400 text-sm mt-0.5">Beginner — particles, verb forms, basic patterns</p>
            <p className="text-purple-400 text-xs mt-1">{topikIGrammar.length} categories · {topikIGrammar.reduce((n, s) => n + s.rules.length, 0)} rules</p>
          </div>
          <ChevronRight size={20} className="text-gray-600 group-hover:text-purple-400 transition-colors flex-shrink-0" />
        </button>

        {/* TOPIK II */}
        <button
          onClick={() => setLevel('II')}
          className="w-full flex items-center gap-4 p-5 rounded-2xl bg-gray-800/80 border border-pink-500/40 hover:border-pink-500/80 hover:bg-gray-800 transition-all cursor-pointer text-left group shadow-lg"
        >
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center">
            <span className="text-pink-300 font-bold text-lg">II</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-base">TOPIK II</p>
            <p className="text-gray-400 text-sm mt-0.5">Intermediate/Advanced — modals, indirect speech, honorifics</p>
            <p className="text-pink-400 text-xs mt-1">{topikIIGrammar.length} categories · {topikIIGrammar.reduce((n, s) => n + s.rules.length, 0)} rules</p>
          </div>
          <ChevronRight size={20} className="text-gray-600 group-hover:text-pink-400 transition-colors flex-shrink-0" />
        </button>
      </div>
    </div>
  )
}
