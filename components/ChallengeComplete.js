'use client'

import { Trophy, ChevronRight, RotateCcw } from 'lucide-react'
import { TOPIKII_UNLOCK_THRESHOLD } from '@/lib/constants'

export default function ChallengeComplete({ streak, totalCompleted, dailyCorrect, dailySkipped, onReview, onNewChallenge }) {
  const accuracy = dailyCorrect + dailySkipped > 0
    ? Math.round((dailyCorrect / (dailyCorrect + dailySkipped)) * 100)
    : 0

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="relative bg-gray-900 rounded-3xl shadow-2xl border border-white/[0.06] overflow-hidden max-w-lg w-full text-center">

        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500/60 to-transparent" />

        {/* Ambient glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-52 bg-green-600/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative px-8 pt-10 pb-8">
          {/* Emoji + heading */}
          <div className="text-5xl mb-5">🎉</div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">대박!</h2>
          <p className="text-gray-400 text-base mb-1">Challenge Complete</p>
          <p className="text-orange-400 font-semibold text-sm mb-7">{streak} day streak 🔥</p>

          {/* Stats breakdown */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-gray-800/60 rounded-2xl border border-white/[0.05] py-4">
              <p className="text-2xl font-bold text-green-400 tabular-nums">{dailyCorrect}</p>
              <p className="text-[11px] text-gray-500 mt-1">Correct</p>
            </div>
            <div className="bg-gray-800/60 rounded-2xl border border-white/[0.05] py-4">
              <p className="text-2xl font-bold text-gray-400 tabular-nums">{dailySkipped}</p>
              <p className="text-[11px] text-gray-500 mt-1">Skipped</p>
            </div>
            <div className="bg-gray-800/60 rounded-2xl border border-white/[0.05] py-4">
              <p className={`text-2xl font-bold tabular-nums ${accuracy >= 80 ? 'text-green-400' : accuracy >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                {accuracy}%
              </p>
              <p className="text-[11px] text-gray-500 mt-1">Accuracy</p>
            </div>
          </div>

          {/* TOPIK II unlock badge */}
          {totalCompleted === TOPIKII_UNLOCK_THRESHOLD && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 mb-5 flex items-center justify-center gap-3">
              <Trophy className="text-yellow-400 flex-shrink-0" size={24} />
              <span className="text-yellow-400 font-bold text-base">TOPIK II Unlocked!</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onReview}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700/80 text-gray-300 hover:text-white px-6 py-3 rounded-2xl font-semibold text-sm transition-all cursor-pointer border border-white/[0.05]"
            >
              <RotateCcw size={15} />
              Review Today&apos;s Words
            </button>
            <button
              onClick={onNewChallenge}
              className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:opacity-90 transition-all cursor-pointer shadow-lg shadow-purple-500/20 hover:shadow-purple-500/35"
            >
              New Challenge
              <ChevronRight size={16} className="opacity-70" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
