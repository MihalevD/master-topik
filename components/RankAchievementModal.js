'use client'

import { Volume2, X } from 'lucide-react'
import { RANK_COLOR_MAP } from '@/lib/constants'

// info shape: { emoji, title, subtitle, colorKey, phrase, romanization, translation, meaning }
export default function RankAchievementModal({ info, onClose, onSpeak }) {
  if (!info) return null

  const color = RANK_COLOR_MAP[info.colorKey] || RANK_COLOR_MAP.purple

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-3xl border border-gray-700/80 w-full max-w-sm shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header banner */}
        <div className={`bg-gradient-to-br ${color.gradient} px-6 pt-6 pb-5 border-b border-gray-700/50 relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-white cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>

          <div className="flex flex-col items-center text-center gap-2">
            <span className="text-5xl leading-none">{info.emoji}</span>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-0.5">Achievement Unlocked</p>
              <p className={`text-2xl font-bold ${color.text}`}>{info.title}</p>
              <p className="text-gray-500 text-sm">{info.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-3">
          {/* Korean phrase + inline speak button */}
          <div className="text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Korean Proverb</p>
            <div className="flex items-center justify-center gap-2">
              <p className={`text-3xl font-bold tracking-tight ${color.text}`}>{info.phrase}</p>
              <button
                type="button"
                onClick={() => onSpeak(info.phrase)}
                className="p-2 rounded-full bg-gray-700/80 hover:bg-purple-600 text-gray-400 hover:text-white transition-all cursor-pointer flex-shrink-0"
                title="Listen"
              >
                <Volume2 size={16} />
              </button>
            </div>
            <p className="text-gray-500 text-sm italic mt-1">{info.romanization}</p>
          </div>

          {/* English translation */}
          <div className="bg-gray-800/60 rounded-2xl px-4 py-3 border border-gray-700/50 text-center space-y-1">
            <p className="text-white text-base font-semibold">{info.translation}</p>
            <p className="text-gray-400 text-sm">{info.meaning}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5">
          <button
            onClick={onClose}
            className={`w-full py-3 rounded-2xl font-bold text-base cursor-pointer transition-opacity hover:opacity-90 text-white shadow-lg bg-gradient-to-r ${color.gradient}`}
          >
            Awesome! 🎉
          </button>
        </div>
      </div>
    </div>
  )
}
