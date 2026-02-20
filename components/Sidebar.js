'use client'

import { useState } from 'react'
import { Lock, Brain, BookOpen, Zap, Flame } from 'lucide-react'
import { TOPIKII_UNLOCK_THRESHOLD, REVIEW_DIFFICULT_COUNT } from '@/lib/constants'

export default function Sidebar({
  dailyCorrect, dailyChallenge, score, progress,
  totalCompleted, topikIIUnlocked, currentRank, streak,
  currentWord, onReviewDifficult, isReviewing
}) {
  const [showKoreanExample, setShowKoreanExample] = useState(false)

  return (
    <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden flex flex-col h-full">

      {/* ── Daily progress ── */}
      <div className="p-4 md:p-5">
        {/* Today / Score row */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-gray-900/50 rounded-xl px-3 py-2.5 border border-gray-700/50">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Today</p>
            <p className="text-xl font-bold leading-none">
              <span className="text-purple-400">{dailyCorrect}</span>
              <span className="text-gray-600 text-base">/{dailyChallenge}</span>
            </p>
          </div>
          <div className="bg-gray-900/50 rounded-xl px-3 py-2.5 border border-gray-700/50">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Score</p>
            <p className="text-xl font-bold text-pink-400 leading-none flex items-center gap-1">
              <Zap size={14} className="text-pink-500" />
              {score}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-900/60 rounded-full h-2 mb-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        {/* Review button */}
        <button
          onClick={onReviewDifficult}
          className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Brain size={14} />
          Review {REVIEW_DIFFICULT_COUNT} Difficult Words
        </button>
      </div>

      <div className="mx-4 border-t border-gray-700/50" />

      {/* ── TOPIK Progress ── */}
      <div className="p-4 md:p-5">
        <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-3">TOPIK Progress</p>
        <div className="space-y-2.5">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-blue-400 font-medium">TOPIK I</span>
              <span className="text-xs text-blue-300/70 tabular-nums">{Math.min(totalCompleted, TOPIKII_UNLOCK_THRESHOLD)}/{TOPIKII_UNLOCK_THRESHOLD}</span>
            </div>
            <div className="w-full bg-gray-900/60 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-600 to-blue-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min((totalCompleted / TOPIKII_UNLOCK_THRESHOLD) * 100, 100)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className={`text-xs font-medium ${topikIIUnlocked ? 'text-purple-400' : 'text-gray-600'}`}>TOPIK II</span>
              <span className={`text-xs tabular-nums ${topikIIUnlocked ? 'text-purple-300/70' : 'text-gray-600'}`}>
                {Math.max(0, totalCompleted - TOPIKII_UNLOCK_THRESHOLD)}/{TOPIKII_UNLOCK_THRESHOLD}
              </span>
            </div>
            <div className="w-full bg-gray-900/60 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${topikIIUnlocked ? 'bg-gradient-to-r from-purple-600 to-purple-400' : 'bg-gray-700'}`}
                style={{ width: `${topikIIUnlocked ? Math.min(((totalCompleted - TOPIKII_UNLOCK_THRESHOLD) / TOPIKII_UNLOCK_THRESHOLD) * 100, 100) : 0}%` }}
              />
            </div>
          </div>
        </div>
        {!topikIIUnlocked && (
          <p className="flex items-center gap-1 mt-2.5 text-gray-600 text-[11px]">
            <Lock size={11} />
            {TOPIKII_UNLOCK_THRESHOLD - totalCompleted} more to unlock TOPIK II
          </p>
        )}
      </div>

      <div className="mx-4 border-t border-gray-700/50" />

      {/* ── Stats ── */}
      <div className="p-4 md:p-5">
        <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-3">Stats</p>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gray-900/50 rounded-xl border border-gray-700/50 flex flex-col items-center justify-between py-2.5 px-1 min-h-[52px]">
            <p className="text-lg font-bold text-purple-400 leading-none">{totalCompleted}</p>
            <p className="text-[10px] text-gray-500 leading-none">Total</p>
          </div>
          <div className="bg-gray-900/50 rounded-xl border border-gray-700/50 flex flex-col items-center justify-between py-2.5 px-1 min-h-[52px]">
            <p className="text-xs font-bold text-pink-400 leading-none">{currentRank.level}</p>
            <p className="text-[10px] text-gray-500 leading-none">Rank</p>
          </div>
          <div className="bg-gray-900/50 rounded-xl border border-gray-700/50 flex flex-col items-center justify-between py-2.5 px-1 min-h-[52px]">
            <p className="text-lg font-bold text-orange-400 leading-none flex items-center gap-0.5">
              {streak}<Flame size={12} className="text-orange-500" />
            </p>
            <p className="text-[10px] text-gray-500 leading-none">Streak</p>
          </div>
        </div>
      </div>

      <div className="mx-4 border-t border-gray-700/50" />

      {/* ── Example sentence ── */}
      <div className="p-4 md:p-5 flex-1">
        <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <BookOpen size={11} />
          Example
          {isReviewing && (
            <span className="ml-auto text-[9px] text-gray-600 normal-case tracking-normal">tap to toggle</span>
          )}
        </p>
        {isReviewing ? (
          <button
            onClick={() => setShowKoreanExample(v => !v)}
            className="w-full text-left bg-gray-900/40 rounded-xl p-3 border border-gray-700/40 hover:border-purple-700/40 transition-colors cursor-pointer"
          >
            <p className="text-sm text-gray-300 italic leading-relaxed">
              "{showKoreanExample ? currentWord.sentences[0] : currentWord.sentences[1]}"
            </p>
            <p className="text-[10px] text-gray-600 mt-1.5">
              {showKoreanExample ? 'Korean' : 'English'} · click for {showKoreanExample ? 'English' : 'Korean'}
            </p>
          </button>
        ) : (
          <div className="bg-gray-900/40 rounded-xl p-3 border border-gray-700/40">
            <p className="text-sm text-gray-300 italic leading-relaxed">"{currentWord.sentences[1]}"</p>
          </div>
        )}
      </div>
    </div>
  )
}
