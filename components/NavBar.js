'use client'

import { useState } from 'react'
import { Sparkles, Trophy, Flame, LogOut, Settings as SettingsIcon, BookOpen, BookMarked, Languages, X, Lock, Check } from 'lucide-react'
import { ranks } from '@/lib/words'

const rankMeta = {
  '초보자':      { en: 'Beginner',    emoji: '🌱' },
  '학습자':      { en: 'Learner',     emoji: '📖' },
  '숙련자':      { en: 'Proficient',  emoji: '⚡' },
  '고급자':      { en: 'Advanced',    emoji: '🌟' },
  '전문가':      { en: 'Expert',      emoji: '💎' },
  '마스터':      { en: 'Master',      emoji: '🏆' },
  '그랜드마스터': { en: 'Grand Master', emoji: '👑' },
  '전설':        { en: 'Legend',      emoji: '🔥' },
}

const colorMap = {
  gray:   { text: 'text-gray-400',   border: 'border-gray-500/40',   bg: 'bg-gray-500/10',   ring: 'ring-gray-500/30',   gradient: 'from-gray-500/20 to-gray-600/10'   },
  blue:   { text: 'text-blue-400',   border: 'border-blue-500/40',   bg: 'bg-blue-500/10',   ring: 'ring-blue-500/30',   gradient: 'from-blue-500/20 to-blue-600/10'   },
  cyan:   { text: 'text-cyan-400',   border: 'border-cyan-500/40',   bg: 'bg-cyan-500/10',   ring: 'ring-cyan-500/30',   gradient: 'from-cyan-500/20 to-cyan-600/10'   },
  green:  { text: 'text-green-400',  border: 'border-green-500/40',  bg: 'bg-green-500/10',  ring: 'ring-green-500/30',  gradient: 'from-green-500/20 to-green-600/10'  },
  purple: { text: 'text-purple-400', border: 'border-purple-500/40', bg: 'bg-purple-500/10', ring: 'ring-purple-500/30', gradient: 'from-purple-500/20 to-purple-600/10' },
  pink:   { text: 'text-pink-400',   border: 'border-pink-500/40',   bg: 'bg-pink-500/10',   ring: 'ring-pink-500/30',   gradient: 'from-pink-500/20 to-pink-600/10'   },
  orange: { text: 'text-orange-400', border: 'border-orange-500/40', bg: 'bg-orange-500/10', ring: 'ring-orange-500/30', gradient: 'from-orange-500/20 to-orange-600/10' },
  yellow: { text: 'text-yellow-400', border: 'border-yellow-500/40', bg: 'bg-yellow-500/10', ring: 'ring-yellow-500/30', gradient: 'from-yellow-500/20 to-yellow-600/10' },
}

export default function NavBar({ currentView, setCurrentView, currentRank, streak, handleSignOut }) {
  const [showRankPopup, setShowRankPopup] = useState(false)

  const tabClass = (view) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
      currentView === view ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'
    }`

  const englishName = rankMeta[currentRank?.name]?.en || currentRank?.name || ''
  const rankColor = colorMap[currentRank?.color] || colorMap.gray

  return (
    <>
      <div className="border-b border-gray-800">
        {/* Mobile layout */}
        <div className="md:hidden px-4 pt-3 pb-2">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="text-purple-400" size={20} />
              <h1 className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                한글 TOPIK Master
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRankPopup(true)}
                className={`flex items-center gap-1 px-2 py-1 rounded-full bg-gray-800 border ${rankColor.border} cursor-pointer hover:opacity-80 transition-opacity`}
              >
                <Trophy className={rankColor.text} size={14} />
                <span className={`font-bold text-xs ${rankColor.text}`}>{englishName}</span>
              </button>
              <button onClick={() => setCurrentView('profile')} className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-800 border border-orange-500 cursor-pointer hover:opacity-80 transition-opacity">
                <Flame className="text-orange-500" size={14} />
                <span className="font-bold text-white text-xs">{streak}</span>
              </button>
              <button
                onClick={() => setCurrentView('settings')}
                className={`p-2 rounded-lg ${currentView === 'settings' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'} cursor-pointer`}
              >
                <SettingsIcon size={16} />
              </button>
              <button
                onClick={handleSignOut}
                className="p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 cursor-pointer"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
            <button onClick={() => setCurrentView('practice')} className={tabClass('practice')}>
              Practice
            </button>
            <button onClick={() => setCurrentView('learn')} className={tabClass('learn')}>
              <BookOpen className="inline mr-1" size={14} />
              Learn
            </button>
            <button onClick={() => setCurrentView('dictionary')} className={tabClass('dictionary')}>
              <BookMarked className="inline mr-1" size={14} />
              Dictionary
            </button>
            <button onClick={() => setCurrentView('alphabet')} className={tabClass('alphabet')}>
              <Languages className="inline mr-1" size={14} />
              Hangul
            </button>
          </div>
        </div>

        {/* Desktop layout */}
        <div className="hidden md:block p-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Sparkles className="text-purple-400" size={24} />
              <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                한글 TOPIK Master
              </h1>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setCurrentView('practice')} className={`px-4 py-2 rounded-lg ${currentView === 'practice' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'} transition-colors cursor-pointer`}>
                Practice
              </button>
              <button onClick={() => setCurrentView('learn')} className={`px-4 py-2 rounded-lg ${currentView === 'learn' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'} transition-colors cursor-pointer`}>
                <BookOpen className="inline mr-1" size={18} />
                Learn
              </button>
              <button onClick={() => setCurrentView('dictionary')} className={`px-4 py-2 rounded-lg ${currentView === 'dictionary' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'} transition-colors cursor-pointer`}>
                <BookMarked className="inline mr-1" size={18} />
                Dictionary
              </button>
              <button onClick={() => setCurrentView('alphabet')} className={`px-4 py-2 rounded-lg ${currentView === 'alphabet' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'} transition-colors cursor-pointer`}>
                <Languages className="inline mr-1" size={18} />
                Hangul
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowRankPopup(true)}
                className={`flex items-center gap-2 px-3 py-1 rounded-full bg-gray-800 border ${rankColor.border} cursor-pointer hover:opacity-80 transition-opacity`}
              >
                <Trophy className={rankColor.text} size={16} />
                <span className={`font-bold text-sm ${rankColor.text}`}>{englishName}</span>
              </button>
              <button onClick={() => setCurrentView('profile')} className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-800 border border-orange-500 cursor-pointer hover:opacity-80 transition-opacity">
                <Flame className="text-orange-500" size={16} />
                <span className="font-bold text-white text-sm">{streak}</span>
              </button>
              <button onClick={() => setCurrentView('settings')} className={`p-2 rounded-lg ${currentView === 'settings' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'} transition-colors cursor-pointer`}>
                <SettingsIcon size={18} />
              </button>
              <button onClick={handleSignOut} className="p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 cursor-pointer">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Rank popup */}
      {showRankPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          onClick={() => setShowRankPopup(false)}
        >
          <div
            className="bg-gray-900 rounded-2xl border border-gray-700/80 w-full max-w-xs shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`bg-gradient-to-br ${rankColor.gradient} px-5 pt-5 pb-4 border-b border-gray-700/50`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-400 text-xs font-medium uppercase tracking-widest mb-1">Your Rank</p>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{rankMeta[currentRank?.name]?.emoji}</span>
                    <div>
                      <p className={`text-xl font-bold ${rankColor.text}`}>{englishName}</p>
                      <p className="text-gray-500 text-xs">{currentRank?.name} · {currentRank?.level}</p>
                    </div>
                  </div>
                </div>
                <button onClick={() => setShowRankPopup(false)} className="text-gray-500 hover:text-white cursor-pointer transition-colors mt-0.5">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Rank list */}
            <div className="p-3 space-y-1 max-h-72 overflow-y-auto">
              {ranks.map((r, i) => {
                const currentIdx = ranks.findIndex(x => x.name === currentRank?.name)
                const isCurrent = i === currentIdx
                const isPast    = i < currentIdx
                const c = colorMap[r.color] || colorMap.gray
                const meta = rankMeta[r.name] || { en: r.name, emoji: '⭐' }
                const xpRange = r.max === Infinity ? `${r.min.toLocaleString()}+` : `${r.min.toLocaleString()} – ${r.max.toLocaleString()}`
                return (
                  <div
                    key={r.name}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl border transition-colors ${
                      isCurrent ? `${c.bg} ${c.border} ring-1 ${c.ring}` :
                      isPast    ? 'border-gray-700/30 bg-gray-800/20' :
                                  'border-gray-800/50 bg-transparent'
                    }`}
                  >
                    <span className={`text-lg leading-none ${!isCurrent && !isPast ? 'opacity-30' : ''}`}>{meta.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-sm font-semibold ${isCurrent ? c.text : isPast ? 'text-gray-400' : 'text-gray-600'}`}>
                          {meta.en}
                        </span>
                        {isCurrent && (
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${c.bg} ${c.text} border ${c.border}`}>you</span>
                        )}
                      </div>
                      <p className={`text-xs ${isCurrent ? 'text-gray-400' : isPast ? 'text-gray-600' : 'text-gray-700'}`}>
                        {xpRange} XP
                      </p>
                    </div>
                    {isPast && <Check size={14} className="text-gray-600 flex-shrink-0" />}
                    {!isCurrent && !isPast && <Lock size={12} className="text-gray-700 flex-shrink-0" />}
                  </div>
                )
              })}
            </div>

            <div className="px-4 py-3 border-t border-gray-800">
              <p className="text-gray-600 text-xs text-center">XP earned by practicing vocabulary</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
