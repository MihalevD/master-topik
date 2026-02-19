'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { Zap, RotateCw, Trophy, ChevronRight, X, BookOpen } from 'lucide-react'

// ── Korean helpers ──────────────────────────────────────────────────────────
function hasJongseong(char) {
  const c = char.charCodeAt(0)
  return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0
}
function lastKoreanChar(str) {
  for (let i = str.length - 1; i >= 0; i--) {
    const c = str.charCodeAt(i)
    if (c >= 0xAC00 && c <= 0xD7A3) return str[i]
  }
  return null
}
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
    category: 'Particles',
    question: `Choose the correct topic marker (은/는):\n\n${word.korean}___ ${word.english}이에요.`,
    translation: `"${word.korean}" = ${word.english}`,
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
    category: 'Particles',
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
    category: 'Particles',
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

function makeSentenceQ(word, allWords) {
  const distractors = shuffle(allWords.filter(w => w.korean !== word.korean))
    .slice(0, 3)
    .map(w => w.sentences[1])
  return {
    category: 'Reading',
    question: `What does this sentence mean?\n\n${word.sentences[0]}`,
    answer: word.sentences[1],
    options: shuffle([word.sentences[1], ...distractors]),
    explanation: `"${word.sentences[0]}" = "${word.sentences[1]}". Key word: ${word.korean} (${word.english}).`,
  }
}

// ── Static grammar questions ─────────────────────────────────────────────────
const staticQuestions = [
  // Verb conjugation
  {
    category: 'Verb Form',
    question: 'What is the polite present tense of 먹다 (to eat)?',
    answer: '먹어요',
    options: ['먹어요', '먹았어요', '먹을 거예요', '먹고 있어요'],
    explanation: '먹다 → stem 먹 → vowel ㅓ (not ㅏ/ㅗ) → add 어요 → 먹어요.',
  },
  {
    category: 'Verb Form',
    question: 'What is the polite present tense of 가다 (to go)?',
    answer: '가요',
    options: ['가요', '갔어요', '갈 거예요', '가서요'],
    explanation: '가다 → stem 가 → vowel ㅏ → add 아요, but 가 + 아요 contracts to 가요.',
  },
  {
    category: 'Verb Form',
    question: 'What is the polite past tense of 먹다 (to eat)?',
    answer: '먹었어요',
    options: ['먹었어요', '먹어요', '먹을 거예요', '먹었습니다'],
    explanation: 'Stem 먹 + 었어요 (non-ㅏ/ㅗ past suffix) = 먹었어요.',
  },
  {
    category: 'Verb Form',
    question: 'What is the polite past tense of 가다 (to go)?',
    answer: '갔어요',
    options: ['갔어요', '가요', '갈 거예요', '가았어요'],
    explanation: '가다 → 가 + 았어요 → contracts to 갔어요.',
  },
  {
    category: 'Verb Form',
    question: 'How do you say "I will eat" (future intention)?',
    answer: '먹을 거예요',
    options: ['먹을 거예요', '먹어요', '먹었어요', '먹고 싶어요'],
    explanation: 'Stem 먹 (ends in consonant) + 을 거예요 = 먹을 거예요.',
  },
  {
    category: 'Verb Form',
    question: 'How do you say "I am eating" (progressive)?',
    answer: '먹고 있어요',
    options: ['먹고 있어요', '먹어요', '먹었어요', '먹을 거예요'],
    explanation: 'Verb stem + 고 있어요 expresses ongoing action, like English "-ing".',
  },
  // Negation
  {
    category: 'Negation',
    question: 'How do you say "I don\'t go" using short negation?',
    answer: '안 가요',
    options: ['안 가요', '못 가요', '가지 않아요', '가지 못해요'],
    explanation: '안 + verb = short negation (choice not to do). 안 가요 = I don\'t go.',
  },
  {
    category: 'Negation',
    question: 'What is the difference between 안 가요 and 못 가요?',
    answer: '안 = won\'t (choice), 못 = can\'t (inability)',
    options: [
      '안 = won\'t (choice), 못 = can\'t (inability)',
      '안 = past, 못 = future',
      '안 = formal, 못 = informal',
      'They mean the same thing',
    ],
    explanation: '안 expresses a deliberate choice not to do something. 못 expresses inability.',
  },
  {
    category: 'Negation',
    question: 'How do you say "There is no time" / "I don\'t have time"?',
    answer: '시간이 없어요',
    options: ['시간이 없어요', '시간이 안 있어요', '시간이 못해요', '시간은 아니에요'],
    explanation: '없어요 (to not exist / not have) is the correct negation of 있어요.',
  },
  // Connectives
  {
    category: 'Connectives',
    question: 'Fill in the blank: "비싸___ 맛있어요." (expensive but delicious)',
    answer: '지만',
    options: ['지만', '고', '서', '면'],
    explanation: '-지만 connects two contrasting ideas. 비싸다 → 비싸지만 (but).',
  },
  {
    category: 'Connectives',
    question: 'Fill in the blank: "밥을 먹___ 학교에 가요." (eat and then go to school)',
    answer: '고',
    options: ['고', '서', '지만', '면'],
    explanation: '-고 connects sequential or simultaneous actions. 먹다 → 먹고.',
  },
  {
    category: 'Connectives',
    question: 'Fill in the blank: "배가 고파___ 먹었어요." (ate because hungry)',
    answer: '서',
    options: ['서', '고', '지만', '니까'],
    explanation: '-아서/어서 expresses reason/cause. 고프다 → 고파서.',
  },
  {
    category: 'Connectives',
    question: 'Fill in the blank: "시간이 있___ 와요." (if you have time, come)',
    answer: '으면',
    options: ['으면', '고', '서', '지만'],
    explanation: '-(으)면 = "if/when". 있다 → consonant stem → 있으면.',
  },
  // Location particles
  {
    category: 'Particles',
    question: 'Fill in the blank: "학교___ 공부해요." (I study AT school — action)',
    answer: '에서',
    options: ['에서', '에', '으로', '와'],
    explanation: '에서 marks the place where an action happens. 에 is for existence or direction.',
  },
  {
    category: 'Particles',
    question: 'Fill in the blank: "학교___ 가요." (I go TO school)',
    answer: '에',
    options: ['에', '에서', '으로', '가'],
    explanation: '에 marks direction/destination with movement verbs like 가다, 오다.',
  },
  {
    category: 'Particles',
    question: 'Fill in the blank: "버스___ 학교에 가요." (I go to school BY bus)',
    answer: '로',
    options: ['로', '에서', '에', '을'],
    explanation: '으로/로 marks means of transport. 버스 ends in a vowel → 로.',
  },
  // Patterns
  {
    category: 'Patterns',
    question: 'How do you say "I want to go to Korea"?',
    answer: '한국에 가고 싶어요',
    options: ['한국에 가고 싶어요', '한국에 갈 거예요', '한국에 가서 싶어요', '한국에 가면 싶어요'],
    explanation: 'Verb stem + 고 싶어요 = want to do. 가다 → 가고 싶어요.',
  },
  {
    category: 'Patterns',
    question: 'How do you say "I can speak Korean"?',
    answer: '한국어를 할 수 있어요',
    options: ['한국어를 할 수 있어요', '한국어를 하고 싶어요', '한국어를 해서 있어요', '한국어를 할 거예요'],
    explanation: 'Verb stem + (으)ㄹ 수 있어요 = can / able to. 하다 → 할 수 있어요.',
  },
  {
    category: 'Patterns',
    question: 'How do you say "I am planning to study"?',
    answer: '공부하려고 해요',
    options: ['공부하려고 해요', '공부할 거예요', '공부하고 싶어요', '공부하면 해요'],
    explanation: 'Verb stem + (으)려고 해요 = plan/intend to. 공부하다 → 공부하려고 해요.',
  },
  {
    category: 'Patterns',
    question: 'What does "-고 있어요" express?',
    answer: 'An ongoing action (equivalent to -ing)',
    options: [
      'An ongoing action (equivalent to -ing)',
      'A completed past action',
      'A future intention',
      'A polite request',
    ],
    explanation: 'Verb stem + 고 있어요 = progressive tense. 먹고 있어요 = (I am) eating.',
  },
  // Copula
  {
    category: 'Copula',
    question: 'How do you say "I am not a student"?',
    answer: '저는 학생이 아니에요',
    options: ['저는 학생이 아니에요', '저는 학생이 없어요', '저는 학생 안이에요', '저는 학생이 아요'],
    explanation: 'Noun + 이/가 아니에요 = "is not (noun)". This is the negative of 이에요/예요.',
  },
  {
    category: 'Copula',
    question: 'How do you ask "Is there a book?"',
    answer: '책이 있어요?',
    options: ['책이 있어요?', '책이 이에요?', '책이 가요?', '책이 와요?'],
    explanation: 'Noun + 이/가 있어요 = there is / (I) have. 책 (consonant) → 책이 있어요?',
  },
  // Numbers
  {
    category: 'Numbers',
    question: 'Which number system is used for counting objects (e.g., "three apples")?',
    answer: 'Native Korean (하나, 둘, 셋…)',
    options: [
      'Native Korean (하나, 둘, 셋…)',
      'Sino-Korean (일, 이, 삼…)',
      'Either system works',
      'Arabic numerals only',
    ],
    explanation: 'Native Korean numbers (하나/한, 둘/두, 셋/세…) are used with counters for objects and people.',
  },
  {
    category: 'Numbers',
    question: 'Which number system is used for prices and dates?',
    answer: 'Sino-Korean (일, 이, 삼…)',
    options: [
      'Sino-Korean (일, 이, 삼…)',
      'Native Korean (하나, 둘, 셋…)',
      'Either system works',
      'Only Arabic numerals',
    ],
    explanation: 'Sino-Korean (일, 이, 삼…) is used for money, dates, minutes, phone numbers.',
  },
  // Honorifics
  {
    category: 'Patterns',
    question: 'How do you politely say "Please sit down"?',
    answer: '앉으세요',
    options: ['앉으세요', '앉아요', '앉고 싶어요', '앉을 거예요'],
    explanation: '-(으)세요 is a polite request/command form. 앉다 (consonant) → 앉으세요.',
  },
  {
    category: 'Verb Form',
    question: 'What is the correct polite present of 하다 (to do)?',
    answer: '해요',
    options: ['해요', '하어요', '하요', '했어요'],
    explanation: '하다 is irregular: 하 + 여요 → 해요 (contraction).',
  },
]

// ── Build question pool ──────────────────────────────────────────────────────
function buildQuestions(practicedWords, allWords, selectedCategories) {
  const useAll = !selectedCategories || selectedCategories.size === 0
  const allow = (cat) => useAll || selectedCategories.has(cat)

  const dynamic = []
  const pool = practicedWords.length > 0 ? practicedWords : allWords.slice(0, 30)
  const selected = shuffle(pool).slice(0, 15)

  for (const word of selected) {
    const generators = []
    if (allow('Particles')) generators.push(makeTopicQ, makeObjectQ, makeSubjectQ)
    if (allow('Copula')) generators.push(makeCopulaQ)
    if (generators.length === 0) break
    const q = shuffle(generators)[0](word)
    if (q) dynamic.push(q)
  }

  // Sentence/reading questions — included when Particles is selected
  if (allow('Particles')) {
    const sentencePool = practicedWords.length > 0 ? practicedWords : allWords.slice(0, 20)
    for (const word of shuffle(sentencePool).slice(0, 5)) {
      dynamic.push(makeSentenceQ(word, allWords))
    }
  }

  const filteredStatic = useAll
    ? staticQuestions
    : staticQuestions.filter(q => allow(q.category))

  return shuffle([...dynamic, ...shuffle(filteredStatic).slice(0, 12)]).slice(0, 10)
}

// ── Component ────────────────────────────────────────────────────────────────
const categoryColors = {
  'Particles':   'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Verb Form':   'bg-green-500/20 text-green-300 border-green-500/30',
  'Negation':    'bg-red-500/20 text-red-300 border-red-500/30',
  'Connectives': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'Copula':      'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'Patterns':    'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'Reading':     'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  'Numbers':     'bg-teal-500/20 text-teal-300 border-teal-500/30',
}

export default function GrammarGame({ wordStats, allWords, onClose, selectedCategories }) {
  const practicedWords = useMemo(() => {
    const keys = Object.keys(wordStats || {})
    return allWords.filter(w => keys.includes(w.korean))
  }, [wordStats, allWords])

  const [questions, setQuestions] = useState(() => buildQuestions(practicedWords, allWords, selectedCategories))
  const [index, setIndex]         = useState(0)
  const [selected, setSelected]   = useState(null)
  const [score, setScore]         = useState(0)
  const [done, setDone]           = useState(false)

  const q = questions[index]
  const answered = selected !== null
  const isCorrect = selected === q?.answer
  const scrollAreaRef = useRef(null)

  useEffect(() => {
    if (scrollAreaRef.current) scrollAreaRef.current.scrollTop = 0
  }, [index])

  function choose(opt) {
    if (answered) return
    setSelected(opt)
    if (opt === q.answer) setScore(s => s + 1)
  }

  function next() {
    if (index + 1 >= questions.length) {
      setDone(true)
    } else {
      setIndex(i => i + 1)
      setSelected(null)
    }
  }

  function restart() {
    setQuestions(buildQuestions(practicedWords, allWords, selectedCategories))
    setIndex(0)
    setSelected(null)
    setScore(0)
    setDone(false)
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
            {q.question.split('\n\n').map((part, i) => (
              <p key={i} className={i === 0 ? 'text-gray-300 text-sm mb-3' : 'text-white text-xl md:text-2xl font-bold'}>{part}</p>
            ))}
            {q.translation && (
              <p className="text-gray-500 text-sm italic mt-2">{q.translation}</p>
            )}
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
