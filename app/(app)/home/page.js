'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Library, BookOpen, Lock, ChevronRight, TrendingUp } from 'lucide-react'
import { APP_NAME } from '@/lib/constants'
import { useApp } from '@/app/providers'
import { getWords } from '@/lib/words'
import { computeExamReadiness, READINESS_COLORS } from '@/lib/readiness'

export default function HomePage() {
  const router = useRouter()
  const { totalCompleted, getDueCount, wordStats, grammarStats } = useApp()
  const grammarLocked = totalCompleted < 5
  const dueCount = getDueCount()

  const [readiness, setReadiness] = useState(null)

  useEffect(() => {
    getWords().then(({ topikIWords, topikIIWords }) => {
      setReadiness(computeExamReadiness(wordStats, topikIWords, topikIIWords, grammarStats))
    })
  }, [wordStats, grammarStats])

  const rc = readiness ? READINESS_COLORS[readiness.current.color] : null
  const lvl = readiness?.current.level ?? 0

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-6">

      {/* ── Title ── */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
          {APP_NAME}
        </h1>
        <p className="text-gray-400 text-sm">What do you want to practice today?</p>
      </div>

      <div className="w-full max-w-2xl space-y-3">

        {/* ── Row 1: Words + Grammar ── */}
        <div className="grid grid-cols-2 gap-3">

          {/* Words */}
          <button
            onClick={() => router.push('/words')}
            className="group relative flex items-center gap-4 p-5 rounded-2xl bg-gray-800/80 border border-gray-700/50 hover:border-purple-500/50 hover:bg-gray-800 transition-all cursor-pointer text-left shadow-lg"
          >
            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center group-hover:bg-purple-600/30 transition-colors">
              <Library className="text-purple-400" size={28} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white font-bold text-base mb-0.5">Words</p>
              <p className="text-gray-500 text-xs leading-relaxed">Vocabulary flashcards & spaced repetition</p>
              {dueCount > 0 ? (
                <span className="inline-block mt-1.5 text-[11px] font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
                  {dueCount} due for review
                </span>
              ) : null}
            </div>
            <ChevronRight size={16} className="text-gray-600 group-hover:text-purple-400 transition-colors flex-shrink-0" />
          </button>

          {/* Grammar */}
          <div
            className={`group/g relative flex items-center gap-4 p-5 rounded-2xl border shadow-lg transition-all ${
              grammarLocked
                ? 'bg-gray-800/40 border-gray-700/30 cursor-not-allowed'
                : 'bg-gray-800/80 border-gray-700/50 hover:border-blue-500/50 hover:bg-gray-800 cursor-pointer'
            }`}
            onClick={() => !grammarLocked && router.push('/grammar')}
          >
            {grammarLocked && (
              <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-900 border border-gray-700 text-gray-300 text-xs px-3 py-1.5 rounded-lg shadow-lg opacity-0 group-hover/g:opacity-100 transition-opacity pointer-events-none z-10">
                Learn {5 - totalCompleted} more words to unlock
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-700" />
              </div>
            )}
            <div className={`flex-shrink-0 w-14 h-14 rounded-xl border flex items-center justify-center transition-colors ${
              grammarLocked
                ? 'bg-gray-700/20 border-gray-600/20'
                : 'bg-blue-600/20 border-blue-500/30 group-hover/g:bg-blue-600/30'
            }`}>
              {grammarLocked
                ? <Lock className="text-gray-600" size={24} />
                : <BookOpen className="text-blue-400" size={28} />
              }
            </div>
            <div className="min-w-0 flex-1">
              <p className={`font-bold text-base mb-0.5 ${grammarLocked ? 'text-gray-600' : 'text-white'}`}>Grammar</p>
              <p className="text-gray-500 text-xs leading-relaxed">Patterns, rules & sentence structure</p>
              {grammarLocked && (
                <span className="inline-block mt-1.5 text-[11px] font-semibold text-gray-500 bg-gray-700/40 border border-gray-700/40 px-2 py-0.5 rounded-full">
                  {5 - totalCompleted} words to unlock
                </span>
              )}
            </div>
            {!grammarLocked && (
              <ChevronRight size={16} className="text-gray-600 group-hover/g:text-blue-400 transition-colors flex-shrink-0" />
            )}
          </div>
        </div>

        {/* ── Row 2: TOPIK Proficiency Level — full width ── */}
        {readiness && rc && (
          <button
            onClick={() => router.push('/readiness')}
            className="group w-full p-5 rounded-2xl bg-gray-800/80 border border-gray-700/50 hover:border-purple-500/40 hover:bg-gray-800 transition-all cursor-pointer text-left shadow-lg"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <TrendingUp size={15} className="text-gray-400" />
                <div>
                  <p className="text-white font-bold text-sm leading-none mb-0.5">Korean Proficiency Level</p>
                  <p className="text-gray-500 text-xs">
                    급 <span className="text-gray-600">(gup)</span> — the Korean grading system · 1급 beginner → 6급 advanced
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs px-3 py-1 rounded-full font-bold ${rc.bg} ${rc.text}`}>
                  {lvl === 0 ? 'No level yet' : readiness.current.label}
                </span>
                <ChevronRight size={15} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
              </div>
            </div>

            {/* Progress bar */}
            {readiness.next ? (
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>{readiness.progress}% toward <span className="text-gray-400 font-medium">{readiness.next.short}</span> ({readiness.next.level <= 2 ? 'TOPIK I' : 'TOPIK II'})</span>
                  <span className={`font-semibold ${rc.text}`}>{readiness.progress}%</span>
                </div>
                <div className="w-full bg-gray-700/60 rounded-full h-2">
                  <div
                    className={`bg-gradient-to-r ${rc.bar} h-2 rounded-full transition-all duration-700`}
                    style={{ width: `${Math.max(readiness.progress, 1)}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-yellow-400 text-xs font-semibold">🏆 Maximum level achieved!</p>
            )}
          </button>
        )}

        {/* ── Row 3: Hangul — full width, minimal ── */}
        <div className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-purple-500/8 border border-purple-500/20">
          <span className="text-2xl flex-shrink-0">한</span>
          <div className="flex-1 min-w-0">
            <p className="text-gray-300 font-semibold text-sm">New to Korean?</p>
            <p className="text-gray-500 text-xs">Learn Hangul, the Korean alphabet — takes just a few minutes.</p>
          </div>
          <button
            onClick={() => router.push('/alphabet')}
            className="flex-shrink-0 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer transition-colors whitespace-nowrap"
          >
            Learn Hangul →
          </button>
        </div>

      </div>
    </div>
  )
}
