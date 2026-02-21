'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { Zap, RotateCw, Trophy, ChevronRight, X, BookOpen } from 'lucide-react'

// ── Korean helpers ──────────────────────────────────────────────────────────
function hasJongseong(char) {
  const c = char.charCodeAt(0)
  return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0
}
function jongseongCode(char) {
  const c = char.charCodeAt(0)
  if (c < 0xAC00 || c > 0xD7A3) return -1
  return (c - 0xAC00) % 28  // 0 = no jongseong, 8 = ㄹ
}
function lastKoreanChar(str) {
  for (let i = str.length - 1; i >= 0; i--) {
    const c = str.charCodeAt(i)
    if (c >= 0xAC00 && c <= 0xD7A3) return str[i]
  }
  return null
}
// Heuristic: Korean verbs/adjectives end in 다 in dictionary form; nouns don't.
// Particle generators only make sense attached to nouns.
const isNoun = (w) => !w.korean.trimEnd().endsWith('다')
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── Dynamic question generators ─────────────────────────────────────────────
function makeTopicQ(word) {
  const last = lastKoreanChar(word.korean)
  if (!last) return null
  const hasC = hasJongseong(last)
  const answer = hasC ? '은' : '는'
  return {
    category: 'TopicMarker',
    question: `Choose the correct topic marker (은/는):\n\n${word.korean}___ 좋아요.`,
    translation: `"${word.korean}" = ${word.english} · "${word.korean}___ 좋아요" = [The] ${word.english} is good.`,
    answer,
    options: shuffle([answer, hasC ? '는' : '은', '도', '만']),
    explanation: `"${word.korean}" ends with ${hasC ? 'a consonant → 은' : 'a vowel → 는'}. Topic markers: 은 (after consonant), 는 (after vowel).`,
  }
}

function makeObjectQ(word) {
  const last = lastKoreanChar(word.korean)
  if (!last) return null
  const hasC = hasJongseong(last)
  const answer = hasC ? '을' : '를'
  return {
    category: 'ObjectMarker',
    question: `Choose the correct object marker (을/를):\n\n저는 ${word.korean}___ 샀어요.`,
    translation: `"저는 ${word.korean}을/를 샀어요." = I bought ${word.english}.`,
    answer,
    options: shuffle([answer, hasC ? '를' : '을', '에서', '이나']),
    explanation: `"${word.korean}" ends with ${hasC ? 'a consonant → 을' : 'a vowel → 를'}. Object markers: 을 (after consonant), 를 (after vowel).`,
  }
}

function makeSubjectQ(word) {
  const last = lastKoreanChar(word.korean)
  if (!last) return null
  const hasC = hasJongseong(last)
  const answer = hasC ? '이' : '가'
  return {
    category: 'SubjectMarker',
    question: `Choose the correct subject marker (이/가):\n\n${word.korean}___ 있어요?`,
    translation: `"${word.korean}이/가 있어요?" = Is there a ${word.english}? / Do you have ${word.english}?`,
    answer,
    options: shuffle([answer, hasC ? '가' : '이', hasC ? '은' : '는', '를']),
    explanation: `"${word.korean}" ends with ${hasC ? 'a consonant → 이' : 'a vowel → 가'}. Subject markers: 이 (after consonant), 가 (after vowel).`,
  }
}

function makeCopulaQ(word) {
  const last = lastKoreanChar(word.korean)
  if (!last) return null
  const hasC = hasJongseong(last)
  const answer = hasC ? '이에요' : '예요'
  return {
    category: 'Copula',
    question: `How do you say "It's ${word.english}" in polite Korean?\n\n${word.korean}___`,
    translation: `"${word.korean}" = ${word.english}`,
    answer,
    options: shuffle([answer, hasC ? '예요' : '이에요', '이에요?', '있어요']),
    explanation: `이에요 is used after a consonant, 예요 after a vowel. "${word.korean}" ends with ${hasC ? 'a consonant → 이에요' : 'a vowel → 예요'}.`,
  }
}

function makeConjQ(word) {
  const last = lastKoreanChar(word.korean)
  if (!last) return null
  const hasC = hasJongseong(last)
  const answer = hasC ? '과' : '와'
  return {
    category: 'ConjParticle',
    question: `Choose the correct conjunction particle (와/과):\n\n${word.korean}___ 친구를 만났어요.`,
    translation: `"${word.korean}" = ${word.english} · "I met ${word.english} and a friend."`,
    answer,
    options: shuffle([answer, hasC ? '와' : '과', '하고', '에서']),
    explanation: `"${word.korean}" ends with ${hasC ? 'a consonant → 과' : 'a vowel → 와'}. Conjunctive particles: 과 (after consonant), 와 (after vowel). Casual spoken form: 하고.`,
  }
}

function makeDirQ(word) {
  const last = lastKoreanChar(word.korean)
  if (!last) return null
  const jCode = jongseongCode(last)
  // 으로 after consonant (except ㄹ = jongseong code 8), 로 after vowel or ㄹ
  const hasC = hasJongseong(last)
  const isRieul = jCode === 8
  const answer = (hasC && !isRieul) ? '으로' : '로'
  return {
    category: 'LocationParticle',
    question: `Choose the correct direction/means particle (으로/로):\n\n${word.korean}___ 가세요.`,
    translation: `"${word.korean}" = ${word.english} · "Please go toward / by ${word.english}."`,
    answer,
    options: shuffle([answer, hasC && !isRieul ? '로' : '으로', '에서', '에']),
    explanation: `"${word.korean}" ends with ${isRieul ? 'ㄹ → 로' : hasC ? 'a consonant (not ㄹ) → 으로' : 'a vowel → 로'}. 으로/로 marks direction or means of transport.`,
  }
}

// ── Build question pool ──────────────────────────────────────────────────────
// All particle/copula generators require nouns — verbs/adjectives end in 다.
const DYNAMIC_GENERATORS = [
  { cat: 'TopicMarker',   fn: makeTopicQ,   nounsOnly: true  },
  { cat: 'ObjectMarker',  fn: makeObjectQ,  nounsOnly: true  },
  { cat: 'SubjectMarker', fn: makeSubjectQ, nounsOnly: true  },
  { cat: 'Copula',        fn: makeCopulaQ,  nounsOnly: true  },
  { cat: 'ConjParticle',  fn: makeConjQ,    nounsOnly: true  },
  { cat: 'LocationParticle', fn: makeDirQ,  nounsOnly: true  },
]

function buildQuestions(practicedWords, allWords, selectedCategories, staticQuestions) {
  const hasFilter = selectedCategories instanceof Set && selectedCategories.size > 0
  const rawPool   = practicedWords.length > 0 ? practicedWords : allWords.slice(0, 30)
  // Particle generators only make sense with nouns; fall back to full pool if too few.
  const nounPool  = rawPool.filter(isNoun).length >= 5 ? rawPool.filter(isNoun) : rawPool

  if (hasFilter) {
    const filtered = staticQuestions.filter(q => selectedCategories.has(q.category))
    const eligible = DYNAMIC_GENERATORS.filter(g => selectedCategories.has(g.cat))
    const dynamic  = []
    if (eligible.length > 0) {
      for (const word of shuffle(nounPool).slice(0, 15)) {
        const gen = shuffle(eligible)[0]
        const pool = gen.nounsOnly ? nounPool : rawPool
        const q    = gen.fn(shuffle(pool)[0] ?? word)
        if (q) dynamic.push(q)
      }
    }
    return shuffle([...filtered, ...dynamic]).slice(0, 15)
  }

  // Unfiltered (play all): mix dynamic noun-based questions with all static questions
  const dynamic = []
  for (const word of shuffle(nounPool).slice(0, 15)) {
    const gen = shuffle(DYNAMIC_GENERATORS)[0]
    const q   = gen.fn(word)
    if (q) dynamic.push(q)
  }
  return shuffle([...dynamic, ...shuffle(staticQuestions).slice(0, 12)]).slice(0, 10)
}

// ── Component ────────────────────────────────────────────────────────────────
const categoryColors = {
  // TOPIK I — granular particle categories
  'TopicMarker':      'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'SubjectMarker':    'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  'ObjectMarker':     'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  'LocationParticle': 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  'PossessiveMarker': 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  'ConjParticle':     'bg-violet-500/20 text-violet-300 border-violet-500/30',
  // TOPIK I — section categories
  'Particles':       'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Verb Form':       'bg-green-500/20 text-green-300 border-green-500/30',
  'Negation':        'bg-red-500/20 text-red-300 border-red-500/30',
  'Connectives':     'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'Copula':          'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'Patterns':        'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'Numbers':         'bg-teal-500/20 text-teal-300 border-teal-500/30',
  // TOPIK II
  'Modals':          'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'Indirect':        'bg-sky-500/20 text-sky-300 border-sky-500/30',
  'Passive':         'bg-violet-500/20 text-violet-300 border-violet-500/30',
  'AdvConnectives':  'bg-rose-500/20 text-rose-300 border-rose-500/30',
  'Modifiers':       'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'Inference':       'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'Formal':          'bg-slate-500/20 text-slate-300 border-slate-500/30',
  'Honorifics':      'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
}

export default function GrammarGame({ wordStats, allWords, onClose, onComplete, selectedCategories, staticQuestions }) {
  const practicedWords = useMemo(() => {
    const keys = Object.keys(wordStats || {})
    return allWords.filter(w => keys.includes(w.korean))
  }, [wordStats, allWords])

  const [questions, setQuestions] = useState(() => buildQuestions(practicedWords, allWords, selectedCategories, staticQuestions))
  const [index, setIndex]         = useState(0)
  const [selected, setSelected]   = useState(null)
  const [score, setScore]         = useState(0)
  const [done, setDone]           = useState(false)
  const scoreRef   = useRef(0)
  const answersRef = useRef([]) // { category, correct }[]

  const q = questions[index]
  const answered = selected !== null
  const isCorrect = selected === q?.answer
  const scrollAreaRef = useRef(null)

  useEffect(() => {
    if (scrollAreaRef.current) scrollAreaRef.current.scrollTop = 0
  }, [index])

  function choose(opt) {
    if (answered) return
    const correct = opt === q.answer
    answersRef.current.push({ category: q.category, correct })
    setSelected(opt)
    if (correct) {
      setScore(s => s + 1)
      scoreRef.current++
    }
  }

  function next() {
    if (index + 1 >= questions.length) {
      onComplete?.(scoreRef.current, questions.length, answersRef.current)
      setDone(true)
    } else {
      setIndex(i => i + 1)
      setSelected(null)
    }
  }

  function restart() {
    answersRef.current = []
    setQuestions(buildQuestions(practicedWords, allWords, selectedCategories, staticQuestions))
    setIndex(0)
    setSelected(null)
    setScore(0)
    setDone(false)
    scoreRef.current = 0
  }

  // ── Not enough words screen ──
  const MIN_WORDS = 5
  if (practicedWords.length < MIN_WORDS) return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="bg-gray-800/80 rounded-2xl border border-gray-700/50 p-8 max-w-sm w-full text-center shadow-2xl">
        <BookOpen className="mx-auto mb-4 text-purple-400" size={48} />
        <p className="text-white text-xl font-bold mb-2">Not enough words yet</p>
        <p className="text-gray-400 text-sm leading-relaxed mb-1">
          You've practiced <span className="text-purple-400 font-semibold">{practicedWords.length}</span> word{practicedWords.length !== 1 ? 's' : ''}.
        </p>
        <p className="text-gray-400 text-sm leading-relaxed mb-6">
          Practice at least <span className="text-white font-semibold">{MIN_WORDS}</span> words in the Vocabulary section first, then come back to play.
        </p>
        <button onClick={onClose} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-bold hover:opacity-90 transition-opacity cursor-pointer">
          Go to Vocabulary
        </button>
      </div>
    </div>
  )

  const pct = Math.round((score / questions.length) * 100)
  const grade = pct >= 90 ? { label: 'Excellent!', color: 'text-green-400' }
              : pct >= 70 ? { label: 'Good job!',  color: 'text-blue-400'  }
              : pct >= 50 ? { label: 'Keep going!', color: 'text-yellow-400' }
              :              { label: 'Keep studying!', color: 'text-orange-400' }

  // ── Done screen ──
  if (done) return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="bg-gray-800/80 rounded-2xl border border-gray-700/50 p-8 max-w-sm w-full text-center shadow-2xl">
        <Trophy className="mx-auto mb-3 text-yellow-400" size={48} />
        <p className={`text-3xl font-bold mb-1 ${grade.color}`}>{grade.label}</p>
        <p className="text-5xl font-bold text-white mt-3">{score}<span className="text-gray-500 text-2xl">/{questions.length}</span></p>
        <p className="text-gray-400 mt-1">{pct}% correct</p>
        <div className="w-full bg-gray-700 rounded-full h-2 mt-4 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={restart} className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-bold hover:opacity-90 transition-opacity cursor-pointer">
            <RotateCw size={16} /> Play Again
          </button>
          <button onClick={onClose} className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 py-3 rounded-xl font-bold transition-colors cursor-pointer">
            Back
          </button>
        </div>
      </div>
    </div>
  )

  // ── Question screen ──
  const catStyle = categoryColors[q.category] || 'bg-gray-500/20 text-gray-300 border-gray-500/30'

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${catStyle}`}>{q.category}</span>
          <span className="text-gray-500 text-sm">{index + 1} / {questions.length}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-800 border border-pink-500/40">
            <Zap size={13} className="text-pink-400" />
            <span className="text-pink-400 font-bold text-sm">{score}</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white cursor-pointer">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-800">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-500" style={{ width: `${((index) / questions.length) * 100}%` }} />
      </div>

      {/* Content */}
      <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-xl mx-auto space-y-4">
          {/* Question */}
          <div className="bg-gray-800/80 rounded-2xl border border-gray-700/50 p-5 shadow-xl">
            {(() => {
              // Format 1 — dynamic questions: "Instruction\n\nKorean sentence"
              if (q.question.includes('\n\n')) {
                const [instruction, sentence] = q.question.split('\n\n')
                return (
                  <>
                    <p className="text-gray-400 text-sm mb-3">{instruction}</p>
                    <p className="text-white text-2xl md:text-3xl font-bold tracking-wide">{sentence}</p>
                    {q.translation && <p className="text-gray-500 text-sm italic mt-3">{q.translation}</p>}
                  </>
                )
              }
              // Format 2 — static fill-in: 'Fill in: "Korean sentence" (English translation)'
              const fillMatch = q.question.match(/^(Fill in[^:]*:)\s*"([^"]+)"\s*(\([^)]+\))?$/)
              if (fillMatch) {
                return (
                  <>
                    <p className="text-gray-400 text-sm mb-3">{fillMatch[1]}</p>
                    <p className="text-white text-2xl md:text-3xl font-bold tracking-wide">{fillMatch[2]}</p>
                    {fillMatch[3] && <p className="text-gray-500 text-sm italic mt-3">{fillMatch[3]}</p>}
                  </>
                )
              }
              // Format 3 — other static questions: show as large primary text
              return (
                <>
                  <p className="text-white text-xl md:text-2xl font-bold">{q.question}</p>
                  {q.translation && <p className="text-gray-500 text-sm italic mt-3">{q.translation}</p>}
                </>
              )
            })()}
          </div>

          {/* Options — 2×2 grid */}
          <div className="grid grid-cols-2 gap-2">
            {q.options.map((opt, i) => {
              let style = 'bg-gray-800/70 border-gray-700/50 text-gray-200 hover:bg-gray-700/70 hover:border-gray-600 cursor-pointer'
              if (answered) {
                if (opt === q.answer) style = 'bg-green-900/40 border-green-500/60 text-green-200 cursor-default'
                else if (opt === selected) style = 'bg-red-900/40 border-red-500/60 text-red-200 cursor-default'
                else style = 'bg-gray-800/40 border-gray-700/30 text-gray-500 cursor-default'
              }
              return (
                <button
                  key={i}
                  onClick={() => choose(opt)}
                  className={`text-left px-3 py-3 rounded-xl border text-sm font-medium transition-all ${style}`}
                >
                  <span className="text-gray-500 mr-1.5">{String.fromCharCode(65 + i)}.</span>
                  {opt}
                </button>
              )
            })}
          </div>

          {/* Explanation */}
          {answered && (
            <div className={`rounded-xl border p-4 ${isCorrect ? 'bg-green-900/20 border-green-700/40' : 'bg-orange-900/20 border-orange-700/40'}`}>
              <p className={`text-sm font-bold mb-1 ${isCorrect ? 'text-green-400' : 'text-orange-400'}`}>
                {isCorrect ? '✓ Correct!' : `✗ The answer is: ${q.answer}`}
              </p>
              <p className="text-gray-300 text-sm leading-relaxed">{q.explanation}</p>
            </div>
          )}

        </div>
      </div>

      {/* Next button — always visible at bottom */}
      {answered && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-800">
          <button
            onClick={next}
            className="w-full max-w-xl mx-auto flex bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3.5 rounded-xl font-bold text-base hover:opacity-90 transition-opacity cursor-pointer items-center justify-center gap-2"
          >
            {index + 1 >= questions.length ? 'See Results' : 'Next Question'}
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  )
}
