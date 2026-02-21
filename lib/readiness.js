/**
 * Exam Readiness — Level system
 *
 * A level requires BOTH vocab AND grammar thresholds to be met.
 *
 * Vocab thresholds  (fraction of words "mastered" — ≥2 attempts, ≥70% accuracy):
 *   Level 1  – 25% TOPIK I
 *   Level 2  – 50% TOPIK I
 *   Level 3  – 72% TOPIK I + 20% TOPIK II
 *   Level 4  – 86% TOPIK I + 45% TOPIK II
 *   Level 5  – 90% TOPIK I + 70% TOPIK II
 *   Level 6  – 90% TOPIK I + 90% TOPIK II
 *
 * Grammar thresholds (fraction of grammar *rules* practiced — ≥3 quiz answers per category):
 *   Level 1  – 50% of TOPIK I rules practiced
 *   Level 2  – 100% of TOPIK I rules practiced
 *   Level 3  – 100% TOPIK I + 30% TOPIK II
 *   Level 4  – 100% TOPIK I + 60% TOPIK II
 *   Level 5  – 100% TOPIK I + 90% TOPIK II
 *   Level 6  – 100% TOPIK I + 100% TOPIK II
 *
 * Progress bar = 60% vocab progress + 40% grammar progress
 * Both components use a weighted average of their I and II sub-requirements.
 */

import { topikIGrammar, topikIIGrammar } from '@/lib/grammar'

const LEVELS = [
  { level: 0, label: 'Not Ready',       short: '–',   tI: 0.00, tII: 0.00, color: 'gray'   },
  { level: 1, label: 'TOPIK I · 1급',   short: '1급',  tI: 0.25, tII: 0.00, color: 'blue'   },
  { level: 2, label: 'TOPIK I · 2급',   short: '2급',  tI: 0.50, tII: 0.00, color: 'cyan'   },
  { level: 3, label: 'TOPIK II · 3급',  short: '3급',  tI: 0.72, tII: 0.20, color: 'green'  },
  { level: 4, label: 'TOPIK II · 4급',  short: '4급',  tI: 0.86, tII: 0.45, color: 'purple' },
  { level: 5, label: 'TOPIK II · 5급',  short: '5급',  tI: 0.90, tII: 0.70, color: 'pink'   },
  { level: 6, label: 'TOPIK II · 6급',  short: '6급',  tI: 0.90, tII: 0.90, color: 'yellow' },
]

// Grammar rule coverage required per level.
// A rule counts as practiced when its gameCategory has ≥ MIN_RULE_Q answers in rule_stats.
const GRAMMAR_LEVELS = [
  { gI: 0.00, gII: 0.00 }, // Level 0 — no requirement
  { gI: 0.50, gII: 0.00 }, // Level 1 — 50% of TOPIK I rules practiced
  { gI: 1.00, gII: 0.00 }, // Level 2 — 100% of TOPIK I rules practiced
  { gI: 1.00, gII: 0.30 }, // Level 3 — all TOPIK I + 30% TOPIK II
  { gI: 1.00, gII: 0.60 }, // Level 4 — all TOPIK I + 60% TOPIK II
  { gI: 1.00, gII: 0.90 }, // Level 5 — all TOPIK I + 90% TOPIK II
  { gI: 1.00, gII: 1.00 }, // Level 6 — 100% of both
]

export const READINESS_COLORS = {
  gray:   { text: 'text-gray-400',   bg: 'bg-gray-500/20',   bar: 'from-gray-500 to-gray-400'     },
  blue:   { text: 'text-blue-400',   bg: 'bg-blue-500/20',   bar: 'from-blue-500 to-cyan-500'     },
  cyan:   { text: 'text-cyan-400',   bg: 'bg-cyan-500/20',   bar: 'from-cyan-500 to-blue-400'     },
  green:  { text: 'text-green-400',  bg: 'bg-green-500/20',  bar: 'from-green-500 to-emerald-400' },
  purple: { text: 'text-purple-400', bg: 'bg-purple-500/20', bar: 'from-purple-500 to-pink-500'   },
  pink:   { text: 'text-pink-400',   bg: 'bg-pink-500/20',   bar: 'from-pink-500 to-rose-400'     },
  yellow: { text: 'text-yellow-400', bg: 'bg-yellow-500/20', bar: 'from-yellow-400 to-orange-400' },
}

// A rule is mastered when the user has completed 2 perfect game sessions for its category
const MIN_PERFECT_GAMES = 2
const clamp = (v) => Math.max(0, Math.min(1, v))

// Fraction of grammar rules that have been mastered (≥ 2 perfect game sessions per category)
function grammarRuleFrac(sections, ruleStats) {
  if (!sections?.length) return 1 // no sections → don't gate
  let total = 0, mastered = 0
  for (const s of sections) {
    for (const r of s.rules) {
      total++
      if ((ruleStats[r.gameCategory]?.perfectGames || 0) >= MIN_PERFECT_GAMES) mastered++
    }
  }
  return total > 0 ? mastered / total : 1
}

export function computeExamReadiness(wordStats, topikIWords, topikIIWords, grammarStats = {}) {
  // ── Vocabulary mastery ──────────────────────────────────────────────────────
  const mastered = (words) => words.filter(w => {
    const s = wordStats[w.korean]
    return s && s.attempts >= 2 && (s.correct / s.attempts) >= 0.7
  }).length

  const tI   = topikIWords.length  || 1
  const tII  = topikIIWords.length || 1
  const mI   = mastered(topikIWords)
  const mII  = mastered(topikIIWords)
  const ratioI  = mI  / tI
  const ratioII = mII / tII

  // ── Grammar rule coverage ───────────────────────────────────────────────────
  const ruleStats   = grammarStats?.rule_stats || {}
  const gFracI      = grammarRuleFrac(topikIGrammar,  ruleStats)
  const gFracII     = grammarRuleFrac(topikIIGrammar, ruleStats)
  const totalRulesI  = topikIGrammar.reduce( (n, s) => n + s.rules.length, 0)
  const totalRulesII = topikIIGrammar.reduce((n, s) => n + s.rules.length, 0)
  const practicedI   = Math.round(gFracI  * totalRulesI)   // mastered rules (2 perfect sessions)
  const practicedII  = Math.round(gFracII * totalRulesII)

  // Grammar accuracy (display only — does not affect level)
  const gI  = grammarStats?.topik_i
  const gII = grammarStats?.topik_ii
  const grammarIAcc  = gI  && gI.total  >= 10 ? gI.correct  / gI.total  : null
  const grammarIIAcc = gII && gII.total >= 10 ? gII.correct / gII.total : null

  // ── Find current level ──────────────────────────────────────────────────────
  // Both vocab AND grammar thresholds must be met for each level.
  let currentIdx = 0
  for (let i = 1; i < LEVELS.length; i++) {
    const L  = LEVELS[i]
    const GL = GRAMMAR_LEVELS[i]
    if (ratioI >= L.tI && ratioII >= L.tII && gFracI >= GL.gI && gFracII >= GL.gII) {
      currentIdx = i
    }
  }

  const current = LEVELS[currentIdx]
  const next    = currentIdx < LEVELS.length - 1 ? LEVELS[currentIdx + 1] : null

  // ── Progress toward next level ──────────────────────────────────────────────
  let progress = 100
  if (next) {
    const GL    = GRAMMAR_LEVELS[currentIdx + 1]
    const prevGL = GRAMMAR_LEVELS[currentIdx]

    // Vocab progress — weighted average of I and II incremental requirements
    const vDelta = next.tI - current.tI
    const vDeltaII = next.tII - current.tII
    const dI  = vDelta  > 1e-9 ? clamp((ratioI  - current.tI)  / vDelta)  : 1
    const dII = vDeltaII > 1e-9 ? clamp((ratioII - current.tII) / vDeltaII) : 1
    const wVI = Math.max(0, vDelta)
    const wVII = Math.max(0, vDeltaII)
    const wVTotal = wVI + wVII
    const vocabProgress = wVTotal > 1e-9 ? (dI * wVI + dII * wVII) / wVTotal : 1

    // Grammar progress — weighted average of I and II incremental requirements
    const gDelta  = GL.gI  - prevGL.gI
    const gDeltaII = GL.gII - prevGL.gII
    const dgI  = gDelta  > 1e-9 ? clamp((gFracI  - prevGL.gI)  / gDelta)  : 1
    const dgII = gDeltaII > 1e-9 ? clamp((gFracII - prevGL.gII) / gDeltaII) : 1
    const wGI  = Math.max(0, gDelta)
    const wGII = Math.max(0, gDeltaII)
    const wGTotal = wGI + wGII
    const grammarProgress = wGTotal > 1e-9 ? (dgI * wGI + dgII * wGII) / wGTotal : 1

    // Combined: vocab 60%, grammar 40%
    const raw = (vocabProgress * 0.6 + grammarProgress * 0.4) * 100
    progress = isNaN(raw) ? 0 : Math.round(Math.max(0, Math.min(100, raw)))
  }

  return {
    current, next, progress,
    // Vocab
    mI, mII, tI, tII,
    // Grammar coverage (guarded against NaN just in case)
    gFracI:  isNaN(gFracI)  ? 0 : gFracI,
    gFracII: isNaN(gFracII) ? 0 : gFracII,
    practicedI, practicedII,
    totalRulesI, totalRulesII,
    // Next level grammar thresholds (for "what to do" display)
    nextGI:  next ? GRAMMAR_LEVELS[currentIdx + 1].gI  : null,
    nextGII: next ? GRAMMAR_LEVELS[currentIdx + 1].gII : null,
    // Grammar accuracy (display only)
    grammarIAcc, grammarIIAcc,
    grammarISessions:  gI?.sessions  || 0,
    grammarIISessions: gII?.sessions || 0,
  }
}
