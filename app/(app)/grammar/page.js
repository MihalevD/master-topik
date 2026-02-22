'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/app/providers'
import dynamic from 'next/dynamic'
import { getWords } from '@/lib/words'
import { topikIGrammar, topikIIGrammar, topikIGrammarQuestions, topikIIGrammarQuestions } from '@/lib/grammar'
import { ChevronRight, Lock, Sparkles, BookOpen, Zap, Star } from 'lucide-react'

const GrammarView = dynamic(() => import('@/components/GrammarView'))
const GrammarGame  = dynamic(() => import('@/components/GrammarGame'))

export default function GrammarPage() {
  const { wordStats, saveGrammarResult, grammarStats, totalScore } = useApp()
  const grammarLocked = totalScore <= 0

  const ruleStats = grammarStats?.rule_stats || {}
  const MIN_RULE_Q = 3
  const MIN_PERFECT = 2

  function cardStats(grammarSections, levelKey) {
    const sessions      = grammarStats?.[levelKey]?.sessions || 0
    const totalRules    = grammarSections.reduce((n, s) => n + s.rules.length, 0)
    const totalCats     = grammarSections.length
    const practicedRules = grammarSections.reduce((n, s) =>
      n + s.rules.filter(r => (ruleStats[r.gameCategory]?.total || 0) >= MIN_RULE_Q).length, 0)
    const masteredRules = grammarSections.reduce((n, s) =>
      n + s.rules.filter(r => (ruleStats[r.gameCategory]?.perfectGames || 0) >= MIN_PERFECT).length, 0)
    // Next uncompleted category
    const nextCat = grammarSections.find(s =>
      s.rules.some(r => (ruleStats[r.gameCategory]?.perfectGames || 0) < MIN_PERFECT)
    )
    return { sessions, practicedRules, masteredRules, totalRules, totalCats, nextCat }
  }

  const statsI  = cardStats(topikIGrammar,  'topik_i')
  const statsII = cardStats(topikIIGrammar, 'topik_ii')

  const [level, setLevel]       = useState(null)
  const [showGame, setShowGame] = useState(false)
  const [gameCats, setGameCats] = useState(null)
  const [allWords, setAllWords] = useState([])

  useEffect(() => {
    getWords().then(({ allWords }) => setAllWords(allWords))
  }, [])

  const grammarData     = level === 'II' ? topikIIGrammar      : topikIGrammar
  const staticQuestions = level === 'II' ? topikIIGrammarQuestions : topikIGrammarQuestions

  // ── Locked ──────────────────────────────────────────────────────────────────
  if (grammarLocked) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center mb-4">
          <Lock className="text-gray-500" size={28} />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Grammar is Locked</h2>
        <p className="text-gray-500 text-sm max-w-xs">Answer at least one word in the Words section to unlock grammar study.</p>
      </div>
    )
  }

  // ── Game ────────────────────────────────────────────────────────────────────
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

  // ── Rule browser ────────────────────────────────────────────────────────────
  if (level) {
    return (
      <GrammarView
        grammarData={grammarData}
        onBack={() => setLevel(null)}
        onStartGame={(cats) => { setGameCats(cats); setShowGame(true) }}
        ruleStats={grammarStats?.rule_stats || {}}
      />
    )
  }

  // ── Landing ─────────────────────────────────────────────────────────────────
  const isNew = statsI.sessions === 0 && statsII.sessions === 0

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-5 sm:p-6">
      <div className="w-full max-w-md space-y-3">

        {/* Header */}
        <div className="mb-5 sm:mb-7">
          <p className="text-[11px] text-purple-400 font-semibold uppercase tracking-wider mb-1.5">Grammar Study</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-2">
            {isNew ? 'Learn Korean grammar,\none step at a time.' : 'Welcome back.'}
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            {isNew
              ? 'Each level is a structured path — read rules, study examples, then quiz yourself to lock it in.'
              : 'Pick up where you left off or explore a new level.'}
          </p>

          {/* How it works — only for new users */}
          {isNew && (
            <div className="flex items-center gap-2 mt-4">
              {[
                { icon: BookOpen, label: 'Read', sub: 'study the rule', color: 'text-purple-400' },
                { icon: Zap,      label: 'Quiz',  sub: 'test yourself',  color: 'text-pink-400'   },
                { icon: Star,     label: 'Master', sub: '2 perfect games', color: 'text-yellow-400' },
              ].map(({ icon: Icon, label, sub, color }, i) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="flex flex-col items-center text-center flex-1">
                    <div className={`w-8 h-8 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center mb-1 ${color}`}>
                      <Icon size={14} />
                    </div>
                    <p className="text-white text-xs font-semibold leading-none">{label}</p>
                    <p className="text-gray-600 text-[10px] mt-0.5">{sub}</p>
                  </div>
                  {i < 2 && <span className="text-gray-700 text-sm flex-shrink-0">→</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* TOPIK I */}
        <div className="relative">
          {isNew && (
            <div className="absolute -top-3 left-4 z-10">
              <span className="inline-flex items-center gap-1 text-[11px] bg-purple-600 text-white px-2.5 py-0.5 rounded-full font-bold shadow-md">
                <Sparkles size={9} /> Start here
              </span>
            </div>
          )}
          <button
            onClick={() => setLevel('I')}
            className="w-full flex items-center gap-4 p-5 rounded-2xl bg-gray-800/80 border border-purple-500/40 hover:border-purple-500/80 hover:bg-gray-800 transition-all cursor-pointer text-left group shadow-lg"
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
              <span className="text-purple-300 font-bold text-lg">I</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-white font-bold text-base">TOPIK I — Foundation</p>
                {statsI.masteredRules > 0 && (
                  <span className="text-xs text-yellow-500 font-semibold">{statsI.masteredRules} mastered</span>
                )}
              </div>
              <p className="text-gray-400 text-sm leading-snug">
                {isNew
                  ? 'Particles · verb forms · negation · connectives — the essentials'
                  : statsI.nextCat
                  ? `Up next: ${statsI.nextCat.category}`
                  : 'All categories complete!'}
              </p>
              {statsI.practicedRules > 0 ? (
                <>
                  <div className="w-full bg-gray-700/60 rounded-full h-1.5 mt-2.5 mb-1">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-purple-400 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.round((statsI.practicedRules / statsI.totalRules) * 100)}%` }}
                    />
                  </div>
                  <p className="text-gray-500 text-xs">
                    {statsI.practicedRules}/{statsI.totalRules} rules practiced · {statsI.sessions} session{statsI.sessions !== 1 ? 's' : ''}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-gray-600 text-xs mt-1.5 mb-2">
                    {statsI.totalCats} topics · {statsI.totalRules} rules
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {['이에요/예요', '은/는 · 이/가', '았/었어요', '-지 않다', '-(으)면', '-고 싶다', '에/에서', '+more'].map(p => (
                      <span key={p} className="text-[10px] font-mono text-purple-400/70 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
                        {p}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
            <ChevronRight size={20} className="text-gray-600 group-hover:text-purple-400 transition-colors flex-shrink-0" />
          </button>
        </div>

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
              <p className="text-white font-bold text-base">TOPIK II — Intermediate</p>
              {statsII.masteredRules > 0 && (
                <span className="text-xs text-yellow-500 font-semibold">{statsII.masteredRules} mastered</span>
              )}
            </div>
            <p className="text-gray-400 text-sm leading-snug">
              {statsII.practicedRules > 0 && statsII.nextCat
                ? `Up next: ${statsII.nextCat.category}`
                : 'Honorifics · indirect speech · passives · advanced patterns'}
            </p>
            {statsII.practicedRules > 0 ? (
              <>
                <div className="w-full bg-gray-700/60 rounded-full h-1.5 mt-2.5 mb-1">
                  <div
                    className="bg-gradient-to-r from-pink-500 to-pink-400 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.round((statsII.practicedRules / statsII.totalRules) * 100)}%` }}
                  />
                </div>
                <p className="text-gray-500 text-xs">
                  {statsII.practicedRules}/{statsII.totalRules} rules practiced · {statsII.sessions} session{statsII.sessions !== 1 ? 's' : ''}
                </p>
              </>
            ) : (
              <p className="text-gray-600 text-xs mt-1.5">
                {statsII.totalCats} topics · {statsII.totalRules} rules
                {isNew && <span className="ml-1 text-gray-700">· after TOPIK I</span>}
              </p>
            )}
          </div>
          <ChevronRight size={20} className="text-gray-600 group-hover:text-pink-400 transition-colors flex-shrink-0" />
        </button>

      </div>
    </div>
  )
}
