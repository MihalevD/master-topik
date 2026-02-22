'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/app/providers'
import dynamic from 'next/dynamic'
import { getWords } from '@/lib/words'
import { topikIGrammar, topikIIGrammar, topikIGrammarQuestions, topikIIGrammarQuestions } from '@/lib/grammar'
import { BookOpen, ChevronRight, Lock } from 'lucide-react'

const GrammarView = dynamic(() => import('@/components/GrammarView'))
const GrammarGame = dynamic(() => import('@/components/GrammarGame'))

export default function GrammarPage() {
  const { wordStats, saveGrammarResult, grammarStats, totalScore } = useApp()
  const grammarLocked = totalScore <= 0

  const ruleStats = grammarStats?.rule_stats || {}
  const MIN_RULE_Q = 3

  function cardStats(grammarSections, levelKey) {
    const sessions = grammarStats?.[levelKey]?.sessions || 0
    const totalRules = grammarSections.reduce((n, s) => n + s.rules.length, 0)
    const practicedRules = grammarSections.reduce((n, s) =>
      n + s.rules.filter(r => (ruleStats[r.gameCategory]?.total || 0) >= MIN_RULE_Q).length, 0)
    return { sessions, practicedRules, totalRules }
  }

  const statsI  = cardStats(topikIGrammar,  'topik_i')
  const statsII = cardStats(topikIIGrammar, 'topik_ii')
  const [level, setLevel]       = useState(null)   // null | 'I' | 'II'
  const [showGame, setShowGame] = useState(false)
  const [gameCats, setGameCats] = useState(null)
  const [allWords, setAllWords] = useState([])

  useEffect(() => {
    getWords().then(({ allWords }) => setAllWords(allWords))
  }, [])

  const grammarData      = level === 'II' ? topikIIGrammar      : topikIGrammar
  const staticQuestions  = level === 'II' ? topikIIGrammarQuestions : topikIGrammarQuestions

  if (grammarLocked) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center mb-4">
          <Lock className="text-gray-500" size={28} />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Grammar Locked</h2>
        <p className="text-gray-500 text-sm max-w-xs">Complete a daily word challenge first to unlock grammar study.</p>
      </div>
    )
  }

  if (showGame) {
    return (
      <GrammarGame
        wordStats={wordStats}
        allWords={allWords}
        onClose={() => setShowGame(false)}
        onComplete={(correct, total, perCat) => saveGrammarResult(level, correct, total, perCat)}
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
        ruleStats={grammarStats?.rule_stats || {}}
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
            <div className="flex items-center justify-between mb-0.5">
              <p className="text-white font-bold text-base">TOPIK I</p>
              {statsI.practicedRules > 0 && (
                <span className="text-xs text-purple-400 font-semibold">{statsI.practicedRules}/{statsI.totalRules}</span>
              )}
            </div>
            <p className="text-gray-400 text-sm">Beginner — particles, verb forms, basic patterns</p>
            {statsI.practicedRules > 0 ? (
              <>
                <div className="w-full bg-gray-700/60 rounded-full h-1.5 mt-2.5 mb-1">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-purple-400 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.round((statsI.practicedRules / statsI.totalRules) * 100)}%` }}
                  />
                </div>
                <p className="text-gray-500 text-xs">
                  {statsI.sessions} session{statsI.sessions !== 1 ? 's' : ''} · Continue →
                </p>
              </>
            ) : (
              <p className="text-gray-600 text-xs mt-1.5">{topikIGrammar.length} categories · {statsI.totalRules} rules to explore</p>
            )}
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
            <div className="flex items-center justify-between mb-0.5">
              <p className="text-white font-bold text-base">TOPIK II</p>
              {statsII.practicedRules > 0 && (
                <span className="text-xs text-pink-400 font-semibold">{statsII.practicedRules}/{statsII.totalRules}</span>
              )}
            </div>
            <p className="text-gray-400 text-sm">Intermediate/Advanced — modals, indirect speech, honorifics</p>
            {statsII.practicedRules > 0 ? (
              <>
                <div className="w-full bg-gray-700/60 rounded-full h-1.5 mt-2.5 mb-1">
                  <div
                    className="bg-gradient-to-r from-pink-500 to-pink-400 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.round((statsII.practicedRules / statsII.totalRules) * 100)}%` }}
                  />
                </div>
                <p className="text-gray-500 text-xs">
                  {statsII.sessions} session{statsII.sessions !== 1 ? 's' : ''} · Continue →
                </p>
              </>
            ) : (
              <p className="text-gray-600 text-xs mt-1.5">{topikIIGrammar.length} categories · {statsII.totalRules} rules to explore</p>
            )}
          </div>
          <ChevronRight size={20} className="text-gray-600 group-hover:text-pink-400 transition-colors flex-shrink-0" />
        </button>
      </div>
    </div>
  )
}
