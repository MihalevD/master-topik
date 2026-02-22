'use client'

import { ArrowLeft, Check, Zap, Star } from 'lucide-react'

const MIN_RULE_Q = 3
const MIN_PERFECT = 2

const colorMap = {
  purple: { badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30', accent: 'text-purple-300', header: 'text-purple-300', border: 'border-purple-500/30', bg: 'bg-purple-500/10' },
  blue:   { badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',       accent: 'text-blue-300',   header: 'text-blue-300',   border: 'border-blue-500/30',   bg: 'bg-blue-500/10'   },
  green:  { badge: 'bg-green-500/20 text-green-300 border-green-500/30',    accent: 'text-green-300',  header: 'text-green-300',  border: 'border-green-500/30',  bg: 'bg-green-500/10'  },
  red:    { badge: 'bg-red-500/20 text-red-300 border-red-500/30',          accent: 'text-red-300',    header: 'text-red-300',    border: 'border-red-500/30',    bg: 'bg-red-500/10'    },
  yellow: { badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', accent: 'text-yellow-300', header: 'text-yellow-300', border: 'border-yellow-500/30', bg: 'bg-yellow-500/10' },
  pink:   { badge: 'bg-pink-500/20 text-pink-300 border-pink-500/30',       accent: 'text-pink-300',   header: 'text-pink-300',   border: 'border-pink-500/30',   bg: 'bg-pink-500/10'   },
  orange: { badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30', accent: 'text-orange-300', header: 'text-orange-300', border: 'border-orange-500/30', bg: 'bg-orange-500/10' },
  teal:   { badge: 'bg-teal-500/20 text-teal-300 border-teal-500/30',       accent: 'text-teal-300',   header: 'text-teal-300',   border: 'border-teal-500/30',   bg: 'bg-teal-500/10'   },
  indigo: { badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', accent: 'text-indigo-300', header: 'text-indigo-300', border: 'border-indigo-500/30', bg: 'bg-indigo-500/10' },
  emerald:{ badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', accent: 'text-emerald-300', header: 'text-emerald-300', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' },
  amber:  { badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',    accent: 'text-amber-300',  header: 'text-amber-300',  border: 'border-amber-500/30',  bg: 'bg-amber-500/10'  },
  sky:    { badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30',          accent: 'text-sky-300',    header: 'text-sky-300',    border: 'border-sky-500/30',    bg: 'bg-sky-500/10'    },
  lime:   { badge: 'bg-lime-500/20 text-lime-300 border-lime-500/30',       accent: 'text-lime-300',   header: 'text-lime-300',   border: 'border-lime-500/30',   bg: 'bg-lime-500/10'   },
  rose:   { badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',       accent: 'text-rose-300',   header: 'text-rose-300',   border: 'border-rose-500/30',   bg: 'bg-rose-500/10'   },
  violet: { badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30', accent: 'text-violet-300', header: 'text-violet-300', border: 'border-violet-500/30', bg: 'bg-violet-500/10' },
  slate:  { badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30',    accent: 'text-slate-300',  header: 'text-slate-300',  border: 'border-slate-500/30',  bg: 'bg-slate-500/10'  },
}

function StatBadge({ stat }) {
  if ((stat?.perfectGames || 0) >= MIN_PERFECT) {
    return (
      <span className="inline-flex items-center gap-1 text-xs bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 px-2.5 py-1 rounded-full font-semibold">
        <Star size={10} className="fill-yellow-400" /> Mastered · {stat.perfectGames} perfect games
      </span>
    )
  }
  if (!stat || stat.total < MIN_RULE_Q) {
    return (
      <span className="inline-flex items-center gap-1 text-xs bg-gray-700/50 text-gray-500 border border-gray-700 px-2.5 py-1 rounded-full">
        Not practiced yet
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
    <span className={`inline-flex items-center gap-1 text-xs border px-2.5 py-1 rounded-full font-semibold ${cls}`}>
      {acc}% accuracy · {stat.total} questions
    </span>
  )
}

export default function GrammarRuleDetail({ rule, stat, color = 'blue', categoryTitle, isSelected, onToggleSelect, onBack }) {
  const c = colorMap[color] || colorMap.blue

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">

        {/* Sticky top nav */}
        <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm cursor-pointer transition-colors"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <button
            onClick={onToggleSelect}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
              isSelected
                ? 'bg-purple-600/20 text-purple-300 border-purple-500/40'
                : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-purple-500/40 hover:text-purple-300'
            }`}
          >
            {isSelected ? <><Check size={11} /> In Quiz</> : <><Zap size={11} /> Add to Quiz</>}
          </button>
        </div>

        <div className="p-4 md:p-6 max-w-2xl mx-auto pb-10">

          {/* Title block */}
          <div className="mb-5">
            <p className={`text-xs font-semibold uppercase tracking-wider mb-1.5 ${c.header}`}>{categoryTitle}</p>
            <h1 className="text-2xl font-bold text-white mb-2.5">{rule.title}</h1>
            <StatBadge stat={stat} />
          </div>

          {/* Pattern — accented card */}
          <section className={`rounded-2xl p-4 border mb-4 ${c.border} ${c.bg}`}>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2 font-semibold">Pattern</p>
            <p className={`text-base md:text-lg font-mono leading-relaxed ${c.accent}`}>{rule.pattern}</p>
          </section>

          {/* Key example — hero card */}
          <section className="rounded-2xl mb-4 overflow-hidden border border-gray-700/40">
            <div className="px-4 pt-3.5 pb-2.5 border-b border-gray-700/40 bg-gray-800/60">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Key Example</p>
            </div>
            <div className="px-5 py-5 bg-gray-800/20">
              <p className="text-2xl font-bold text-white leading-snug tracking-wide">{rule.example}</p>
              <div className="mt-2.5 flex items-start gap-2">
                <span className="text-[10px] text-gray-600 uppercase tracking-wider mt-0.5 flex-shrink-0">EN</span>
                <p className="text-gray-400 text-sm italic leading-snug">{rule.translation}</p>
              </div>
            </div>
          </section>

          {/* Form Table — stacked cards */}
          {rule.formTable && (
            <section className="rounded-2xl overflow-hidden border border-gray-700/40 mb-4">
              <div className="px-4 pt-3.5 pb-2.5 border-b border-gray-700/40 bg-gray-800/60 flex items-center justify-between">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Forms &amp; Conjugation</p>
                <span className="text-[10px] text-gray-700">{rule.formTable.length} form{rule.formTable.length > 1 ? 's' : ''}</span>
              </div>
              <div className={`grid gap-0 ${rule.formTable.length > 3 ? 'sm:grid-cols-2' : ''}`}>
                {rule.formTable.map((row, i) => (
                  <div
                    key={i}
                    className={`px-4 py-3.5 ${
                      i < rule.formTable.length - 1 ? 'border-b border-gray-700/30' : ''
                    } ${
                      rule.formTable.length > 3 && i % 2 === 0 && i < rule.formTable.length - 1
                        ? 'sm:border-r sm:border-b-0'
                        : ''
                    } ${i % 2 === 0 ? 'bg-gray-800/20' : 'bg-gray-800/40'}`}
                  >
                    <p className="text-[11px] text-gray-500 mb-1 leading-none">{row.condition}</p>
                    <p className={`text-lg font-bold mb-1.5 leading-tight ${c.accent}`}>{row.form}</p>
                    <p className="text-gray-400 text-xs font-mono leading-relaxed">{row.example}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Examples — numbered, big Korean */}
          {rule.examples && (
            <section className="rounded-2xl overflow-hidden border border-gray-700/40 mb-4">
              <div className="px-4 pt-3.5 pb-2.5 border-b border-gray-700/40 bg-gray-800/60 flex items-center justify-between">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Example Sentences</p>
                <span className="text-[10px] text-gray-700">{rule.examples.length} examples</span>
              </div>
              {rule.examples.map((ex, i) => (
                <div
                  key={i}
                  className={`flex gap-3 px-4 py-4 ${i < rule.examples.length - 1 ? 'border-b border-gray-700/30' : ''} ${i % 2 === 0 ? 'bg-gray-800/20' : 'bg-gray-800/40'}`}
                >
                  <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-1 ${c.badge} border`}>
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-white font-bold text-xl leading-snug">{ex.korean}</p>
                    <p className="text-gray-400 text-sm mt-1 italic leading-snug">{ex.english}</p>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Key Tip */}
          <div className="flex gap-3 bg-amber-500/5 rounded-2xl p-4 border border-amber-500/20 mb-3">
            <span className="text-base flex-shrink-0 mt-0.5">💡</span>
            <div>
              <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider mb-1.5">Key Tip</p>
              <p className="text-sm text-gray-300 leading-relaxed">{rule.note}</p>
            </div>
          </div>

          {/* Common Mistake */}
          {rule.mistake && (
            <div className="flex gap-3 bg-red-500/5 rounded-2xl p-4 border border-red-500/20 mb-3">
              <span className="text-base flex-shrink-0 mt-0.5">⚠️</span>
              <div>
                <p className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-1.5">Common Mistake</p>
                <p className="text-sm text-gray-300 leading-relaxed">{rule.mistake}</p>
              </div>
            </div>
          )}

          {/* Compare */}
          {rule.compare && (
            <div className="flex gap-3 bg-blue-500/5 rounded-2xl p-4 border border-blue-500/20 mb-3">
              <span className="text-base flex-shrink-0 mt-0.5">🔄</span>
              <div>
                <p className="text-xs text-blue-400 font-semibold uppercase tracking-wider mb-1.5">Compare With</p>
                <p className="text-sm text-gray-300 leading-relaxed">{rule.compare}</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
