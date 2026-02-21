'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Sparkles, Trophy, Flame, LogOut, Settings as SettingsIcon, BookMarked, Languages, X, Lock, Check, Menu } from 'lucide-react'
import { ranks } from '@/lib/ranks'
import { useApp } from '@/app/providers'
import { APP_NAME, RANK_META, RANK_COLOR_MAP, getAchievements } from '@/lib/constants'
import { RANK_ACHIEVEMENTS, MILESTONE_PHRASES, MILESTONE_COLORS } from '@/lib/rankAchievements'
import dynamic from 'next/dynamic'

const RankAchievementModal = dynamic(() => import('@/components/RankAchievementModal'))

function loadSeenIds() {
  if (typeof window === 'undefined') return new Set()
  const raw = localStorage.getItem('seenAchievements') || ''
  return new Set(raw ? raw.split(',') : [])
}

export default function NavBar() {
  const router = useRouter()
  const pathname = usePathname()
  const { getCurrentRank, streak, totalCompleted, handleSignOut, speakKorean } = useApp()
  const [showRankPopup, setShowRankPopup] = useState(false)
  const [showAchievementModal, setShowAchievementModal] = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [seenIds, setSeenIds] = useState(loadSeenIds)

  const currentRank = getCurrentRank()
  const englishName = RANK_META[currentRank?.name]?.en || currentRank?.name || ''
  const rankColor = RANK_COLOR_MAP[currentRank?.color] || RANK_COLOR_MAP.gray

  const isActive = (path) => pathname === path
  const nav = (path) => { setShowMobileSidebar(false); router.push(path) }

  // Build pending achievements queue: milestones first, then rank-up
  const milestoneItems = getAchievements(totalCompleted, streak)
    .filter(a => a.unlocked && !seenIds.has(a.id) && MILESTONE_PHRASES[a.id])
    .map(a => ({
      id: a.id,
      emoji: a.icon,
      title: a.name,
      subtitle: a.desc,
      colorKey: MILESTONE_COLORS[a.id] || 'purple',
      ...MILESTONE_PHRASES[a.id],
    }))

  const rankId = `rank_${currentRank?.name}`
  const rankItem = currentRank && RANK_ACHIEVEMENTS[currentRank.name] && !seenIds.has(rankId)
    ? {
        id: rankId,
        emoji: RANK_META[currentRank.name]?.emoji,
        title: RANK_META[currentRank.name]?.en || currentRank.name,
        subtitle: `${currentRank.name} · ${currentRank.level}`,
        colorKey: currentRank.color,
        ...RANK_ACHIEVEMENTS[currentRank.name],
      }
    : null

  const pendingQueue = [...milestoneItems, ...(rankItem ? [rankItem] : [])]
  const hasNewAchievement = pendingQueue.length > 0
  const currentAchievement = pendingQueue[0] || null

  const markSeen = (id) => {
    const next = new Set(seenIds)
    next.add(id)
    setSeenIds(next)
    localStorage.setItem('seenAchievements', [...next].join(','))
  }

  const openAchievement = () => setShowAchievementModal(true)

  const closeAchievement = () => {
    if (currentAchievement) markSeen(currentAchievement.id)
    setShowAchievementModal(false)
  }

  return (
    <>
      <div className="border-b border-gray-800">
        {/* Mobile top bar — slim single row */}
        <div className="md:hidden flex items-center justify-between px-4 h-14">
          <button
            onClick={() => setShowMobileSidebar(true)}
            className="p-2 rounded-lg bg-gray-800 text-gray-400 cursor-pointer"
          >
            <Menu size={20} />
          </button>

          <button onClick={() => nav('/home')} className="flex items-center gap-2 cursor-pointer">
            <Sparkles className="text-purple-400" size={18} />
            <h1 className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              {APP_NAME}
            </h1>
          </button>

          <button
            onClick={() => hasNewAchievement ? openAchievement() : nav('/profile')}
            className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-gray-800 border border-orange-500 cursor-pointer"
          >
            <Flame className="text-orange-500" size={14} />
            <span className="font-bold text-white text-xs">{streak}</span>
            {hasNewAchievement && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>
        </div>

        {/* Mobile sidebar overlay */}
        {showMobileSidebar && (
          <div
            className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowMobileSidebar(false)}
          />
        )}

        {/* Mobile sidebar drawer */}
        <div className={`md:hidden fixed top-0 left-0 h-full w-72 z-50 bg-gray-900 border-r border-gray-800 flex flex-col transition-transform duration-300 ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full'}`}>
          {/* Sidebar header */}
          <div className="flex items-center justify-between px-5 h-14 border-b border-gray-800 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="text-purple-400" size={18} />
              <span className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                {APP_NAME}
              </span>
            </div>
            <button
              onClick={() => setShowMobileSidebar(false)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Nav links */}
          <div className="flex flex-col gap-1 p-4 flex-1 overflow-y-auto">
            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider px-2 mb-1">Navigation</p>
            {[
              { path: '/dictionary', icon: <BookMarked size={18} />, label: 'Dictionary' },
              { path: '/alphabet', icon: <Languages size={18} />, label: 'Hangul' },
            ].map(({ path, icon, label }) => (
              <button
                key={path}
                onClick={() => nav(path)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer w-full text-left ${
                  isActive(path) ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                {icon}{label}
              </button>
            ))}
            <button
              onClick={() => nav('/admin/images')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer w-full text-left ${
                isActive('/admin/images') ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <SettingsIcon size={18} />Admin
            </button>

            <div className="border-t border-gray-800 my-3" />

            {/* Rank */}
            <button
              onClick={() => { setShowMobileSidebar(false); setShowRankPopup(true) }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${rankColor.border} bg-gray-800/50 cursor-pointer w-full text-left`}
            >
              <Trophy className={rankColor.text} size={18} />
              <div>
                <p className={`text-sm font-bold ${rankColor.text}`}>{englishName}</p>
                <p className="text-[10px] text-gray-500">Current rank</p>
              </div>
            </button>

            <div className="border-t border-gray-800 my-3" />

            {/* Settings & Logout */}
            <button
              onClick={() => nav('/settings')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer w-full text-left ${
                isActive('/settings') ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-800'
              }`}
            >
              <SettingsIcon size={18} />Settings
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-gray-800 transition-colors cursor-pointer w-full text-left"
            >
              <LogOut size={18} />Sign out
            </button>
          </div>
        </div>

        {/* Desktop layout */}
        <div className="hidden md:block p-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <button onClick={() => nav('/home')} className="flex items-center gap-3 cursor-pointer">
              <Sparkles className="text-purple-400" size={24} />
              <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                {APP_NAME}
              </h1>
            </button>

            <div className="flex gap-2">
              <button onClick={() => nav('/dictionary')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg ${isActive('/dictionary') ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'} transition-colors cursor-pointer`}>
                <BookMarked size={18} />Dictionary
              </button>
              <button onClick={() => nav('/alphabet')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg ${isActive('/alphabet') ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'} transition-colors cursor-pointer`}>
                <Languages size={18} />Hangul
              </button>
              <button onClick={() => nav('/admin/images')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg ${isActive('/admin/images') ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'} transition-colors cursor-pointer`}>
                <SettingsIcon size={18} />Admin
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
              <button
                onClick={() => hasNewAchievement ? openAchievement() : nav('/profile')}
                className="relative flex items-center gap-2 px-3 py-1 rounded-full bg-gray-800 border border-orange-500 cursor-pointer hover:opacity-80 transition-opacity"
              >
                <Flame className="text-orange-500" size={16} />
                <span className="font-bold text-white text-sm">{streak}</span>
                {hasNewAchievement && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                )}
              </button>
              <button onClick={() => nav('/settings')} className={`p-2 rounded-lg ${isActive('/settings') ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'} transition-colors cursor-pointer`}>
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
            <div className={`bg-gradient-to-br ${rankColor.gradient} px-5 pt-5 pb-4 border-b border-gray-700/50`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-400 text-xs font-medium uppercase tracking-widest mb-1">Your Rank</p>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{RANK_META[currentRank?.name]?.emoji}</span>
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

            <div className="p-3 space-y-1 max-h-72 overflow-y-auto">
              {ranks.map((r, i) => {
                const currentIdx = ranks.findIndex(x => x.name === currentRank?.name)
                const isCurrent = i === currentIdx
                const isPast    = i < currentIdx
                const c = RANK_COLOR_MAP[r.color] || RANK_COLOR_MAP.gray
                const meta = RANK_META[r.name] || { en: r.name, emoji: '⭐' }
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

      {/* Achievement modal */}
      {showAchievementModal && currentAchievement && (
        <RankAchievementModal
          info={currentAchievement}
          onClose={closeAchievement}
          onSpeak={speakKorean}
        />
      )}
    </>
  )
}
