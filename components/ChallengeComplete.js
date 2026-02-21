'use client'

import { Trophy } from 'lucide-react'
import { TOPIKII_UNLOCK_THRESHOLD } from '@/lib/constants'

export default function ChallengeComplete({ streak, totalCompleted, dailyCorrect, dailySkipped, onReview, onNewChallenge }) {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-2xl shadow-2xl p-12 text-center max-w-2xl">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-4xl font-bold mb-4">대박! Challenge Complete!</h2>
        <p className="text-lg mb-4">Streak: {streak} days 🔥</p>

        {/* #15 — breakdown */}
        <div className="bg-white/20 rounded-xl p-4 mb-6 flex justify-center gap-8 text-sm">
          <div>
            <p className="font-bold text-2xl">{dailyCorrect}</p>
            <p className="opacity-80">Correct</p>
          </div>
          <div>
            <p className="font-bold text-2xl">{dailySkipped}</p>
            <p className="opacity-80">Skipped</p>
          </div>
          <div>
            <p className="font-bold text-2xl">
              {dailyCorrect + dailySkipped > 0
                ? Math.round((dailyCorrect / (dailyCorrect + dailySkipped)) * 100)
                : 0}%
            </p>
            <p className="opacity-80">Accuracy</p>
          </div>
        </div>

        {totalCompleted === TOPIKII_UNLOCK_THRESHOLD && (
          <div className="bg-yellow-400 text-yellow-900 rounded-xl p-4 mb-4">
            <Trophy className="inline mr-2" size={32} />
            <span className="text-xl font-bold">TOPIK II UNLOCKED!</span>
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onReview}
            className="bg-white/20 hover:bg-white/30 text-white px-8 py-3 rounded-xl font-bold transition-colors cursor-pointer"
          >
            Review Today's Words
          </button>
          <button
            onClick={onNewChallenge}
            className="bg-white text-purple-600 px-8 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors cursor-pointer"
          >
            New Challenge →
          </button>
        </div>
      </div>
    </div>
  )
}
