'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Sparkles, Flame, LogOut, Settings as SettingsIcon, BookMarked, Languages, X, Menu, TrendingUp, User } from 'lucide-react'
import { useApp } from '@/app/providers'
import { APP_NAME, getAchievements } from '@/lib/constants'
import { MILESTONE_PHRASES, MILESTONE_COLORS } from '@/lib/rankAchievements'
import { computeExamReadiness } from '@/lib/readiness'
import { getWords } from '@/lib/words'
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
  const { streak, totalCompleted, handleSignOut, speakKorean, wordStats, grammarStats } = useApp()
  const [readiness, setReadiness] = useState(null)

  useEffect(() => {
    getWords().then(({ topikIWords, topikIIWords }) => {
      setReadiness(computeExamReadiness(wordStats, topikIWords, topikIIWords, grammarStats))
    })
  }, [wordStats, grammarStats])
  const [showAchievementModal, setShowAchievementModal] = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [seenIds, setSeenIds] = useState(loadSeenIds)

  const isActive = (path) => pathname === path
  const nav = (path) => { setShowMobileSidebar(false); router.push(path) }

  // Milestone achievements (word count / streak milestones only — no rank)
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

  const hasNewAchievement = milestoneItems.length > 0
  const currentAchievement = milestoneItems[0] || null

  const markSeen = (id) => {
    const next = new Set(seenIds)
    next.add(id)
    setSeenIds(next)
    localStorage.setItem('seenAchievements', [...next].join(','))
  }

  const closeAchievement = () => {
    if (currentAchievement) markSeen(currentAchievement.id)
    setShowAchievementModal(false)
  }

  return (
    <>
      <div className="border-b border-gray-800">
        {/* Mobile top bar */}
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
            onClick={() => hasNewAchievement ? setShowAchievementModal(true) : nav('/profile')}
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

            {/* Progress → readiness */}
            <button
              onClick={() => nav('/readiness')}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-purple-500/40 bg-gray-800/50 cursor-pointer w-full text-left"
            >
              <TrendingUp className="text-purple-400" size={18} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-purple-400">
                  {readiness ? readiness.current.short : '–'}
                  {readiness?.next ? ` → ${readiness.next.short}` : ''}
                  {readiness ? ` · ${readiness.progress}%` : ''}
                </p>
                <p className="text-[10px] text-gray-500">View your TOPIK progress</p>
              </div>
            </button>

            <div className="border-t border-gray-800 my-3" />

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

            <div className="flex items-center gap-3">
              {/* TOPIK readiness pill */}
              <button
                onClick={() => nav('/readiness')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-800 border border-purple-500/40 cursor-pointer hover:opacity-80 transition-opacity"
              >
                <TrendingUp className="text-purple-400" size={14} />
                <div className="flex flex-col items-start leading-none">
                  <span className="font-bold text-xs text-purple-400">
                    {readiness ? readiness.current.short : '–'}
                    {readiness?.next ? ` → ${readiness.next.short}` : ''}
                  </span>
                  <span className="text-gray-500 text-[10px]">
                    {readiness ? `${readiness.progress}% to next` : 'TOPIK level'}
                  </span>
                </div>
              </button>

              {/* Streak pill */}
              <button
                onClick={() => hasNewAchievement ? setShowAchievementModal(true) : nav('/profile')}
                className="relative flex items-center gap-2 px-3 py-1 rounded-full bg-gray-800 border border-orange-500 cursor-pointer hover:opacity-80 transition-opacity"
              >
                <Flame className="text-orange-500" size={16} />
                <span className="font-bold text-white text-sm">{streak}</span>
                {hasNewAchievement && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                )}
              </button>

              {/* Profile button + dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(v => !v)}
                  className="w-9 h-9 rounded-full bg-gray-800 border border-gray-700 hover:border-purple-500/50 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <User size={17} className="text-gray-400" />
                </button>

                {showProfileMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                    <div className="absolute top-full right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden py-1.5">
                      {[
                        { path: '/dictionary', icon: <BookMarked size={15} />, label: 'Dictionary' },
                        { path: '/alphabet',   icon: <Languages size={15} />,  label: 'Hangul' },
                        { path: '/settings',   icon: <SettingsIcon size={15} />, label: 'Settings' },
                        { path: '/admin/images', icon: <SettingsIcon size={15} />, label: 'Admin' },
                      ].map(({ path, icon, label }) => (
                        <button
                          key={path}
                          onClick={() => { nav(path); setShowProfileMenu(false) }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                            isActive(path) ? 'text-purple-400 bg-purple-500/10' : 'text-gray-300 hover:bg-gray-800'
                          }`}
                        >
                          {icon}{label}
                        </button>
                      ))}
                      <div className="h-px bg-gray-800 my-1" />
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-gray-800 transition-colors cursor-pointer"
                      >
                        <LogOut size={15} />Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Milestone achievement modal */}
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
