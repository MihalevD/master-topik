'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Zap, Check } from 'lucide-react'

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
}

export default function GrammarView({ grammarData, onBack, onStartGame }) {
  const [openCategories, setOpenCategories] = useState({ 0: true })
  const [openRules, setOpenRules] = useState({})
  const [selectedRules, setSelectedRules] = useState(() => new Set())

  const toggleCategory = (i) => setOpenCategories(p => ({ ...p, [i]: !p[i] }))
  const toggleRule = (key) => setOpenRules(p => ({ ...p, [key]: !p[key] }))
  const toggleRuleSelection = (key) => setSelectedRules(prev => {
    const next = new Set(prev)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    return next
  })

  const allowedGameCategories = new Set(
    grammarData.flatMap((section, si) =>
      section.rules
        .filter((_, ri) => selectedRules.has(`${si}-${ri}`))
        .map(rule => rule.gameCategory ?? section.gameCategory)
    )
  )

  const canPlay = selectedRules.size > 0

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
            <p className="text-gray-500 text-sm hidden sm:block">Tick rules to include in the game.</p>
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
              Practice Game
            </button>
          </div>

          {grammarData.map((section, si) => {
            const c = colorMap[section.color] || colorMap.blue
            const isOpen = !!openCategories[si]
            return (
              <div key={si} className="bg-gray-800/80 rounded-2xl border border-gray-700/50 overflow-hidden">
                <button
                  onClick={() => toggleCategory(si)}
                  className="w-full flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-700/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${c.dot}`} />
                    <span className={`font-bold text-base ${c.header}`}>{section.category}</span>
                    <span className="text-xs text-gray-600">{section.rules.length} rules</span>
                  </div>
                  {isOpen ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronRight size={16} className="text-gray-500" />}
                </button>

                {isOpen && (
                  <div className="border-t border-gray-700/50 divide-y divide-gray-700/40">
                    {section.rules.map((rule, ri) => {
                      const key = `${si}-${ri}`
                      const ruleOpen = !!openRules[key]
                      const isSelected = selectedRules.has(key)
                      return (
                        <div key={ri}>
                          <div
                            onClick={() => toggleRule(key)}
                            className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-gray-700/20 transition-colors"
                          >
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${c.badge}`}>
                              {ri + 1}
                            </span>
                            <span className="text-white text-sm font-semibold flex-1 min-w-0 truncate">{rule.title}</span>

                            <button
                              onClick={(e) => { e.stopPropagation(); toggleRuleSelection(key) }}
                              className="flex-shrink-0 cursor-pointer"
                              title={isSelected ? 'Remove from game' : 'Add to game'}
                            >
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                isSelected ? 'bg-purple-600 border-purple-600' : 'border-gray-600 bg-transparent'
                              }`}>
                                {isSelected && <Check size={10} className="text-white" strokeWidth={3} />}
                              </div>
                            </button>

                            {ruleOpen
                              ? <ChevronDown size={14} className="text-gray-500 flex-shrink-0" />
                              : <ChevronRight size={14} className="text-gray-500 flex-shrink-0" />}
                          </div>

                          {ruleOpen && (
                            <div className="px-5 pb-4 space-y-2.5">
                              <div className="bg-gray-900/60 rounded-xl px-4 py-2.5 border border-gray-700/50">
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Pattern</p>
                                <p className="text-sm text-purple-300 font-mono">{rule.pattern}</p>
                              </div>
                              <div className="bg-gray-900/60 rounded-xl px-4 py-2.5 border border-gray-700/50">
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Example</p>
                                <p className="text-base font-bold text-white">{rule.example}</p>
                                <p className="text-sm text-gray-400 italic mt-0.5">{rule.translation}</p>
                              </div>
                              <div className="flex gap-2 px-1">
                                <span className="text-yellow-500 text-sm flex-shrink-0">💡</span>
                                <p className="text-xs text-gray-400 leading-relaxed">{rule.note}</p>
                              </div>
                            </div>
                          )}
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
