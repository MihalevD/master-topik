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
  const { totalCompleted, totalScore, getDueCount, wordStats, grammarStats } = useApp()
  const grammarLocked = totalScore <= 0
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
    <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-5 sm:py-6">

      {/* ── Title ── */}
      <div className="mb-5 sm:mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-1.5">
          {APP_NAME}
        </h1>
        <p className="text-gray-400 text-sm">What do you want to practice today?</p>
      </div>

      <div className="w-full max-w-2xl space-y-3 sm:space-y-4">

        {/* ── Row 1: Words + Grammar — stack on mobile, side-by-side on sm+ ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          {/* Words */}
          <button
            onClick={() => router.push('/words')}
            className="group relative flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:border-purple-500/50 hover:bg-white/[0.05] transition-all cursor-pointer text-left"
          >
            <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center group-hover:bg-purple-600/30 transition-colors">
              <Library className="text-purple-400" size={24} />
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
            <ChevronRight size={15} className="text-gray-600 group-hover:text-purple-400 transition-colors flex-shrink-0" />
          </button>

          {/* Grammar */}
          <div
            className={`group/g relative flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl border transition-all ${
              grammarLocked
                ? 'bg-white/[0.01] border-white/[0.04] cursor-not-allowed'
                : 'bg-white/[0.03] border-white/[0.07] hover:border-blue-500/50 hover:bg-white/[0.05] cursor-pointer'
            }`}
            onClick={() => !grammarLocked && router.push('/grammar')}
          >
            {grammarLocked && (
              <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-900 border border-gray-700 text-gray-300 text-xs px-3 py-1.5 rounded-lg shadow-lg opacity-0 group-hover/g:opacity-100 transition-opacity pointer-events-none z-10">
                Complete a daily challenge to unlock
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-700" />
              </div>
            )}
            <div className={`flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl border flex items-center justify-center transition-colors ${
              grammarLocked
                ? 'bg-gray-700/20 border-gray-600/20'
                : 'bg-blue-600/20 border-blue-500/30 group-hover/g:bg-blue-600/30'
            }`}>
              {grammarLocked
                ? <Lock className="text-gray-600" size={22} />
                : <BookOpen className="text-blue-400" size={24} />
              }
            </div>
            <div className="min-w-0 flex-1">
              <p className={`font-bold text-base mb-0.5 ${grammarLocked ? 'text-gray-600' : 'text-white'}`}>Grammar</p>
              <p className="text-gray-500 text-xs leading-relaxed">Patterns, rules & sentence structure</p>
              {grammarLocked && (
                <span className="inline-block mt-1.5 text-[11px] font-semibold text-gray-500 bg-gray-700/40 border border-gray-700/40 px-2 py-0.5 rounded-full">
                  Complete a challenge first
                </span>
              )}
            </div>
            {!grammarLocked && (
              <ChevronRight size={15} className="text-gray-600 group-hover/g:text-blue-400 transition-colors flex-shrink-0" />
            )}
          </div>
        </div>

        {/* ── Row 2: TOPIK Proficiency Level — full width ── */}
        {readiness && rc && (
          <button
            onClick={() => router.push('/readiness')}
            className="group w-full p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:border-purple-500/40 hover:bg-white/[0.05] transition-all cursor-pointer text-left"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <TrendingUp size={15} className="text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-white font-bold text-sm leading-none mb-0.5">Korean Proficiency Level</p>
                  <p className="hidden sm:block text-gray-500 text-xs mt-0.5">
                    급 <span className="text-gray-600">(gup)</span> — the Korean grading system · 1급 beginner → 6급 advanced
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
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
                  <span>
                    <span className="sm:hidden">{readiness.progress}% to </span>
                    <span className="hidden sm:inline">{readiness.progress}% toward </span>
                    <span className="text-gray-400 font-medium">{readiness.next.short}</span>
                    <span className="hidden sm:inline"> ({readiness.next.level <= 2 ? 'TOPIK I' : 'TOPIK II'})</span>
                  </span>
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
        <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 sm:py-4 rounded-2xl bg-white/[0.03] border border-purple-500/20">
          <span className="text-2xl flex-shrink-0">한</span>
          <div className="flex-1 min-w-0">
            <p className="text-gray-300 font-semibold text-sm">New to Korean?</p>
            <p className="text-gray-500 text-xs leading-relaxed">Learn the Korean alphabet — takes just minutes.</p>
          </div>
          <button
            onClick={() => router.push('/alphabet')}
            className="flex-shrink-0 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3 sm:px-4 py-2 rounded-xl cursor-pointer transition-colors whitespace-nowrap"
          >
            <span className="sm:hidden">Learn →</span>
            <span className="hidden sm:inline">Learn Hangul →</span>
          </button>
        </div>

      </div>
    </div>
  )
}
