'use client'

import { useEffect } from 'react'
import { Volume2 } from 'lucide-react'

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-green-500/40 overflow-hidden">

        {/* Correct badge */}
        <div className="pt-6 pb-2 text-center">
          {word.image ? (
            <div className="ring-2 ring-green-500/40 rounded-xl overflow-hidden shadow-lg inline-block mb-3">
              <img
                src={word.image}
                alt={word.english}
                className="w-28 h-28 object-cover"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="text-5xl md:text-6xl mb-1">✓</div>
          )}
          <p className="text-xl font-bold text-green-400">Correct!</p>
        </div>

        {/* Body */}
        <div className="p-5 md:p-6">
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2">
              <p className="text-2xl md:text-4xl font-bold text-white">{word.korean}</p>
              {onSpeak && (
                <button
                  onClick={() => onSpeak(word.korean)}
                  className="p-1.5 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors cursor-pointer"
                  title="Listen"
                >
                  <Volume2 size={18} />
                </button>
              )}
            </div>
            <p className="text-gray-400 mt-1 text-sm md:text-base">{word.english}</p>
          </div>

          <div className="bg-gray-700/50 rounded-xl p-3 md:p-4 mb-4 border border-gray-700">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Example Sentence</p>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-base md:text-lg font-bold text-white">{word.sentences[0]}</p>
              {onSpeak && (
                <button
                  onClick={() => onSpeak(word.sentences[0])}
                  className="p-1 rounded-full bg-gray-600 hover:bg-gray-500 text-gray-300 hover:text-white transition-colors cursor-pointer flex-shrink-0"
                  title="Listen to example"
                >
                  <Volume2 size={14} />
                </button>
              )}
            </div>
            <p className="text-gray-300 italic text-xs md:text-sm">{word.sentences[1]}</p>
          </div>

          <button
            onClick={onNext}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 md:py-3.5 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity cursor-pointer"
          >
            Next Word →
          </button>
        </div>
      </div>
    </div>
  )
}
