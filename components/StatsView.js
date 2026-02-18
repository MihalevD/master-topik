'use client'

import { BarChart3 } from 'lucide-react'

export default function StatsView({ totalCompleted, streak, hardWords, accuracy, setCurrentView }) {
  return (
    <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-800">
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
            <div className="space-y-3">
              {hardWords.length > 0 ? hardWords.map((word, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-700">
                  <div>
                    <span className="text-xl font-bold text-white">{word.korean}</span>
                    <span className="text-sm ml-3 text-gray-400">({word.attempts} attempts)</span>
                  </div>
                  <div className={`text-lg font-bold ${word.accuracy < 0.3 ? 'text-red-400' : word.accuracy < 0.6 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {(word.accuracy * 100).toFixed(0)}%
                  </div>
                </div>
              )) : (
                <p className="text-center text-gray-400">Start practicing to see your stats!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
