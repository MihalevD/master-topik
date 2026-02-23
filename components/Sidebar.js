'use client'

import { useState } from 'react'
import { Lock, Brain, BookOpen, Flame, ChevronRight } from 'lucide-react'
import { TOPIKII_UNLOCK_THRESHOLD, REVIEW_DIFFICULT_COUNT } from '@/lib/constants'

export default function Sidebar({
  dailyCorrect, dailyChallenge, progress,
  totalCompleted, wordProgressCount, topikIIUnlocked, streak,
  currentWord, onReviewDifficult, isReviewing
}) {
  const [showKoreanExample, setShowKoreanExample] = useState(false)

  return (
    <div className="relative bg-white/[0.03] rounded-3xl overflow-hidden border border-white/[0.07] flex flex-col">

      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/60 to-transparent" />

      {/* ── Daily progress ── */}
      <div className="p-3 md:p-4 pt-4 md:pt-5">
        <div className="flex items-center justify-between mb-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.08]">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.12em]">Today</span>
          </div>
          <p className="text-lg font-bold leading-none tabular-nums">
            <span className="text-purple-400">{dailyCorrect}</span>
            <span className="text-gray-600 text-sm font-medium">/{dailyChallenge}</span>
          </p>
        </div>

        <div className="w-full bg-white/[0.06] rounded-full h-1.5 mb-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-500 shadow-sm shadow-purple-500/40"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        <button
          onClick={onReviewDifficult}
          className="w-full bg-gradient-to-r from-red-600 to-orange-500 text-white py-2 rounded-2xl text-xs font-semibold hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-red-500/20"
        >
          <Brain size={13} />
          Review {REVIEW_DIFFICULT_COUNT} Difficult Words
        </button>
      </div>

      <div className="mx-3 md:mx-4 h-px bg-gradient-to-r from-transparent via-gray-700/60 to-transparent" />

      {/* ── TOPIK Progress ── */}
      <div className="p-3 md:p-4">
        <p className="text-[10px] font-medium text-gray-500 uppercase tracking-[0.12em] mb-2">TOPIK Progress</p>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-blue-400 font-semibold">TOPIK I</span>
              <span className="text-[10px] text-gray-600 tabular-nums">
                {Math.min(totalCompleted, TOPIKII_UNLOCK_THRESHOLD)}/{TOPIKII_UNLOCK_THRESHOLD}
              </span>
            </div>
            <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min((totalCompleted / TOPIKII_UNLOCK_THRESHOLD) * 100, 100)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className={`text-xs font-semibold ${topikIIUnlocked ? 'text-purple-400' : 'text-gray-600'}`}>
                TOPIK II
              </span>
              <span className={`text-[10px] tabular-nums ${topikIIUnlocked ? 'text-gray-600' : 'text-gray-700'}`}>
                {Math.max(0, totalCompleted - TOPIKII_UNLOCK_THRESHOLD)}/{TOPIKII_UNLOCK_THRESHOLD}
              </span>
            </div>
            <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${topikIIUnlocked ? 'bg-gradient-to-r from-purple-600 to-pink-400' : 'bg-gray-700/40'}`}
                style={{ width: `${topikIIUnlocked ? Math.min(((totalCompleted - TOPIKII_UNLOCK_THRESHOLD) / TOPIKII_UNLOCK_THRESHOLD) * 100, 100) : 0}%` }}
              />
            </div>
          </div>
        </div>
        {!topikIIUnlocked && (
          <p className="flex items-center gap-1 mt-2 text-gray-600 text-[10px]">
            <Lock size={10} className="flex-shrink-0" />
            {TOPIKII_UNLOCK_THRESHOLD - totalCompleted} more words to unlock TOPIK II
          </p>
        )}
      </div>

      <div className="mx-3 md:mx-4 h-px bg-gradient-to-r from-transparent via-gray-700/60 to-transparent" />

      {/* ── Stats ── */}
      <div className="px-3 md:px-4 py-2 md:py-2.5 flex items-center justify-around">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-purple-400 tabular-nums">{(wordProgressCount ?? totalCompleted).toLocaleString()}</span>
          <span className="text-[10px] text-gray-600">words</span>
        </div>
        <div className="w-px h-4 bg-gray-700/60" />
        <div className="flex items-center gap-1">
          <span className="text-sm font-bold text-orange-400 tabular-nums">{streak}</span>
          <Flame size={11} className="text-orange-500" />
          <span className="text-[10px] text-gray-600">streak</span>
        </div>
      </div>

      <div className="mx-3 md:mx-4 h-px bg-gradient-to-r from-transparent via-gray-700/60 to-transparent" />

      {/* ── Example sentence ── */}
      <div className="p-3 md:p-4 pb-4">
        <div className="flex items-center gap-1.5 mb-1.5">
          <BookOpen size={10} className="text-gray-500 flex-shrink-0" />
          <span className="text-[10px] font-medium text-gray-500 uppercase tracking-[0.12em]">Example</span>
          {isReviewing && (
            <span className="ml-auto text-[9px] text-gray-600 normal-case tracking-normal">tap to toggle</span>
          )}
        </div>

        {isReviewing ? (
          <button
            onClick={() => setShowKoreanExample(v => !v)}
            className="w-full text-left bg-white/[0.04] rounded-xl p-2.5 border border-white/[0.06] hover:border-purple-700/30 hover:bg-gray-800/60 transition-all cursor-pointer group"
          >
            <p className="text-xs text-gray-300 italic leading-relaxed">
              &ldquo;{showKoreanExample ? currentWord.sentences[0] : currentWord.sentences[1]}&rdquo;
            </p>
            <p className="text-[9px] text-gray-700 group-hover:text-gray-600 mt-1 flex items-center gap-0.5 transition-colors">
              {showKoreanExample ? 'Korean' : 'English'}
              <ChevronRight size={9} />
              click for {showKoreanExample ? 'English' : 'Korean'}
            </p>
          </button>
        ) : (
          <div className="bg-white/[0.04] rounded-xl p-2.5 border border-white/[0.06]">
            <p className="text-xs text-gray-400 italic leading-relaxed">
              &ldquo;{currentWord.sentences[1]}&rdquo;
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
