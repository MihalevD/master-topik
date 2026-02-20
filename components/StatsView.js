'use client'

import { BarChart3 } from 'lucide-react'
import { accuracyColor } from '@/lib/constants'

export default function StatsView({ totalCompleted, streak, hardWords, accuracy, setCurrentView }) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="md:hidden p-4 border-b border-gray-800">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <button
            onClick={() => setCurrentView('practice')}
            className="px-4 py-2 rounded-lg bg-gray-800 text-white shadow hover:bg-gray-700 cursor-pointer"
          >
            ← Back
          </button>
          <h2 className="text-2xl font-bold text-white">
            <BarChart3 className="inline mr-2" />
            Statistics
          </h2>
          <div className="w-24"></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-800 rounded-xl p-6 text-center">
              <p className="text-sm text-gray-400">Total Mastered</p>
              <p className="text-4xl font-bold text-purple-400">{totalCompleted}</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-6 text-center">
              <p className="text-sm text-gray-400">Overall Accuracy</p>
              <p className="text-4xl font-bold text-green-400">{accuracy}%</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-6 text-center">
              <p className="text-sm text-gray-400">Best Streak</p>
              <p className="text-4xl font-bold text-orange-400">{streak} 🔥</p>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Words to Review (Lowest Accuracy)</h3>
            {hardWords.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {hardWords.map((word, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-700 border border-gray-600">
                    <span className="font-bold text-white text-sm">{word.korean}</span>
                    <span className={`text-xs font-semibold ${accuracyColor(word.accuracy)}`}>
                      {(word.accuracy * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-400">Start practicing to see your stats!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
