'use client'

import { useState, useRef, useEffect } from 'react'
import { Eye, EyeOff, BookOpen, Brain, Volume2, RefreshCw } from 'lucide-react'
import { KEY_MAP, EMPTY_STATE, getFullText, addJamo, backspace } from '@/lib/hangulComposer'

export default function PracticeCard({
  word, input, setInput, feedback, setFeedback,
  showHint, setShowHint, showExample, setShowExample,
  handleSubmit, handleNextWord, currentWordDifficulty,
  reverseMode, onSpeak,
}) {
  const [krMode, setKrMode] = useState(false)
  const composer = useRef(EMPTY_STATE)
  const internalUpdate = useRef(false)

  // Reset composer when input is cleared externally (e.g. after submit/skip)
  useEffect(() => {
    if (!internalUpdate.current && input === '') {
      composer.current = EMPTY_STATE
    }
    internalUpdate.current = false
  }, [input])

  function handleKeyDown(e) {
    if (!krMode || reverseMode) return
    if (e.ctrlKey || e.metaKey || e.altKey) return

    if (e.key === 'Backspace') {
      e.preventDefault()
      composer.current = backspace(composer.current)
      internalUpdate.current = true
      setInput(getFullText(composer.current))
      return
    }

    const jamo = KEY_MAP[e.shiftKey ? e.key.toUpperCase() : e.key]
    if (!jamo) return
    e.preventDefault()
    composer.current = addJamo(composer.current, jamo)
    internalUpdate.current = true
    setInput(getFullText(composer.current))
  }
  const questionLabel    = reverseMode ? 'What does this mean?' : 'Translate to Korean'
  const hintAnswer       = reverseMode ? word.english           : word.korean
  const inputPlaceholder = reverseMode ? 'Type English meaning…' : 'Type Korean…'

  const difficultyStyle =
    currentWordDifficulty === 'Hard'   ? 'bg-red-500/15 text-red-300 border border-red-500/30' :
    currentWordDifficulty === 'Medium' ? 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30' :
    currentWordDifficulty === 'Easy'   ? 'bg-green-500/15 text-green-300 border border-green-500/30' :
                                         'bg-blue-500/15 text-blue-300 border border-blue-500/30'

  return (
    <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 px-5 md:px-8 3xl:px-12 pt-5 md:pt-6 pb-5 md:pb-6">

      {/* ── UPPER ZONE: badges + image + word ── */}
      <div className="flex flex-col items-center">

        {/* Badges */}
        <div className="flex items-center gap-2 mb-4 md:mb-5">
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${difficultyStyle}`}>
            <Brain size={11} />
            {currentWordDifficulty}
          </span>
          {reverseMode && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/15 text-orange-300 border border-orange-500/30">
              <RefreshCw size={11} />
              Reverse
            </span>
          )}
        </div>

        {/* Image */}
        {word.image && (
          <div className="rounded-2xl overflow-hidden shadow-xl ring-1 ring-white/10 mb-4 md:mb-5 flex-shrink-0">
            <img
              src={word.image}
              alt={word.english}
              className="w-32 h-32 md:w-40 md:h-40 3xl:w-52 3xl:h-52 object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Question label + word */}
        <div className="text-center">
          <p className="text-[11px] font-medium text-gray-500 uppercase tracking-[0.15em] mb-2 md:mb-3">
            {questionLabel}
          </p>

          {reverseMode ? (
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-4xl md:text-5xl 3xl:text-7xl font-bold text-white tracking-tight">
                {word.korean}
              </h2>
              <span className="text-sm italic text-gray-500 flex-shrink-0">({word.romanization})</span>
              <button
                type="button"
                onClick={() => onSpeak(word.korean)}
                className="p-2 rounded-full bg-gray-700/80 hover:bg-purple-600 text-gray-400 hover:text-white transition-all cursor-pointer flex-shrink-0"
                title="Listen"
              >
                <Volume2 size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-3xl md:text-5xl 3xl:text-6xl font-bold text-white tracking-tight">
                {word.english}
              </h2>
              <span className={`text-base md:text-lg italic transition-all duration-300 flex-shrink-0 ${
                showExample ? 'text-gray-400' : 'text-gray-400 blur-sm select-none'
              }`}>
                ({word.romanization})
              </span>
              <button
                type="button"
                onClick={() => onSpeak(word.korean)}
                className="p-2 rounded-full bg-gray-700/80 hover:bg-purple-600 text-gray-400 hover:text-white transition-all cursor-pointer flex-shrink-0"
                title="Hear pronunciation"
              >
                <Volume2 size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── LOWER ZONE: form + hints ── */}
      <div className="mt-5 md:mt-6">
        <form onSubmit={handleSubmit} className="mb-3">
          <div className={`flex items-stretch mb-3 rounded-xl border-2 overflow-hidden transition-all bg-gray-900/60 ${
            feedback === 'wrong'
              ? 'border-red-500/70 bg-red-900/20 animate-shake'
              : 'border-gray-700 focus-within:border-purple-500 focus-within:bg-gray-900/80'
          }`}>
            <input
              type="text"
              value={input}
              onChange={(e) => { if (!krMode || reverseMode) setInput(e.target.value) }}
              onKeyDown={handleKeyDown}
              onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
              placeholder={inputPlaceholder}
              className="flex-1 min-w-0 text-xl md:text-3xl 3xl:text-5xl text-center p-3 md:p-3.5 bg-transparent text-white placeholder-gray-600 focus:outline-none"
              autoFocus
            />
            {!reverseMode && (
              <button
                type="button"
                onClick={() => setKrMode(m => !m)}
                title={krMode ? 'Switch to direct input' : 'Enable Korean keyboard (QWERTY → 한글)'}
                className={`flex-shrink-0 flex items-center justify-center px-3.5 border-l text-sm font-bold transition-colors cursor-pointer ${
                  krMode
                    ? 'bg-purple-600 text-white border-purple-700'
                    : 'bg-gray-800/60 text-gray-400 hover:text-white border-gray-700/60'
                }`}
              >
                {krMode ? '한' : 'A'}
              </button>
            )}
          </div>

          {feedback === 'wrong' ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setFeedback(''); setInput(''); setShowHint(false) }}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-bold text-base hover:opacity-90 transition-opacity cursor-pointer"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={() => handleNextWord(true)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 py-3 rounded-xl font-bold text-base transition-colors cursor-pointer"
              >
                Skip →
              </button>
            </div>
          ) : (
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-bold text-base md:text-lg hover:opacity-90 transition-opacity cursor-pointer"
            >
              Submit Answer
            </button>
          )}
        </form>

        {feedback === 'wrong' && (
          <div className="px-4 py-2 bg-red-500/10 text-red-300 rounded-xl text-center text-sm border border-red-500/20 mb-3">
            ✗ Wrong — try again or skip
          </div>
        )}

        {/* Hint buttons */}
        <div className="flex gap-2 justify-center flex-wrap">
          <button
            onClick={() => { if (!showHint) setShowHint(true) }}
            disabled={showHint}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              showHint
                ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 cursor-default'
                : 'bg-gray-700/60 hover:bg-gray-700 text-gray-400 hover:text-yellow-300 border border-gray-700 hover:border-yellow-700/50 cursor-pointer'
            }`}
          >
            {showHint ? <EyeOff size={14} /> : <Eye size={14} />}
            {showHint ? hintAnswer : 'Show Answer (-5)'}
          </button>

          <button
            onClick={() => setShowExample(!showExample)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-700/60 hover:bg-gray-700 text-gray-400 hover:text-blue-300 border border-gray-700 hover:border-blue-700/50 transition-all text-sm font-medium cursor-pointer"
          >
            <BookOpen size={14} />
            {reverseMode
              ? (showExample ? 'Hide Example' : 'Show Example (-3)')
              : (showExample ? 'Hide Romanization' : 'Show Romanization (-3)')}
          </button>
        </div>

        {reverseMode && showExample && word.sentences?.[0] && (
          <div className="mt-3 p-3 bg-blue-900/20 rounded-xl border border-blue-800/40 text-center">
            <p className="text-blue-300 text-sm">{word.sentences[0]}</p>
            <p className="text-blue-400/70 text-xs italic mt-1">{word.sentences[1]}</p>
          </div>
        )}
      </div>
    </div>
  )
}
