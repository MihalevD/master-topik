'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { ChevronDown, ChevronRight, Zap, Check, Star } from 'lucide-react'

const MIN_RULE_Q = 3
const MIN_PERFECT = 2

const GrammarRuleDetail = dynamic(() => import('./GrammarRuleDetail'))

function RuleStatusBadge({ stat }) {
  if ((stat?.perfectGames || 0) >= MIN_PERFECT) {
    return (
      <span className="flex-shrink-0 inline-flex items-center gap-1 text-[11px] bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full font-semibold">
        <Star size={9} className="fill-yellow-400" /> Mastered
      </span>
    )
  }
  if (!stat || stat.total < MIN_RULE_Q) {
    return (
      <span className="flex-shrink-0 text-[11px] bg-gray-700/50 text-gray-600 border border-gray-700 px-2 py-0.5 rounded-full">
        New
      </span>
    )
  }
  const acc = Math.round(stat.correct / stat.total * 100)
  const cls = acc >= 80
    ? 'bg-green-500/15 text-green-400 border-green-500/30'
    : acc >= 50
    ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
    : 'bg-red-500/15 text-red-400 border-red-500/30'
  return (
    <span className={`flex-shrink-0 text-[11px] border px-2 py-0.5 rounded-full font-semibold ${cls}`}>
      {acc}%
    </span>
  )
}

const colorMap = {
  purple: { badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30', dot: 'bg-purple-500', header: 'text-purple-300' },
  blue:   { badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',       dot: 'bg-blue-500',   header: 'text-blue-300'   },
  green:  { badge: 'bg-green-500/20 text-green-300 border-green-500/30',    dot: 'bg-green-500',  header: 'text-green-300'  },
  red:    { badge: 'bg-red-500/20 text-red-300 border-red-500/30',          dot: 'bg-red-500',    header: 'text-red-300'    },
  yellow: { badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', dot: 'bg-yellow-500', header: 'text-yellow-300' },
  pink:   { badge: 'bg-pink-500/20 text-pink-300 border-pink-500/30',       dot: 'bg-pink-500',   header: 'text-pink-300'   },
  orange: { badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30', dot: 'bg-orange-500', header: 'text-orange-300' },
  teal:   { badge: 'bg-teal-500/20 text-teal-300 border-teal-500/30',       dot: 'bg-teal-500',   header: 'text-teal-300'   },
  indigo: { badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', dot: 'bg-indigo-500', header: 'text-indigo-300' },
  violet: { badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30', dot: 'bg-violet-500', header: 'text-violet-300' },
  rose:   { badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',       dot: 'bg-rose-500',   header: 'text-rose-300'   },
  amber:  { badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',    dot: 'bg-amber-500',  header: 'text-amber-300'  },
  sky:    { badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30',          dot: 'bg-sky-500',    header: 'text-sky-300'    },
  emerald:{ badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', dot: 'bg-emerald-500', header: 'text-emerald-300' },
  slate:  { badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30',   dot: 'bg-slate-400',  header: 'text-slate-300'  },
  lime:   { badge: 'bg-lime-500/20 text-lime-300 border-lime-500/30',       dot: 'bg-lime-500',   header: 'text-lime-300'   },
}

export default function GrammarView({ grammarData, onBack, onStartGame, ruleStats = {} }) {
  const [openCategories, setOpenCategories] = useState({ 0: true })
  const [selectedRules, setSelectedRules] = useState(() => new Set())
  const [selectedRule, setSelectedRule] = useState(null) // { rule, si, ri, colorStr, categoryTitle }

  const toggleCategory = (i) => setOpenCategories(p => ({ ...p, [i]: !p[i] }))
  const toggleRuleSelection = (key) => setSelectedRules(prev => {
    const next = new Set(prev)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    return next
  })

  const toggleAllInCategory = (e, si, rules) => {
    e.stopPropagation()
    const keys = rules.map((_, ri) => `${si}-${ri}`)
    const allSelected = keys.every(k => selectedRules.has(k))
    setSelectedRules(prev => {
      const next = new Set(prev)
      if (allSelected) keys.forEach(k => next.delete(k))
      else keys.forEach(k => next.add(k))
      return next
    })
  }

  const allowedGameCategories = new Set(
    grammarData.flatMap((section, si) =>
      section.rules
        .filter((_, ri) => selectedRules.has(`${si}-${ri}`))
        .map(rule => rule.gameCategory ?? section.gameCategory)
    )
  )

  const canPlay = selectedRules.size > 0

  // ── Rule detail page ────────────────────────────────────────────────────────
  if (selectedRule) {
    const key = `${selectedRule.si}-${selectedRule.ri}`
    return (
      <GrammarRuleDetail
        rule={selectedRule.rule}
        stat={ruleStats[selectedRule.rule.gameCategory]}
        color={selectedRule.colorStr}
        categoryTitle={selectedRule.categoryTitle}
        isSelected={selectedRules.has(key)}
        onToggleSelect={() => toggleRuleSelection(key)}
        onBack={() => setSelectedRule(null)}
      />
    )
  }

  // ── Rule list ───────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-3">

          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 text-sm cursor-pointer transition-colors"
            >
              ← Back
            </button>
            <p className="text-gray-500 text-xs">Tick rules to quiz · tap to study</p>
            <button
              onClick={() => canPlay && onStartGame(allowedGameCategories)}
              disabled={!canPlay}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-opacity flex-shrink-0 shadow-lg ${
                canPlay
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 cursor-pointer'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Zap size={14} />
              Practice Quiz
            </button>
          </div>

          {grammarData.map((section, si) => {
            const c = colorMap[section.color] || colorMap.blue
            const isOpen = !!openCategories[si]

            // Compute mastery summary for this category
            const masteredCount = section.rules.filter(r => (ruleStats[r.gameCategory]?.perfectGames || 0) >= MIN_PERFECT).length
            const practicingCount = section.rules.filter(r => {
              const s = ruleStats[r.gameCategory]
              return s && s.total >= MIN_RULE_Q && (s.perfectGames || 0) < MIN_PERFECT
            }).length
            const allSelected = section.rules.every((_, ri) => selectedRules.has(`${si}-${ri}`))

            return (
              <div key={si} className="bg-gray-800/80 rounded-2xl border border-gray-700/50 overflow-hidden">
                <button
                  onClick={() => toggleCategory(si)}
                  className="w-full flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-700/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
                    <span className={`font-bold text-base ${c.header}`}>{section.category}</span>
                    <span className="text-xs text-gray-600 flex-shrink-0">{section.rules.length} rules</span>
                    {masteredCount > 0 && (
                      <span className="text-[11px] text-yellow-500 font-medium flex-shrink-0">
                        · {masteredCount} mastered
                      </span>
                    )}
                    {practicingCount > 0 && masteredCount === 0 && (
                      <span className="text-[11px] text-gray-500 flex-shrink-0">
                        · {practicingCount} in progress
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isOpen && (
                      <button
                        onClick={(e) => toggleAllInCategory(e, si, section.rules)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                          allSelected
                            ? 'bg-purple-600/20 text-purple-300 border-purple-500/40'
                            : 'bg-gray-700/50 text-gray-400 border-gray-600/50 hover:border-purple-500/40 hover:text-purple-300'
                        }`}
                      >
                        {allSelected ? 'Deselect All' : 'Select All'}
                      </button>
                    )}
                    {isOpen ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronRight size={16} className="text-gray-500" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-700/50 divide-y divide-gray-700/40">
                    {section.rules.map((rule, ri) => {
                      const key = `${si}-${ri}`
                      const isSelected = selectedRules.has(key)
                      return (
                        <div
                          key={ri}
                          onClick={() => setSelectedRule({ rule, si, ri, colorStr: section.color, categoryTitle: section.category })}
                          className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-gray-700/20 transition-colors"
                        >
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${c.badge}`}>
                            {ri + 1}
                          </span>
                          <span className="text-white text-sm font-semibold flex-1 min-w-0 truncate">{rule.title}</span>

                          <RuleStatusBadge stat={ruleStats[rule.gameCategory]} />

                          <button
                            onClick={(e) => { e.stopPropagation(); toggleRuleSelection(key) }}
                            className="flex-shrink-0 cursor-pointer"
                            title={isSelected ? 'Remove from quiz' : 'Add to quiz'}
                          >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                              isSelected ? 'bg-purple-600 border-purple-600' : 'border-gray-600 bg-transparent'
                            }`}>
                              {isSelected && <Check size={10} className="text-white" strokeWidth={3} />}
                            </div>
                          </button>

                          <ChevronRight size={14} className="text-gray-600 flex-shrink-0" />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
