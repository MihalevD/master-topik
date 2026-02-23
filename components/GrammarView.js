'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { ChevronDown, ChevronRight, Zap, Check, Star, MapPin } from 'lucide-react'

const MIN_RULE_Q = 3
const MIN_PERFECT = 2

const GrammarRuleDetail = dynamic(() => import('./GrammarRuleDetail'))

// ── Status badge per rule ────────────────────────────────────────────────────
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

// ── Category completion state ────────────────────────────────────────────────
// 'mastered'   — all rules have ≥ MIN_PERFECT perfect games
// 'practicing' — some rules have enough questions but not all mastered
// 'started'    — at least one rule attempted
// 'new'        — nothing touched
function getCategoryState(rules, ruleStats) {
  const allMastered   = rules.every(r => (ruleStats[r.gameCategory]?.perfectGames || 0) >= MIN_PERFECT)
  const anyPracticing = rules.some(r => (ruleStats[r.gameCategory]?.total || 0) >= MIN_RULE_Q)
  const anyStarted    = rules.some(r => (ruleStats[r.gameCategory]?.total || 0) > 0)
  if (allMastered)   return 'mastered'
  if (anyPracticing) return 'practicing'
  if (anyStarted)    return 'started'
  return 'new'
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
  // Default: expand the first non-mastered category
  const defaultOpen = () => {
    const idx = grammarData.findIndex(s => getCategoryState(s.rules, ruleStats) !== 'mastered')
    return { [idx >= 0 ? idx : 0]: true }
  }
  const [openCategories, setOpenCategories] = useState(defaultOpen)
  const [selectedRules, setSelectedRules]   = useState(() => new Set())
  const [selectedRule, setSelectedRule]     = useState(null)

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

  // Array of {gameCategory, title} for each selected rule — drives precise quiz filtering
  const selectedRuleObjects = grammarData.flatMap((section, si) =>
    section.rules
      .filter((_, ri) => selectedRules.has(`${si}-${ri}`))
      .map(rule => ({
        gameCategory: rule.gameCategory ?? section.gameCategory,
        title: rule.title,
      }))
  )

  const canPlay = selectedRules.size > 0

  // Progress summary
  const totalCats     = grammarData.length
  const masteredCats  = grammarData.filter(s => getCategoryState(s.rules, ruleStats) === 'mastered').length
  const currentStepIdx = grammarData.findIndex(s => getCategoryState(s.rules, ruleStats) !== 'mastered')

  // ── Rule detail ──────────────────────────────────────────────────────────────
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

  // ── Rule list ────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-3xl mx-auto">

          {/* Top bar */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 text-sm cursor-pointer transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={() => canPlay && onStartGame(selectedRuleObjects)}
              disabled={!canPlay}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-opacity flex-shrink-0 shadow-lg ${
                canPlay
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 cursor-pointer'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Zap size={14} />
              {selectedRules.size > 0 ? `Quiz (${selectedRules.size})` : 'Practice Quiz'}
            </button>
          </div>

          {/* Progress banner */}
          <div className="mb-4 rounded-2xl bg-gray-800/60 border border-gray-700/40 overflow-hidden">
            <div className="px-4 py-3 flex items-center gap-3">
              <MapPin size={15} className="text-purple-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                {masteredCats === totalCats ? (
                  <p className="text-sm font-semibold text-yellow-400">All {totalCats} topics mastered!</p>
                ) : currentStepIdx >= 0 ? (
                  <>
                    <p className="text-sm font-semibold text-white leading-none mb-0.5">
                      Step {currentStepIdx + 1} of {totalCats} &mdash; <span className="text-purple-300">{grammarData[currentStepIdx].category}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {masteredCats > 0
                        ? `${masteredCats} topic${masteredCats > 1 ? 's' : ''} done · `
                        : 'Open a rule to read it · '}
                      tick ○ to add to quiz
                    </p>
                  </>
                ) : null}
              </div>
              <div className="flex-shrink-0 text-right">
                <span className="text-xs text-gray-600 tabular-nums">{masteredCats}/{totalCats}</span>
              </div>
            </div>
            {/* Thin progress bar */}
            <div className="h-1 bg-gray-700/40">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-700"
                style={{ width: `${Math.max((masteredCats / totalCats) * 100, masteredCats > 0 ? 2 : 0)}%` }}
              />
            </div>
          </div>

          {/* Category list */}
          <div className="space-y-2">
            {grammarData.map((section, si) => {
              const c      = colorMap[section.color] || colorMap.blue
              const isOpen = !!openCategories[si]
              const state  = getCategoryState(section.rules, ruleStats)
              const isCurrent = si === currentStepIdx

              const masteredCount  = section.rules.filter(r => (ruleStats[r.gameCategory]?.perfectGames || 0) >= MIN_PERFECT).length
              const practicingCount = section.rules.filter(r => {
                const s = ruleStats[r.gameCategory]
                return s && s.total >= MIN_RULE_Q && (s.perfectGames || 0) < MIN_PERFECT
              }).length
              const allSelected = section.rules.every((_, ri) => selectedRules.has(`${si}-${ri}`))

              // Card border emphasis for current step
              const cardBorder = isCurrent
                ? 'border-purple-500/50 shadow-md shadow-purple-500/10'
                : state === 'mastered'
                ? 'border-yellow-500/20'
                : 'border-gray-700/50'

              return (
                <div key={si} className={`rounded-2xl border overflow-hidden transition-all ${
                  state === 'mastered' ? 'bg-gray-800/40' : 'bg-gray-800/80'
                } ${cardBorder}`}>

                  <div
                    onClick={() => toggleCategory(si)}
                    className="w-full flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-gray-700/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Step number */}
                      <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        state === 'mastered'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : isCurrent
                          ? 'bg-purple-600/40 text-purple-300'
                          : 'bg-gray-700/60 text-gray-500'
                      }`}>
                        {state === 'mastered' ? <Star size={11} className="fill-yellow-400 text-yellow-400" /> : si + 1}
                      </span>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-bold text-sm leading-none ${
                            state === 'mastered' ? 'text-gray-400' : c.header
                          }`}>
                            {section.category}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] bg-purple-600/30 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded-full font-semibold leading-none">
                              current step
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {section.rules.length} rules
                          {state === 'mastered' && ' · all mastered'}
                          {state === 'practicing' && ` · ${practicingCount} practicing`}
                          {state === 'new' && ' · not started'}
                        </p>
                      </div>
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
                          {allSelected ? 'Deselect all' : 'Select all'}
                        </button>
                      )}
                      {isOpen
                        ? <ChevronDown size={15} className="text-gray-500" />
                        : <ChevronRight size={15} className="text-gray-500" />}
                    </div>
                  </div>

                  {isOpen && (
                    <div className="border-t border-gray-700/50 divide-y divide-gray-700/30">
                      {section.rules.map((rule, ri) => {
                        const key        = `${si}-${ri}`
                        const isSelected = selectedRules.has(key)
                        const ruleStat   = ruleStats[rule.gameCategory]
                        const ruleState  = (ruleStat?.perfectGames || 0) >= MIN_PERFECT
                          ? 'mastered'
                          : (ruleStat?.total || 0) >= MIN_RULE_Q
                          ? 'practicing'
                          : 'new'

                        return (
                          <div
                            key={ri}
                            onClick={() => setSelectedRule({ rule, si, ri, colorStr: section.color, categoryTitle: section.category })}
                            className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-700/20 transition-colors ${
                              ruleState === 'mastered' ? 'opacity-55' : ''
                            }`}
                          >
                            <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${c.badge}`}>
                              {ri + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold leading-tight ${
                                ruleState === 'mastered' ? 'text-gray-500' : 'text-white'
                              }`}>
                                {rule.title}
                              </p>
                              <p className="text-[11px] text-gray-600 font-mono mt-0.5 truncate">{rule.pattern}</p>
                            </div>

                            <RuleStatusBadge stat={ruleStat} />

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

                            <ChevronRight size={13} className="text-gray-600 flex-shrink-0" />
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
    </div>
  )
}
