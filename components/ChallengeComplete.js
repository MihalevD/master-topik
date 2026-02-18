'use client'

import { Trophy } from 'lucide-react'

export default function ChallengeComplete({ score, streak, totalCompleted, onNewChallenge }) {
  return (
    <div className="h-screen bg-gray-900 flex items-center justify-center p-6">
      <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-2xl shadow-2xl p-12 text-center max-w-2xl">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-4xl font-bold mb-4">대박! Challenge Complete!</h2>
        <p className="text-xl mb-2">You scored {score} points today!</p>
        <p className="text-lg mb-6">Streak: {streak} days 🔥</p>
        {totalCompleted === 500 && (
          <div className="bg-yellow-400 text-yellow-900 rounded-xl p-4 mb-4">
            <Trophy className="inline mr-2" size={32} />
            <span className="text-xl font-bold">TOPIK II UNLOCKED!</span>
          </div>
        )}
        <button
          onClick={onNewChallenge}
          className="bg-white text-purple-600 px-8 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors cursor-pointer"
        >
          New Challenge
        </button>
      </div>
    </div>
  )
}
