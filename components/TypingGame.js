'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowLeft, RotateCcw, Zap, Star, Keyboard } from 'lucide-react'
import { KEY_MAP as QWERTY_MAP, EMPTY_STATE, getFullText, addJamo, backspace } from '@/lib/hangulComposer'

// Korean 2-beolsik keyboard map (jamo → QWERTY key, used for key hints)
const JAMO_TO_KEY = {
  'ㅂ': 'Q', 'ㅈ': 'W', 'ㄷ': 'E', 'ㄱ': 'R', 'ㅅ': 'T',
  'ㅛ': 'Y', 'ㅕ': 'U', 'ㅑ': 'I', 'ㅐ': 'O', 'ㅔ': 'P',
  'ㅁ': 'A', 'ㄴ': 'S', 'ㅇ': 'D', 'ㄹ': 'F', 'ㅎ': 'G',
  'ㅗ': 'H', 'ㅓ': 'J', 'ㅏ': 'K', 'ㅣ': 'L',
  'ㅋ': 'Z', 'ㅌ': 'X', 'ㅊ': 'C', 'ㅍ': 'V', 'ㅠ': 'B', 'ㅜ': 'N', 'ㅡ': 'M',
}

const INITIALS  = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ']
const VOWEL_LIST= ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ']
const FINALS    = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ']

function decomposeToJamo(char) {
  const code = char.charCodeAt(0)
  if (code < 0xAC00 || code > 0xD7A3) return [char]
  const offset = code - 0xAC00
  const fin = offset % 28
  const vow = Math.floor(offset / 28) % 21
  const ini = Math.floor(offset / 28 / 21)
  const result = [INITIALS[ini], VOWEL_LIST[vow]]
  if (FINALS[fin]) result.push(FINALS[fin])
  return result
}

function getKeyHint(char) {
  const jamo = decomposeToJamo(char)
  return jamo.map(j => JAMO_TO_KEY[j] || '?').join(' + ')
}

const VOWELS = ['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ', 'ㅐ', 'ㅔ']
const CONSONANTS = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']
const SYLLABLES = [
  '가', '나', '다', '라', '마', '바', '사', '아', '자', '하',
  '이', '기', '니', '디', '리', '미', '비', '시', '지', '히',
  '고', '노', '도', '로', '모', '보', '소', '오', '조', '호',
  '구', '무', '부', '수', '우', '주', '추', '투', '후', '쿠',
  '한', '국', '어', '학', '교', '친', '일', '대', '서', '울',
  '시', '간', '말', '물', '밥', '집', '책', '방', '길', '문',
]

const MODES = [
  {
    id: 'vowels', label: '모음', sublabel: 'Vowels', chars: VOWELS,
    accent: 'text-blue-400', border: 'border-blue-500', activeBg: 'bg-blue-600',
    glow: 'shadow-blue-500/50', gradient: 'from-blue-600 to-cyan-600',
  },
  {
    id: 'consonants', label: '자음', sublabel: 'Consonants', chars: CONSONANTS,
    accent: 'text-green-400', border: 'border-green-500', activeBg: 'bg-green-600',
    glow: 'shadow-green-500/50', gradient: 'from-green-600 to-emerald-600',
  },
  {
    id: 'syllables', label: '음절', sublabel: 'Syllables', chars: SYLLABLES,
    accent: 'text-purple-400', border: 'border-purple-500', activeBg: 'bg-purple-600',
    glow: 'shadow-purple-500/50', gradient: 'from-purple-600 to-violet-600',
  },
  {
    id: 'mixed', label: '혼합', sublabel: 'Mixed', chars: [...VOWELS, ...CONSONANTS, ...SYLLABLES],
    accent: 'text-pink-400', border: 'border-pink-500', activeBg: 'bg-pink-600',
    glow: 'shadow-pink-500/50', gradient: 'from-pink-600 to-orange-600',
  },
]

const ROUND_OPTIONS = [10, 12, 15]

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function formatTime(ms) {
  return (ms / 1000).toFixed(2) + 's'
}

function getSpeedColor(ms) {
  if (ms < 1500) return 'text-green-400'
  if (ms < 2500) return 'text-yellow-400'
  return 'text-red-400'
}

function getSpeedLabel(ms) {
  if (ms < 1500) return 'Lightning fast!'
  if (ms < 2500) return 'Good speed'
  return 'Keep practicing'
}

function getStars(avgMs) {
  if (avgMs < 1500) return 3
  if (avgMs < 2500) return 2
  return 1
}

export default function TypingGame({ setCurrentView }) {
  const [selectedMode, setSelectedMode] = useState(null)
  const [rounds, setRounds] = useState(12)
  const [phase, setPhase] = useState('menu') // menu | playing | results
  const [queue, setQueue] = useState([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [input, setInput] = useState('')
  const [flash, setFlash] = useState(null) // 'correct' | null
  const [times, setTimes] = useState([])
  const [charStartTime, setCharStartTime] = useState(null)
  const [liveMs, setLiveMs] = useState(0)
  const [charVisible, setCharVisible] = useState(true)
  const [krMode, setKrMode] = useState(false)

  const inputRef = useRef(null)
  const liveTimerRef = useRef(null)
  const advancingRef = useRef(false)
  const composer = useRef(EMPTY_STATE)
  const internalUpdate = useRef(false)

  const mode = MODES.find(m => m.id === selectedMode) || MODES[2]
  const currentChar = queue[currentIdx]

  // Reset composer when input is cleared externally (new char, game start, etc.)
  useEffect(() => {
    if (!internalUpdate.current && input === '') {
      composer.current = EMPTY_STATE
    }
    internalUpdate.current = false
  }, [input])

  // Focus input on phase change
  useEffect(() => {
    if (phase === 'playing') {
      inputRef.current?.focus()
    }
  }, [phase, currentIdx])

  // Live per-character timer
  useEffect(() => {
    if (phase === 'playing' && charStartTime) {
      liveTimerRef.current = setInterval(() => {
        setLiveMs(Date.now() - charStartTime)
      }, 50)
      return () => clearInterval(liveTimerRef.current)
    }
  }, [phase, charStartTime])

  const startGame = useCallback(() => {
    if (!selectedMode) return
    const modeObj = MODES.find(m => m.id === selectedMode)
    // ensure enough unique chars (loop if needed)
    const selected = []
    while (selected.length < rounds) {
      selected.push(...shuffle([...modeObj.chars]))
    }
    const finalQueue = selected.slice(0, rounds)
    setQueue(finalQueue)
    setCurrentIdx(0)
    setTimes([])
    setInput('')
    setFlash(null)
    setCharVisible(true)
    advancingRef.current = false
    setCharStartTime(Date.now())
    setLiveMs(0)
    setPhase('playing')
  }, [selectedMode, rounds])

  const advance = useCallback((elapsed) => {
    if (advancingRef.current) return
    advancingRef.current = true
    setTimes(prev => [...prev, elapsed])
    setFlash('correct')
    setInput('')
    setCharVisible(false)

    setTimeout(() => {
      setFlash(null)
      if (currentIdx + 1 >= rounds) {
        setPhase('results')
      } else {
        setCurrentIdx(prev => prev + 1)
        setCharStartTime(Date.now())
        setLiveMs(0)
        setCharVisible(true)
        advancingRef.current = false
      }
    }, 200)
  }, [currentIdx, rounds])

  const handleChange = useCallback((e) => {
    if (advancingRef.current || krMode) return
    const val = e.target.value
    setInput(val)
    if (!currentChar) return

    // Check if typed value contains the target Korean character
    if (val.includes(currentChar)) {
      const elapsed = Date.now() - charStartTime
      advance(elapsed)
    }
  }, [currentChar, charStartTime, advance, krMode])

  function handleKeyDown(e) {
    if (!krMode || advancingRef.current) return
    if (e.ctrlKey || e.metaKey || e.altKey) return

    // Standalone jamo targets (vowel/consonant modes) are below the syllable block
    const isJamoTarget = currentChar && currentChar.charCodeAt(0) < 0xAC00

    if (e.key === 'Backspace') {
      e.preventDefault()
      if (isJamoTarget) {
        internalUpdate.current = true
        setInput('')
      } else {
        composer.current = backspace(composer.current)
        internalUpdate.current = true
        setInput(getFullText(composer.current))
      }
      return
    }

    const jamo = QWERTY_MAP[e.shiftKey ? e.key.toUpperCase() : e.key]
    if (!jamo) return
    e.preventDefault()

    if (isJamoTarget) {
      // Bypass composer: display raw jamo and match directly (no auto-ㅇ insertion)
      internalUpdate.current = true
      setInput(jamo)
      if (jamo === currentChar) {
        const elapsed = Date.now() - charStartTime
        advance(elapsed)
      }
      return
    }

    // Syllable target: full IME composition
    composer.current = addJamo(composer.current, jamo)
    internalUpdate.current = true
    const composed = getFullText(composer.current)
    setInput(composed)

    if (currentChar && composed.includes(currentChar)) {
      const elapsed = Date.now() - charStartTime
      composer.current = EMPTY_STATE
      advance(elapsed)
    }
  }

  // Keyboard shortcut: Enter in menu triggers start
  useEffect(() => {
    if (phase !== 'menu') return
    const handler = (e) => {
      if (e.key === 'Enter' && selectedMode) startGame()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [phase, selectedMode, startGame])

  const avgMs = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0
  const bestMs = times.length > 0 ? Math.min(...times) : 0
  const totalMs = times.reduce((a, b) => a + b, 0)
  const stars = getStars(avgMs)

  // ─── MENU ───────────────────────────────────────────────────────────────────
  if (phase === 'menu') {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        <div className="max-w-3xl mx-auto w-full px-6 py-10 flex flex-col gap-8">
          {/* Header */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentView('practice')}
              className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors cursor-pointer"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Keyboard size={24} className="text-purple-400" />
                Korean Typing Trainer
              </h1>
              <p className="text-gray-400 text-sm mt-0.5">Type the character shown as fast as you can</p>
            </div>
          </div>

          {/* Mode selection */}
          <div>
            <h2 className="text-gray-400 text-xs uppercase tracking-widest mb-3 font-semibold">Choose Mode</h2>
            <div className="grid grid-cols-2 gap-3">
              {MODES.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMode(m.id)}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    selectedMode === m.id
                      ? `${m.border} bg-gray-800`
                      : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                  }`}
                >
                  {selectedMode === m.id && (
                    <div className={`absolute top-2 right-2 w-2 h-2 rounded-full bg-gradient-to-r ${m.gradient}`} />
                  )}
                  <div className={`text-3xl font-bold mb-1 ${selectedMode === m.id ? m.accent : 'text-white'}`}>
                    {m.chars.slice(0, 3).join(' ')}
                  </div>
                  <div className="text-white font-semibold text-sm">{m.label}</div>
                  <div className="text-gray-400 text-xs">{m.sublabel} · {m.chars.length} chars</div>
                </button>
              ))}
            </div>
          </div>

          {/* Rounds selection */}
          <div>
            <h2 className="text-gray-400 text-xs uppercase tracking-widest mb-3 font-semibold">Rounds</h2>
            <div className="flex gap-3">
              {ROUND_OPTIONS.map(r => (
                <button
                  key={r}
                  onClick={() => setRounds(r)}
                  className={`flex-1 py-3 rounded-xl font-bold text-lg border-2 transition-all cursor-pointer ${
                    rounds === r
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Start button */}
          <button
            onClick={startGame}
            disabled={!selectedMode}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all cursor-pointer ${
              selectedMode
                ? `bg-gradient-to-r ${mode.gradient} text-white hover:opacity-90 shadow-lg`
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
            }`}
          >
            {selectedMode ? `Start · ${rounds} rounds` : 'Select a mode to start'}
          </button>

          {/* Hint */}
          <p className="text-center text-gray-600 text-xs">
            Use the <span className="text-gray-400 font-semibold">A / 한</span> toggle during the game to type Korean with a QWERTY keyboard
          </p>
        </div>
      </div>
    )
  }

  // ─── PLAYING ────────────────────────────────────────────────────────────────
  if (phase === 'playing') {
    const keyHint = currentChar ? getKeyHint(currentChar) : ''
    const speedColor = getSpeedColor(liveMs)

    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <button
            onClick={() => setPhase('menu')}
            className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>

          {/* Progress dots */}
          <div className="flex gap-1.5">
            {queue.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i < currentIdx ? `bg-gradient-to-r ${mode.gradient}`
                  : i === currentIdx ? 'bg-white scale-125'
                  : 'bg-gray-700'
                }`}
              />
            ))}
          </div>

          {/* Live timer */}
          <div className={`font-mono text-sm font-bold transition-colors ${speedColor}`}>
            {(liveMs / 1000).toFixed(1)}s
          </div>
        </div>

        {/* Main area */}
        <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6">
          {/* Round counter */}
          <div className="text-gray-500 text-sm font-medium">
            {currentIdx + 1} / {rounds}
          </div>

          {/* Character display */}
          <div
            className={`relative flex items-center justify-center transition-all duration-150 ${
              flash === 'correct' ? 'scale-110' : charVisible ? 'scale-100' : 'scale-90 opacity-0'
            }`}
          >
            <div
              className={`text-[10rem] leading-none font-bold select-none transition-all duration-150 ${
                flash === 'correct' ? mode.accent : 'text-white'
              }`}
              style={{
                textShadow: flash === 'correct'
                  ? `0 0 60px currentColor`
                  : '0 0 40px rgba(255,255,255,0.1)',
              }}
            >
              {currentChar}
            </div>

            {/* Correct flash ring */}
            {flash === 'correct' && (
              <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${mode.gradient} opacity-20 blur-3xl pointer-events-none`} />
            )}
          </div>

          {/* Key hint */}
          <div className="flex items-center gap-2">
            {keyHint.split(' + ').map((key, i, arr) => (
              <span key={i} className="flex items-center gap-2">
                <kbd className="px-3 py-1.5 bg-gray-800 border border-gray-600 rounded-lg text-gray-300 text-sm font-mono font-bold shadow-inner">
                  {key}
                </kbd>
                {i < arr.length - 1 && <span className="text-gray-600 text-xs">+</span>}
              </span>
            ))}
          </div>

          {/* Hidden input field — captures keyboard input */}
          <input
            ref={inputRef}
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className="opacity-0 absolute pointer-events-none w-0 h-0"
            aria-label="Type Korean character"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />

          {/* Visible input display + KR mode toggle */}
          <div
            onClick={() => inputRef.current?.focus()}
            className={`flex items-stretch rounded-xl border-2 overflow-hidden transition-all cursor-text ${
              flash === 'correct'
                ? `${mode.border} bg-gray-800`
                : 'border-gray-700 bg-gray-800 hover:border-gray-600'
            }`}
          >
            <div className="flex-1 h-14 flex items-center justify-center px-4">
              <span className={`text-2xl font-bold ${flash === 'correct' ? mode.accent : 'text-white'}`}>
                {flash === 'correct' ? '✓' : (input || <span className="text-gray-600">type here</span>)}
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setKrMode(m => !m); inputRef.current?.focus() }}
              title={krMode ? 'Switch to native Korean keyboard' : 'Enable QWERTY → Korean input'}
              className={`flex-shrink-0 flex items-center justify-center px-3.5 border-l text-sm font-bold transition-colors cursor-pointer ${
                krMode ? 'bg-purple-600 text-white border-purple-700' : 'bg-gray-800 text-gray-400 hover:text-white border-gray-700/60'
              }`}
            >
              {krMode ? '한' : 'A'}
            </button>
          </div>

          <p className="text-gray-600 text-xs">Click the box above if focus is lost</p>
        </div>

        {/* Bottom times log */}
        {times.length > 0 && (
          <div className="px-6 pb-4 flex justify-center gap-2 flex-wrap">
            {times.map((t, i) => (
              <span
                key={i}
                className={`text-xs font-mono px-2 py-0.5 rounded-full bg-gray-800 ${getSpeedColor(t)}`}
              >
                {formatTime(t)}
              </span>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ─── RESULTS ────────────────────────────────────────────────────────────────
  if (phase === 'results') {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        <div className="max-w-2xl mx-auto w-full px-6 py-10 flex flex-col gap-6">
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center gap-1 mb-3">
              {[1, 2, 3].map(s => (
                <Star
                  key={s}
                  size={36}
                  className={s <= stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700'}
                />
              ))}
            </div>
            <h1 className="text-2xl font-bold text-white">Round Complete!</h1>
            <p className={`text-sm mt-1 font-medium ${getSpeedColor(avgMs)}`}>
              {getSpeedLabel(avgMs)}
            </p>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-800 rounded-xl p-4 text-center border border-gray-700">
              <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">Average</div>
              <div className={`text-2xl font-bold font-mono ${getSpeedColor(avgMs)}`}>
                {formatTime(avgMs)}
              </div>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 text-center border border-gray-700">
              <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">Best</div>
              <div className="text-2xl font-bold font-mono text-green-400">
                {formatTime(bestMs)}
              </div>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 text-center border border-gray-700">
              <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">Total</div>
              <div className="text-2xl font-bold font-mono text-white">
                {(totalMs / 1000).toFixed(1)}s
              </div>
            </div>
          </div>

          {/* Per-character breakdown */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <h3 className="text-gray-400 text-xs uppercase tracking-wide mb-3 font-semibold">
              Per character
            </h3>
            <div className="flex flex-wrap gap-2">
              {times.map((t, i) => {
                const maxT = Math.max(...times)
                const barPct = Math.round((t / maxT) * 100)
                return (
                  <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-[3rem]">
                    <span className="text-white font-bold text-lg">{queue[i]}</span>
                    <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${mode.gradient}`}
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                    <span className={`text-xs font-mono ${getSpeedColor(t)}`}>{formatTime(t)}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Slowest characters tip */}
          {times.length > 3 && (() => {
            const slowest = [...times.map((t, i) => ({ t, char: queue[i] }))]
              .sort((a, b) => b.t - a.t)
              .slice(0, 3)
            return (
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <h3 className="text-gray-400 text-xs uppercase tracking-wide mb-2 font-semibold flex items-center gap-1">
                  <Zap size={12} /> Practice these
                </h3>
                <div className="flex gap-3">
                  {slowest.map(({ char, t }, i) => (
                    <div key={i} className="flex items-center gap-2 bg-gray-900 rounded-lg px-3 py-2">
                      <span className="text-white text-xl font-bold">{char}</span>
                      <span className={`text-xs font-mono ${getSpeedColor(t)}`}>{formatTime(t)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={startGame}
              className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 bg-gradient-to-r ${mode.gradient} text-white hover:opacity-90 transition-opacity cursor-pointer`}
            >
              <RotateCcw size={18} />
              Play Again
            </button>
            <button
              onClick={() => setPhase('menu')}
              className="flex-1 py-3 rounded-xl font-bold bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors border border-gray-700 cursor-pointer"
            >
              Change Mode
            </button>
          </div>

          <button
            onClick={() => setCurrentView('practice')}
            className="text-gray-500 hover:text-gray-300 transition-colors text-sm text-center cursor-pointer"
          >
            ← Back to Practice
          </button>
        </div>
      </div>
    )
  }
}
