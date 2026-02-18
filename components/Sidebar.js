'use client'

import { Star, Lock, Brain, BookOpen } from 'lucide-react'

export default function Sidebar({
  dailyCorrect, dailyChallenge, score, progress,
  totalCompleted, topikIIUnlocked, currentRank, streak,
  currentWord, onReviewDifficult
}) {
  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Daily Progress */}
      <div className="bg-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-gray-400">Today</p>
            <p className="text-xl font-bold text-purple-400">{dailyCorrect}/{dailyChallenge}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Score</p>
            <p className="text-xl font-bold text-pink-400">
              <Star className="inline" size={16} /> {score}
            </p>
          </div>
        </div>

        <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
          <div
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        <button
          onClick={onReviewDifficult}
          className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
        >
          <Brain size={16} />
          Review 10 Difficult Words
        </button>
      </div>

      {/* TOPIK Progress */}
      <div className="bg-gray-800 rounded-xl p-4">
        <p className="text-sm font-bold text-white mb-3">TOPIK Progress</p>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-blue-400">TOPIK I</span>
              <span className="text-xs font-bold text-blue-300">{Math.min(totalCompleted, 500)}/500</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${Math.min((totalCompleted / 500) * 100, 100)}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className={`text-xs ${topikIIUnlocked ? 'text-purple-400' : 'text-gray-500'}`}>TOPIK II</span>
              <span className={`text-xs font-bold ${topikIIUnlocked ? 'text-purple-300' : 'text-gray-500'}`}>
                {Math.max(0, totalCompleted - 500)}/500
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className={`${topikIIUnlocked ? 'bg-purple-500' : 'bg-gray-600'} h-2 rounded-full transition-all`}
                style={{ width: `${topikIIUnlocked ? Math.min(((totalCompleted - 500) / 500) * 100, 100) : 0}%` }}
              />
            </div>
          </div>
        </div>
        {!topikIIUnlocked && (
          <div className="flex items-center gap-2 mt-3 text-gray-400 text-xs">
            <Lock size={14} />
            <span>{500 - totalCompleted} more to unlock TOPIK II</span>
          </div>
        )}
      </div>

      {/* Overall Stats */}
      <div className="bg-gray-800 rounded-xl p-4">
        <p className="text-sm font-bold text-white mb-3">Stats</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Total</span>
            <span className="font-bold text-purple-400">{totalCompleted}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Rank</span>
            <span className="font-bold text-pink-400">{currentRank.level}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Streak</span>
            <span className="font-bold text-orange-400">{streak} 🔥</span>
          </div>
        </div>
      </div>

      {/* Example */}
      <div className="bg-gray-800 rounded-xl p-4 flex-1 flex flex-col">
        <p className="text-sm font-bold text-white mb-2">
          <BookOpen className="inline mr-1" size={16} />
          Example
        </p>
        <div className="bg-gray-700 rounded-lg p-3 flex-1 flex items-center">
          <p className="text-sm text-gray-300 italic">"{currentWord.sentences[1]}"</p>
        </div>
      </div>
    </div>
  )
}
