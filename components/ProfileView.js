'use client'

import { BarChart3, Award } from 'lucide-react'

const allAchievements = (totalCompleted, streak) => [
  { id: 'first_10',    name: 'First Steps',     desc: 'Learn 10 words',    icon: '🎯', unlocked: totalCompleted >= 10  },
  { id: 'first_25',   name: 'Quarter Century',  desc: 'Learn 25 words',    icon: '🌟', unlocked: totalCompleted >= 25  },
  { id: 'century',    name: 'Century Club',     desc: 'Learn 100 words',   icon: '💯', unlocked: totalCompleted >= 100 },
  { id: 'topik_ii',   name: 'Level Up!',        desc: 'Unlock TOPIK II',   icon: '🔓', unlocked: totalCompleted >= 500 },
  { id: 'week_streak',  name: 'Dedicated',      desc: '7 day streak',      icon: '🔥', unlocked: streak >= 7  },
  { id: 'month_streak', name: 'Committed',      desc: '30 day streak',     icon: '🌙', unlocked: streak >= 30 },
]

export default function ProfileView({ totalCompleted, streak, hardWords, accuracy }) {
  const achievements = allAchievements(totalCompleted, streak)
  const unlocked = achievements.filter(a => a.unlocked).length

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-4 space-y-6">

          {/* Streak hero */}
          <div className="bg-gradient-to-br from-orange-500/20 to-red-500/10 border border-orange-500/30 rounded-2xl p-5 flex items-center gap-4">
            <span className="text-5xl">🔥</span>
            <div>
              <p className="text-orange-400 text-xs font-semibold uppercase tracking-widest mb-0.5">Current Streak</p>
              <p className="text-white text-4xl font-bold">{streak} <span className="text-gray-400 text-lg font-normal">days</span></p>
            </div>
          </div>

          {/* Stats grid */}
          <div>
            <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <BarChart3 size={13} /> Statistics
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800/80 rounded-xl p-4 text-center border border-gray-700/50">
                <p className="text-xs text-gray-500 mb-1">Words Mastered</p>
                <p className="text-3xl font-bold text-purple-400">{totalCompleted}</p>
              </div>
              <div className="bg-gray-800/80 rounded-xl p-4 text-center border border-gray-700/50">
                <p className="text-xs text-gray-500 mb-1">Accuracy</p>
                <p className="text-3xl font-bold text-green-400">{accuracy}%</p>
              </div>
            </div>
          </div>

          {/* Hard words */}
          {hardWords.length > 0 && (
            <div className="bg-gray-800/60 rounded-xl border border-gray-700/50 p-4">
              <h3 className="text-white text-sm font-bold mb-3">Words to Review</h3>
              <div className="flex flex-wrap gap-2">
                {hardWords.map((word, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-700/60 border border-gray-600/50">
                    <span className="font-bold text-white text-sm">{word.korean}</span>
                    <span className={`text-xs font-semibold ${word.accuracy < 0.3 ? 'text-red-400' : word.accuracy < 0.6 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {(word.accuracy * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Badges */}
          <div>
            <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Award size={13} /> Badges
              <span className="ml-auto text-gray-600 text-xs normal-case font-normal">{unlocked}/{achievements.length} unlocked</span>
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {achievements.map((a) => (
                <div
                  key={a.id}
                  className={`rounded-xl p-4 border transition-all ${
                    a.unlocked
                      ? 'bg-gradient-to-br from-purple-900/60 to-pink-900/40 border-yellow-500/50'
                      : 'bg-gray-800/40 border-gray-700/30 opacity-50'
                  }`}
                >
                  <div className="text-3xl mb-2">{a.icon}</div>
                  <p className="text-white text-sm font-bold leading-tight">{a.name}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{a.desc}</p>
                  {a.unlocked && <p className="text-green-400 text-xs font-semibold mt-1">✓ Unlocked</p>}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
