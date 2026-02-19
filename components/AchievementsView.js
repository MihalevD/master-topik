'use client'

import { Award } from 'lucide-react'

export default function AchievementsView({ totalCompleted, streak, setCurrentView }) {
  const allAchievements = [
    { id: 'first_10', name: 'First Steps', desc: 'Learn 10 words', icon: '🎯', unlocked: totalCompleted >= 10 },
    { id: 'first_25', name: 'Quarter Century', desc: 'Learn 25 words', icon: '🌟', unlocked: totalCompleted >= 25 },
    { id: 'topik_ii', name: 'Level Up!', desc: 'Unlock TOPIK II', icon: '🔓', unlocked: totalCompleted >= 500 },
    { id: 'century', name: 'Century Club', desc: 'Learn 100 words', icon: '💯', unlocked: totalCompleted >= 100 },
    { id: 'week_streak', name: 'Dedicated', desc: '7 day streak', icon: '🔥', unlocked: streak >= 7 },
    { id: 'month_streak', name: 'Committed', desc: '30 day streak', icon: '🌙', unlocked: streak >= 30 },
  ]

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
            <Award className="inline mr-2" />
            Achievements
          </h2>
          <div className="w-24"></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 gap-4">
          {allAchievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`${
                achievement.unlocked
                  ? 'bg-gradient-to-r from-purple-900 to-pink-900 border-2 border-yellow-500'
                  : 'bg-gray-800 opacity-50 border-2 border-gray-700'
              } rounded-xl p-6 shadow-lg transition-all`}
            >
              <div className="flex items-center gap-4">
                <div className="text-5xl">{achievement.icon}</div>
                <div>
                  <h3 className="text-xl font-bold text-white">{achievement.name}</h3>
                  <p className="text-sm text-gray-400">{achievement.desc}</p>
                  {achievement.unlocked && (
                    <span className="text-xs text-green-400 font-bold">✓ Unlocked!</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
