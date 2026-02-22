// ── Game rules ────────────────────────────────────────────────────────────────
export const TOPIKII_UNLOCK_THRESHOLD = 500
export const DEFAULT_DAILY_CHALLENGE  = 25
export const REVIEW_DIFFICULT_COUNT   = 10

export const DAILY_CHALLENGE_OPTIONS = [
  { value: 1,  label: '1 word (Test)'       },
  { value: 10, label: '10 words (Quick)'    },
  { value: 25, label: '25 words (Standard)' },
  { value: 50, label: '50 words (Intense)'  },
]

export const ACCURACY_THRESHOLDS = {
  LOW: 0.3,  // below → red
  MID: 0.6,  // below → yellow, above → green
}

export const STREAK_THRESHOLDS = {
  WEEK:  7,
  MONTH: 30,
}

// ── Accuracy color helper ─────────────────────────────────────────────────────
export const accuracyColor = (accuracy) =>
  accuracy < ACCURACY_THRESHOLDS.LOW ? 'text-red-400'
  : accuracy < ACCURACY_THRESHOLDS.MID ? 'text-yellow-400'
  : 'text-green-400'

// ── Achievements ──────────────────────────────────────────────────────────────
export const getAchievements = (totalCompleted, streak) => [
  { id: 'first_10',     name: 'First Steps',    desc: 'Learn 10 words',  icon: '🎯', unlocked: totalCompleted >= 10 },
  { id: 'first_25',     name: 'Quarter Century', desc: 'Learn 25 words',  icon: '🌟', unlocked: totalCompleted >= 25 },
  { id: 'century',      name: 'Century Club',   desc: 'Learn 100 words', icon: '💯', unlocked: totalCompleted >= 100 },
  { id: 'topik_ii',     name: 'Level Up!',      desc: 'Unlock TOPIK II', icon: '🔓', unlocked: totalCompleted >= TOPIKII_UNLOCK_THRESHOLD },
  { id: 'week_streak',  name: 'Dedicated',      desc: '7 day streak',    icon: '🔥', unlocked: streak >= STREAK_THRESHOLDS.WEEK },
  { id: 'month_streak', name: 'Committed',      desc: '30 day streak',   icon: '🌙', unlocked: streak >= STREAK_THRESHOLDS.MONTH },
]

// ── App branding ──────────────────────────────────────────────────────────────
export const APP_NAME = '한글 TOPIK Master'

// ── Rank display metadata ─────────────────────────────────────────────────────
export const RANK_META = {
  '초보자':       { en: 'Beginner',    emoji: '🌱' },
  '학습자':       { en: 'Learner',     emoji: '📖' },
  '숙련자':       { en: 'Proficient',  emoji: '⚡' },
  '고급자':       { en: 'Advanced',    emoji: '🌟' },
  '전문가':       { en: 'Expert',      emoji: '💎' },
  '마스터':       { en: 'Master',      emoji: '🏆' },
  '그랜드마스터':  { en: 'Grand Master', emoji: '👑' },
  '전설':         { en: 'Legend',      emoji: '🔥' },
}

// Tailwind classes keyed by the color name stored in ranks.js
export const RANK_COLOR_MAP = {
  gray:   { text: 'text-gray-400',   border: 'border-gray-500/40',   bg: 'bg-gray-500/10',   ring: 'ring-gray-500/30',   gradient: 'from-gray-500/20 to-gray-600/10'   },
  blue:   { text: 'text-blue-400',   border: 'border-blue-500/40',   bg: 'bg-blue-500/10',   ring: 'ring-blue-500/30',   gradient: 'from-blue-500/20 to-blue-600/10'   },
  cyan:   { text: 'text-cyan-400',   border: 'border-cyan-500/40',   bg: 'bg-cyan-500/10',   ring: 'ring-cyan-500/30',   gradient: 'from-cyan-500/20 to-cyan-600/10'   },
  green:  { text: 'text-green-400',  border: 'border-green-500/40',  bg: 'bg-green-500/10',  ring: 'ring-green-500/30',  gradient: 'from-green-500/20 to-green-600/10'  },
  purple: { text: 'text-purple-400', border: 'border-purple-500/40', bg: 'bg-purple-500/10', ring: 'ring-purple-500/30', gradient: 'from-purple-500/20 to-purple-600/10' },
  pink:   { text: 'text-pink-400',   border: 'border-pink-500/40',   bg: 'bg-pink-500/10',   ring: 'ring-pink-500/30',   gradient: 'from-pink-500/20 to-pink-600/10'   },
  orange: { text: 'text-orange-400', border: 'border-orange-500/40', bg: 'bg-orange-500/10', ring: 'ring-orange-500/30', gradient: 'from-orange-500/20 to-orange-600/10' },
  yellow: { text: 'text-yellow-400', border: 'border-yellow-500/40', bg: 'bg-yellow-500/10', ring: 'ring-yellow-500/30', gradient: 'from-yellow-500/20 to-yellow-600/10' },
}
