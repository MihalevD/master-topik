'use client'

import { useEffect } from 'react'
import { Volume2, ChevronRight } from 'lucide-react'

export default function CorrectModal({ word, onNext, onSpeak }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onNext()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onNext])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
      <div className="relative bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full border border-white/[0.06] overflow-hidden">

        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500/70 to-transparent" />

        {/* Ambient glow */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-40 bg-green-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          {/* Header */}
          <div className="pt-7 pb-4 text-center px-6">
            {word.image ? (
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500/20 rounded-2xl blur-xl scale-90 translate-y-2" />
                  <img
                    src={word.image}
                    alt={word.english}
                    className="relative w-28 h-28 object-cover rounded-2xl ring-1 ring-white/10 shadow-2xl"
                    loading="lazy"
                  />
                </div>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✓</span>
              </div>
            )}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/25">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
              <span className="text-xs font-semibold text-green-400 tracking-wide">Correct!</span>
            </div>
          </div>

          {/* Body */}
          <div className="px-5 md:px-6 pb-6">
            {/* Word + translation */}
            <div className="text-center mb-5">
              <div className="flex items-center justify-center gap-2.5 mb-1">
                <p className="text-3xl md:text-4xl font-bold text-white tracking-tight">{word.korean}</p>
                {onSpeak && (
                  <button
                    onClick={() => onSpeak(word.korean)}
                    className="p-2 rounded-full bg-gray-800 hover:bg-green-600 text-gray-500 hover:text-white transition-all cursor-pointer flex-shrink-0"
                    title="Listen"
                  >
                    <Volume2 size={16} />
                  </button>
                )}
              </div>
              <p className="text-gray-500 text-sm md:text-base">{word.english}</p>
            </div>

            {/* Example sentence */}
            <div className="bg-gray-800/50 rounded-2xl p-4 mb-5 border border-white/[0.05]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-medium text-gray-600 uppercase tracking-[0.12em]">Example</span>
                {onSpeak && (
                  <button
                    onClick={() => onSpeak(word.sentences[0])}
                    className="p-1 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-500 hover:text-white transition-colors cursor-pointer flex-shrink-0"
                    title="Listen to example"
                  >
                    <Volume2 size={12} />
                  </button>
                )}
              </div>
              <p className="text-sm md:text-base font-semibold text-white leading-snug mb-1.5">{word.sentences[0]}</p>
              <p className="text-gray-500 italic text-xs md:text-sm leading-relaxed">{word.sentences[1]}</p>
            </div>

            {/* Next button */}
            <button
              onClick={onNext}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-500 text-white py-3 md:py-3.5 rounded-2xl font-bold text-base md:text-lg hover:opacity-90 transition-all cursor-pointer shadow-lg shadow-green-500/20 hover:shadow-green-500/35 flex items-center justify-center gap-1.5"
            >
              Next Word
              <ChevronRight size={18} className="opacity-70" />
            </button>

            <p className="text-center text-[10px] text-gray-700 mt-2.5">
              Press <kbd className="px-1.5 py-0.5 rounded bg-gray-800 border border-gray-700 text-gray-500 text-[9px] font-mono">Enter</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-gray-800 border border-gray-700 text-gray-500 text-[9px] font-mono">Space</kbd> to continue
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
