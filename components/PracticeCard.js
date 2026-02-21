'use client'

import { useState, useRef, useEffect } from 'react'
import { Eye, EyeOff, BookOpen, Brain, Volume2, RefreshCw, ChevronRight } from 'lucide-react'
import { KEY_MAP, EMPTY_STATE, getFullText, addJamo, backspace } from '@/lib/hangulComposer'

export default function PracticeCard({
  word, input, setInput, feedback, setFeedback,
  showHint, setShowHint, showExample, setShowExample,
  handleSubmit, handleNextWord, currentWordDifficulty,
  reverseMode, onSpeak,
}) {
  const [krMode, setKrMode] = useState(() =>
    typeof window !== 'undefined' && localStorage.getItem('krMode') === 'true'
  )
  const composer = useRef(EMPTY_STATE)
  const internalUpdate = useRef(false)

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

  const TYPE_CONFIG = {
    verb:       { kr: '동사',  en: 'Verb', color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
    adjective:  { kr: '형용사', en: 'Adj', color: 'bg-violet-500/15 text-violet-300 border-violet-500/30' },
    noun:       { kr: '명사',  en: 'Noun', color: 'bg-slate-500/15 text-slate-300 border-slate-500/30' },
    adverb:     { kr: '부사',  en: 'Adv',  color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
    expression: { kr: '표현',  en: 'Expr', color: 'bg-teal-500/15 text-teal-300 border-teal-500/30' },
  }
  const typeConfig = word.type ? TYPE_CONFIG[word.type] : null

  return (
    <div className="relative bg-white/[0.03] rounded-3xl overflow-hidden border border-white/[0.07]">

      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/70 to-transparent" />

      {/* Ambient glow */}
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-40 bg-purple-600/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative px-5 md:px-8 pt-5 md:pt-6 pb-4 md:pb-5">

        {/* ── Badges ── */}
        <div className="flex items-center gap-2 mb-3 flex-wrap justify-center">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${difficultyStyle}`}>
            <Brain size={10} />
            {currentWordDifficulty}
          </span>
          {typeConfig && (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${typeConfig.color}`}>
              {typeConfig.en}
              <span className="opacity-40">·</span>
              <span className="font-normal">{typeConfig.kr}</span>
            </span>
          )}
          {reverseMode && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/15 text-orange-300 border border-orange-500/30">
              <RefreshCw size={10} />
              Reverse
            </span>
          )}
        </div>

        {/* ── Image ── */}
        {word.image && (
          <div className="flex justify-center mb-3 md:mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500/20 rounded-2xl blur-xl scale-90 translate-y-1" />
              <img
                src={word.image}
                alt={word.english}
                className="relative w-28 h-28 md:w-32 md:h-32 object-cover rounded-2xl ring-1 ring-white/10 shadow-xl"
                loading="lazy"
              />
            </div>
          </div>
        )}

        {/* ── Question label + word ── */}
        <div className="text-center mb-3 md:mb-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-800/80 border border-gray-700/50 mb-2 md:mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.12em]">{questionLabel}</span>
          </div>

          {reverseMode ? (
            <>
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">{word.korean}</h2>
                <button
                  type="button"
                  onClick={() => onSpeak(word.korean)}
                  className="p-1.5 rounded-full bg-gray-800 hover:bg-purple-600 text-gray-500 hover:text-white transition-all cursor-pointer flex-shrink-0"
                >
                  <Volume2 size={15} />
                </button>
              </div>
              <p className="text-sm italic text-gray-500 mt-1">/{word.romanization}/</p>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">{word.english}</h2>
                <button
                  type="button"
                  onClick={() => onSpeak(word.korean)}
                  className="p-1.5 rounded-full bg-gray-800 hover:bg-purple-600 text-gray-500 hover:text-white transition-all cursor-pointer flex-shrink-0"
                >
                  <Volume2 size={15} />
                </button>
              </div>
              <p className={`text-sm italic text-gray-500 mt-1 transition-all duration-300 ${showExample ? '' : 'blur-sm select-none'}`}>
                /{word.romanization}/
              </p>
            </>
          )}
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="mb-3 max-w-sm mx-auto">
          <div className={`flex items-stretch mb-2.5 rounded-2xl overflow-hidden transition-all duration-200 ${
            feedback === 'wrong'
              ? 'ring-2 ring-red-500/60 shadow-[0_0_0_4px_rgba(239,68,68,0.08)] bg-red-950/30 animate-shake'
              : 'ring-1 ring-white/[0.08] focus-within:ring-2 focus-within:ring-purple-500/60 focus-within:shadow-[0_0_0_4px_rgba(168,85,247,0.10)] bg-white/[0.05]'
          }`}>
            <input
              type="text"
              value={input}
              onChange={(e) => { if (!krMode || reverseMode) setInput(e.target.value) }}
              onKeyDown={handleKeyDown}
              onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
              placeholder={inputPlaceholder}
              className="flex-1 min-w-0 text-base md:text-lg text-center p-2 md:p-2.5 bg-transparent text-white placeholder-gray-600/70 focus:outline-none"
              autoFocus
            />
            {!reverseMode && (
              <button
                type="button"
                onClick={() => setKrMode(m => { localStorage.setItem('krMode', String(!m)); return !m })}
                title={krMode ? 'Switch to direct input' : 'Enable Korean keyboard (QWERTY → 한글)'}
                className={`flex-shrink-0 flex items-center justify-center px-3.5 border-l text-sm font-bold tracking-wide transition-colors cursor-pointer ${
                  krMode
                    ? 'bg-purple-600 text-white border-purple-700/60'
                    : 'bg-gray-800/40 text-gray-500 hover:text-white border-gray-700/60'
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
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity cursor-pointer shadow-lg shadow-purple-500/20"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={() => handleNextWord(true)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-xl font-bold text-sm transition-colors cursor-pointer"
              >
                Skip →
              </button>
            </div>
          ) : (
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 md:py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-all cursor-pointer shadow-lg shadow-purple-500/20 hover:shadow-purple-500/35 flex items-center justify-center gap-1.5"
            >
              Submit Answer
              <ChevronRight size={17} className="opacity-70" />
            </button>
          )}
        </form>

        {/* Wrong feedback */}
        {feedback === 'wrong' && (
          <div className="flex items-center justify-center gap-2 px-4 py-1.5 bg-red-500/8 text-red-400 rounded-xl text-sm border border-red-500/15 mb-2.5">
            <span>✗</span>
            <span>Not quite — try again or skip</span>
          </div>
        )}

        {/* ── Hints ── */}
        <div className="flex gap-2 justify-center flex-wrap">
          <button
            onClick={() => { if (!showHint) setShowHint(true) }}
            disabled={showHint}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border ${
              showHint
                ? 'bg-yellow-500/8 text-yellow-400 border-yellow-500/25 cursor-default'
                : 'bg-transparent text-gray-500 hover:text-yellow-300 border-gray-700/60 hover:border-yellow-600/40 cursor-pointer'
            }`}
          >
            {showHint ? <EyeOff size={12} /> : <Eye size={12} />}
            {showHint ? hintAnswer : 'Show Answer'}
          </button>

          <button
            onClick={() => setShowExample(!showExample)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border cursor-pointer ${
              showExample
                ? 'bg-blue-500/8 text-blue-400 border-blue-500/25'
                : 'bg-transparent text-gray-500 hover:text-blue-300 border-gray-700/60 hover:border-blue-600/40'
            }`}
          >
            <BookOpen size={12} />
            {reverseMode
              ? (showExample ? 'Hide Example' : 'Show Example')
              : (showExample ? 'Hide Romanization' : 'Show Romanization')}
          </button>
        </div>

        <p className="text-center text-[10px] text-gray-700 mt-2 tracking-wide">
          Hints keep this word in rotation longer
        </p>

        {reverseMode && showExample && word.sentences?.[0] && (
          <div className="mt-3 p-3 bg-blue-950/30 rounded-2xl border border-blue-800/30 text-center">
            <p className="text-blue-300 text-sm leading-relaxed">{word.sentences[0]}</p>
            <p className="text-blue-400/60 text-xs italic mt-1">{word.sentences[1]}</p>
          </div>
        )}
      </div>
    </div>
  )
}
