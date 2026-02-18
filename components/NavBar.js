'use client'

import { Sparkles, Trophy, Flame, LogOut, BarChart3, Award, Settings as SettingsIcon } from 'lucide-react'

export default function NavBar({ currentView, setCurrentView, currentRank, streak, handleSignOut }) {
  const tabClass = (view) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
      currentView === view ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'
    }`

  return (
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
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-800 border border-orange-500">
              <Flame className="text-orange-500" size={14} />
              <span className="font-bold text-white text-xs">{streak}</span>
            </div>
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
          <button onClick={() => setCurrentView('stats')} className={tabClass('stats')}>
            <BarChart3 className="inline mr-1" size={14} />
            Stats
          </button>
          <button onClick={() => setCurrentView('achievements')} className={tabClass('achievements')}>
            <Award className="inline mr-1" size={14} />
            Badges
          </button>
          <button onClick={() => setCurrentView('settings')} className={tabClass('settings')}>
            <SettingsIcon className="inline mr-1" size={14} />
            Settings
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
            <button onClick={() => setCurrentView('stats')} className={`px-4 py-2 rounded-lg ${currentView === 'stats' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'} transition-colors cursor-pointer`}>
              <BarChart3 className="inline mr-1" size={18} />
              Stats
            </button>
            <button onClick={() => setCurrentView('achievements')} className={`px-4 py-2 rounded-lg ${currentView === 'achievements' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'} transition-colors cursor-pointer`}>
              <Award className="inline mr-1" size={18} />
              Badges
            </button>
            <button onClick={() => setCurrentView('settings')} className={`px-4 py-2 rounded-lg ${currentView === 'settings' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'} transition-colors cursor-pointer`}>
              <SettingsIcon className="inline mr-1" size={18} />
              Settings
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-800 border border-purple-500">
              <Trophy className="text-purple-400" size={16} />
              <span className="font-bold text-white text-sm">{currentRank.name}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-800 border border-orange-500">
              <Flame className="text-orange-500" size={16} />
              <span className="font-bold text-white text-sm">{streak}</span>
            </div>
            <button onClick={handleSignOut} className="p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 cursor-pointer">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
