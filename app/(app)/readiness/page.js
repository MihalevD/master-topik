'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { useApp } from '@/app/providers'
import { getWords } from '@/lib/words'
import { computeExamReadiness, READINESS_COLORS } from '@/lib/readiness'

const LEVEL_STEPS = [
  { short: '—',  label: 'Not ready yet',       topik: '' },
  { short: '1급', label: 'Beginner',            topik: 'TOPIK I' },
  { short: '2급', label: 'Elementary',          topik: 'TOPIK I' },
  { short: '3급', label: 'Intermediate',        topik: 'TOPIK II' },
  { short: '4급', label: 'Upper-Intermediate',  topik: 'TOPIK II' },
  { short: '5급', label: 'Advanced',            topik: 'TOPIK II' },
  { short: '6급', label: 'Mastery',             topik: 'TOPIK II' },
]

export default function ReadinessPage() {
  const router = useRouter()
  const { wordStats, grammarStats } = useApp()
  const [readiness, setReadiness] = useState(null)

  useEffect(() => {
    getWords().then(({ topikIWords, topikIIWords }) => {
      setReadiness(computeExamReadiness(wordStats, topikIWords, topikIIWords, grammarStats))
    })
  }, [wordStats, grammarStats])

  if (!readiness) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    )
  }

  const rc  = READINESS_COLORS[readiness.current.color]
  const lvl = readiness.current.level

  // Vocab still needed for next level
  const needI  = readiness.next ? Math.max(0, Math.ceil(readiness.next.tI  * readiness.tI)  - readiness.mI)  : 0
  const needII = readiness.next ? Math.max(0, Math.ceil(readiness.next.tII * readiness.tII) - readiness.mII) : 0
  const hasTopikII = readiness.tII > 1

  // Grammar rules still needed for next level
  const needGI  = readiness.next
    ? Math.max(0, Math.ceil((readiness.nextGI  ?? 0) * readiness.totalRulesI)  - readiness.practicedI)
    : 0
  const needGII = readiness.next
    ? Math.max(0, Math.ceil((readiness.nextGII ?? 0) * readiness.totalRulesII) - readiness.practicedII)
    : 0

  const vocabDone   = needI === 0 && (!hasTopikII || needII === 0)
  const grammarDone = needGI === 0 && needGII === 0

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-6">

        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span className="text-sm">Back</span>
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-2">
          <Sparkles size={20} className="text-gray-400" />
          <h1 className="text-2xl font-bold text-white">Your TOPIK Level</h1>
          <span className={`text-sm px-3 py-1 rounded-full font-bold ${rc.bg} ${rc.text}`}>
            {lvl === 0 ? 'Not ready yet' : readiness.current.label}
          </span>
        </div>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          <span className="text-gray-300 font-medium">급 (gup)</span> means "level" in Korean.
          TOPIK is the official Korean language proficiency exam — <span className="text-gray-300">1급</span> is beginner
          and <span className="text-gray-300">6급</span> is complete mastery.
          Each level requires both <span className="text-gray-400 font-medium">vocabulary</span> (60% of progress)
          and <span className="text-gray-400 font-medium">grammar mastery</span> (40% of progress) — a rule is mastered by completing 2 perfect game sessions for it.
        </p>

        {/* Progress to next level */}
        {readiness.next && (
          <div className="mb-4 p-5 rounded-2xl bg-gray-800/80 border border-gray-700/50 shadow-xl">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-4">Progress to next level</p>
            <div className="flex items-center gap-4 mb-3">
              <div className={`flex-shrink-0 w-24 px-3 py-3 rounded-xl text-center border ${rc.bg} border-white/5`}>
                <p className={`font-bold text-2xl leading-none ${rc.text}`}>{lvl === 0 ? '—' : readiness.current.short}</p>
                <p className="text-gray-500 text-[10px] mt-1">{lvl === 0 ? 'Not yet' : lvl <= 2 ? 'TOPIK I' : 'TOPIK II'}</p>
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>{readiness.progress}% complete</span>
                  <span className="text-gray-400">{readiness.next.label}</span>
                </div>
                <div className="w-full bg-gray-700/60 rounded-full h-3">
                  <div
                    className={`bg-gradient-to-r ${rc.bar} h-3 rounded-full transition-all duration-700`}
                    style={{ width: `${Math.max(readiness.progress, 2)}%` }}
                  />
                </div>
              </div>
              <div className="flex-shrink-0 w-24 px-3 py-3 rounded-xl text-center bg-gray-700/30 border border-gray-700/50">
                <p className="font-bold text-2xl leading-none text-gray-400">{readiness.next.short}</p>
                <p className="text-gray-600 text-[10px] mt-1">{readiness.next.level <= 2 ? 'TOPIK I' : 'TOPIK II'}</p>
              </div>
            </div>

            {/* What to do */}
            <div className="bg-gray-700/40 rounded-xl px-4 py-3 mt-2 space-y-1.5">
              {/* Vocab row */}
              {!vocabDone ? (
                <p className="text-sm text-gray-200">
                  📚 Master{' '}
                  {needI > 0 && <><span className={`font-bold ${rc.text}`}>{needI}</span> more TOPIK I words</>}
                  {needI > 0 && hasTopikII && needII > 0 && <span className="text-gray-500"> + </span>}
                  {hasTopikII && needII > 0 && <><span className="font-bold text-pink-400">{needII}</span> TOPIK II words</>}
                </p>
              ) : (
                <p className="text-sm text-green-400 font-semibold">✓ Vocabulary goal met</p>
              )}
              {/* Grammar row */}
              {!grammarDone ? (
                <p className="text-sm text-gray-200">
                  ⭐ Master{' '}
                  {needGI > 0 && <><span className={`font-bold ${rc.text}`}>{needGI}</span> more TOPIK I grammar rule{needGI !== 1 ? 's' : ''}</>}
                  {needGI > 0 && needGII > 0 && <span className="text-gray-500"> + </span>}
                  {needGII > 0 && <><span className="font-bold text-pink-400">{needGII}</span> TOPIK II grammar rule{needGII !== 1 ? 's' : ''}</>}
                </p>
              ) : (
                <p className="text-sm text-green-400 font-semibold">✓ Grammar goal met</p>
              )}
            </div>
          </div>
        )}

        {!readiness.next && (
          <div className="mb-4 p-5 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 text-center">
            <p className="text-yellow-400 font-bold text-lg">🏆 Maximum TOPIK level achieved!</p>
          </div>
        )}

        {/* Score breakdown */}
        <div className="mb-4 p-5 rounded-2xl bg-gray-800/80 border border-gray-700/50 shadow-xl">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-4">Score breakdown</p>

          {/* Vocabulary */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-white text-sm font-medium">📚 Vocabulary</span>
                <span className="text-gray-600 text-xs ml-2">60% of progress</span>
              </div>
              <span className="text-xs text-gray-400">{readiness.mI} / {readiness.tI} mastered</span>
            </div>
            <div className="w-full bg-gray-700/60 rounded-full h-2.5 mb-1.5">
              <div
                className="bg-gradient-to-r from-purple-500 to-purple-400 h-2.5 rounded-full transition-all duration-700"
                style={{ width: `${Math.min((readiness.mI / readiness.tI) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-600">A word is mastered once you answer it correctly ≥70% of the time (≥2 attempts)</p>
          </div>

          {/* Grammar rules coverage */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-white text-sm font-medium">📝 Grammar Rules</span>
                <span className="text-gray-600 text-xs ml-2">40% of progress</span>
              </div>
              <span className="text-xs text-gray-400">
                ⭐ I: {readiness.practicedI}/{readiness.totalRulesI} mastered
                {readiness.totalRulesII > 0 && <> · II: {readiness.practicedII}/{readiness.totalRulesII}</>}
              </span>
            </div>

            {/* TOPIK I bar */}
            <div className="mb-2">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>TOPIK I</span>
                <span>{Math.round(readiness.gFracI * 100)}%</span>
              </div>
              <div className="w-full bg-gray-700/60 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(readiness.gFracI * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* TOPIK II bar */}
            {readiness.totalRulesII > 0 && (
              <div className="mb-2">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>TOPIK II</span>
                  <span>{Math.round(readiness.gFracII * 100)}%</span>
                </div>
                <div className="w-full bg-gray-700/60 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-pink-500 to-rose-400 h-2 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(readiness.gFracII * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}

            <p className="text-xs text-gray-600 mt-1.5">
              A rule is mastered after 2 perfect game sessions (all correct) for its category
              {(readiness.grammarIAcc !== null || readiness.grammarIIAcc !== null) && (
                <> · accuracy: {[
                  readiness.grammarIAcc  !== null ? `I ${Math.round(readiness.grammarIAcc  * 100)}%` : null,
                  readiness.grammarIIAcc !== null ? `II ${Math.round(readiness.grammarIIAcc * 100)}%` : null,
                ].filter(Boolean).join(', ')}</>
              )}
            </p>
          </div>
        </div>

        {/* Level map */}
        <div className="p-5 rounded-2xl bg-gray-800/80 border border-gray-700/50 shadow-xl">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">All TOPIK levels</p>
          <div className="space-y-1.5">
            {LEVEL_STEPS.map((step, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                  i === lvl ? `${rc.bg} border border-white/5` : ''
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                  i === lvl ? `${rc.text} bg-white/10` :
                  i < lvl  ? 'text-purple-400 bg-purple-500/10' :
                               'text-gray-600 bg-gray-700/30'
                }`}>
                  {step.short}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    i === lvl ? 'text-white' : i < lvl ? 'text-gray-400' : 'text-gray-600'
                  }`}>{step.label}</p>
                  {step.topik && (
                    <p className={`text-xs ${i === lvl ? 'text-gray-400' : 'text-gray-600'}`}>{step.topik}</p>
                  )}
                </div>
                {i === lvl && (
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${rc.bg} ${rc.text}`}>You are here</span>
                )}
                {i > 0 && i < lvl && (
                  <span className="text-xs text-purple-500 font-medium">✓</span>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
