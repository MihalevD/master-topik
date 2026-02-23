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
// Use type field from DB enrichment (lib/words.js); fall back to heuristic.
// adjective = 형용사 (descriptive verbs: 크다, 예쁘다, 좋다…)
// verb      = 동사  (action verbs: 가다, 먹다, 공부하다…)
const isNoun      = (w) => w.type ? w.type === 'noun'      : !w.korean.trimEnd().endsWith('다')
// For conjugation pools: adjectives conjugate identically to action verbs (아요/어요)
const isVerb      = (w) => w.type
  ? (w.type === 'verb' || w.type === 'adjective')
  : w.korean.trimEnd().endsWith('다')
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── Verb conjugation helpers ─────────────────────────────────────────────────
// Korean vowel harmony: bright (ㅏ/ㅗ family) → 아; dark → 어; 하다 → 해
const BRIGHT_VOWELS = new Set([0, 1, 2, 3, 8, 9, 10, 11, 12]) // jungseong indices

function stemVowelType(dictForm) {
  const stem = dictForm.slice(0, -1) // remove 다
  if (stem.endsWith('하')) return 'hada'
  const last = stem[stem.length - 1]
  const code = last?.charCodeAt(0) - 0xAC00
  if (!last || code < 0 || code >= 11172) return 'dark'
  return BRIGHT_VOWELS.has(Math.floor((code % 588) / 28)) ? 'bright' : 'dark'
}
function presentEnd(dictForm) {
  const t = stemVowelType(dictForm)
  return t === 'hada' ? '해요' : t === 'bright' ? '아요' : '어요'
}
function pastEnd(dictForm) {
  const t = stemVowelType(dictForm)
  return t === 'hada' ? '했어요' : t === 'bright' ? '았어요' : '었어요'
}

// Only generate conjugation questions for predictably regular verbs:
// - 하다 verbs (always regular)
// - consonant-ending stems where the batchim is NOT a known irregular class
//   (excludes ㄷ=7, ㅂ=17, ㅅ=19, ㅆ=20, ㅎ=27, 르 endings, and complex clusters)
// Vowel-ending stems are also excluded to avoid contraction complexity.
const SAFE_JONGSEONG = new Set([1, 2, 4, 8, 16, 21, 22, 23, 24, 25, 26])
function isConjugable(word) {
  const k = word.korean.trimEnd()
  if (!k.endsWith('다')) return false
  const stem = k.slice(0, -1)
  if (stem.endsWith('하')) return true          // 하다 — always safe
  if (stem.endsWith('르')) return false         // 르 irregular (모르다, 부르다)
  const last = stem[stem.length - 1]
  const code = last?.charCodeAt(0) - 0xAC00
  if (!last || code < 0 || code >= 11172) return false
  const jongseong = code % 28
  return SAFE_JONGSEONG.has(jongseong)          // safe consonant batchim only
}

// ── Dynamic question generators ─────────────────────────────────────────────
function makeSentenceStructureQ(word) {
  const last = lastKoreanChar(word.korean)
  if (!last) return null
  const hasC = hasJongseong(last)
  const obj = hasC ? `${word.korean}을` : `${word.korean}를`
  const correct = `저는 ${obj} 좋아해요.`
  return {
    category: 'SentenceStructure',
    question: `Choose the correct Korean word order:\n\n"I like ${word.english}."`,
    translation: `Korean word order: Subject (저는) + Object (${obj}) + Verb (좋아해요)`,
    answer: correct,
    options: shuffle([correct, `저는 좋아해요 ${obj}.`, `${obj} 좋아해요 저는.`, `좋아해요 저는 ${obj}.`]),
    explanation: `Korean uses SOV order: Subject (저는) + Object (${obj}) + Verb (좋아해요). The verb always comes last.`,
  }
}

function makeTopicVsSubjectQ(word) {
  const last = lastKoreanChar(word.korean)
  if (!last) return null
  const hasC = hasJongseong(last)
  const askTopic = Math.random() < 0.5
  if (askTopic) {
    const answer = hasC ? '은' : '는'
    const wrong  = hasC ? '는' : '은'
    return {
      category: 'TopicVsSubject',
      question: `Introduce "${word.english}" as the TOPIC of the sentence:\n\n${word.korean}___ 좋아요.`,
      translation: `"As for ${word.english}, it is good." — topic marker sets what the sentence is about`,
      answer,
      options: shuffle([answer, wrong, hasC ? '이' : '가', '를']),
      explanation: `을/를 marks the topic (은/는). "${word.korean}" ends with ${hasC ? 'a consonant → 은' : 'a vowel → 는'}. Use 은/는 for known or general topics; 이/가 for new/emphasized subjects.`,
    }
  } else {
    const answer = hasC ? '이' : '가'
    const wrong  = hasC ? '가' : '이'
    return {
      category: 'TopicVsSubject',
      question: `누가/무엇이 있어요? — mark "${word.english}" as the grammatical subject:\n\n${word.korean}___ 있어요.`,
      translation: `"There is ${word.english}." / "Is there ${word.english}?" — 이/가 marks the subject`,
      answer,
      options: shuffle([answer, wrong, hasC ? '은' : '는', '를']),
      explanation: `이/가 marks the grammatical subject (who/what does the action). "${word.korean}" ends with ${hasC ? 'a consonant → 이' : 'a vowel → 가'}. Use 이/가 to answer "who?" or introduce new information.`,
    }
  }
}

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

// ── Verb / adjective generators ──────────────────────────────────────────────

function makeVerbPresentQ(word) {
  const t    = stemVowelType(word.korean)
  const stem = word.korean.slice(0, -1)
  const answer = presentEnd(word.korean)
  // Options: correct ending + wrong vowel-harmony + 해요 (hada form) + past tense
  const options = shuffle(
    t === 'hada'   ? ['해요', '아요', '어요', '했어요'] :
    t === 'bright' ? ['아요', '어요', '해요', '았어요'] :
                     ['어요', '아요', '해요', '었어요']
  )
  return {
    category: 'Verb Form',
    question: `Choose the correct polite present ending:\n\n${stem}___`,
    translation: `"${word.korean}" = ${word.english}`,
    answer,
    options,
    explanation:
      t === 'hada'
        ? `"${word.korean}" is a 하다 verb → 해요.`
        : `Stem "${stem}" has a ${t === 'bright' ? 'bright vowel (ㅏ/ㅗ) → 아요' : 'dark vowel → 어요'}.`,
  }
}

function makeVerbPastQ(word) {
  const t    = stemVowelType(word.korean)
  const stem = word.korean.slice(0, -1)
  const answer = pastEnd(word.korean)
  const options = shuffle(
    t === 'hada'   ? ['했어요', '았어요', '었어요', '해요'] :
    t === 'bright' ? ['았어요', '었어요', '했어요', '아요'] :
                     ['었어요', '았어요', '했어요', '어요']
  )
  return {
    category: 'Verb Form',
    question: `Choose the correct past tense ending:\n\n${stem}___`,
    translation: `"${word.korean}" = ${word.english} (past tense)`,
    answer,
    options,
    explanation:
      t === 'hada'
        ? `"${word.korean}" is a 하다 verb → 했어요.`
        : `Stem "${stem}" has a ${t === 'bright' ? 'bright vowel → 았어요' : 'dark vowel → 었어요'}.`,
  }
}

function makeNegQ(word) {
  const stem   = word.korean.slice(0, -1)
  const pres   = presentEnd(word.korean)
  const t      = stemVowelType(word.korean)
  const wrongH = t === 'bright' ? `안 ${stem}어요` : `안 ${stem}아요`
  const answer = `안 ${stem}${pres}`
  return {
    category: 'Negation',
    question: `Choose the correct short negation (will not / does not):\n\n저는 ___`,
    translation: `"${word.korean}" = ${word.english} · "I don't ${word.english}"`,
    answer,
    options: shuffle([
      answer,
      `${stem}${pres} 안`,   // wrong word order
      `못 ${stem}${pres}`,   // wrong type (can't vs won't)
      wrongH,                // wrong vowel harmony
    ]),
    explanation: `Short negation: 안 comes before the verb. "안 ${stem}${pres}" = don't/won't ${word.english}. (못 = cannot; 안 = will not / does not)`,
  }
}

function makeConnQ(word) {
  const stem = word.korean.slice(0, -1)
  const t    = stemVowelType(word.korean)
  // -아서/어서 suffix (because/and-then, different from sequential -고)
  const causeSuffix = t === 'hada' ? '해서' : t === 'bright' ? '아서' : '어서'
  // -(으)면 suffix
  const last    = lastKoreanChar(stem)
  const condSuffix = last && hasJongseong(last) ? '으면' : '면'
  return {
    category: 'Connectives',
    question: `Choose the sequential connector ("and then") for:\n\n${stem}___`,
    translation: `"${word.korean}" = ${word.english}`,
    answer: '고',
    options: shuffle(['고', causeSuffix, '지만', condSuffix]),
    explanation: `Sequential -고 ("and then") attaches directly to the stem with no vowel harmony: ${stem}고. Unlike ${causeSuffix} (because/so) or 지만 (but).`,
  }
}

// ── Irregular verb conjugation ────────────────────────────────────────────────
// Precomputed correct forms for the most common TOPIK irregular verbs.
// Regular generators (makeVerbPresentQ / Past) exclude these via isConjugable().
const IRREGULAR_MAP = {
  // ── ㅂ irregular: final ㅂ → 우 before 아/어, then contracts ──────────────
  '덥다':     { pres: '더워요',     past: '더웠어요',    rule: 'ㅂ' },
  '춥다':     { pres: '추워요',     past: '추웠어요',    rule: 'ㅂ' },
  '어렵다':   { pres: '어려워요',   past: '어려웠어요',  rule: 'ㅂ' },
  '쉽다':     { pres: '쉬워요',     past: '쉬웠어요',    rule: 'ㅂ' },
  '가깝다':   { pres: '가까워요',   past: '가까웠어요',  rule: 'ㅂ' },
  '아름답다': { pres: '아름다워요', past: '아름다웠어요', rule: 'ㅂ' },
  '무겁다':   { pres: '무거워요',   past: '무거웠어요',  rule: 'ㅂ' },
  '가볍다':   { pres: '가벼워요',   past: '가벼웠어요',  rule: 'ㅂ' },
  '고맙다':   { pres: '고마워요',   past: '고마웠어요',  rule: 'ㅂ' },
  '맵다':     { pres: '매워요',     past: '매웠어요',    rule: 'ㅂ' },
  '뜨겁다':   { pres: '뜨거워요',   past: '뜨거웠어요',  rule: 'ㅂ' },
  '즐겁다':   { pres: '즐거워요',   past: '즐거웠어요',  rule: 'ㅂ' },
  '귀엽다':   { pres: '귀여워요',   past: '귀여웠어요',  rule: 'ㅂ' },
  '차갑다':   { pres: '차가워요',   past: '차가웠어요',  rule: 'ㅂ' },
  '넓다':     { pres: '넓어요',     past: '넓었어요',    rule: 'ㅂ' }, // regular ㅂ — included for contrast
  // ── ㄷ irregular: final ㄷ → ㄹ before vowel endings ─────────────────────
  '듣다':     { pres: '들어요',     past: '들었어요',    rule: 'ㄷ' },
  '걷다':     { pres: '걸어요',     past: '걸었어요',    rule: 'ㄷ' },
  '묻다':     { pres: '물어요',     past: '물었어요',    rule: 'ㄷ' }, // 묻다 = to ask (ㄷ irregular)
  // ── 르 irregular: 르 → ㄹ added to prev syllable + 라/러요 ───────────────
  '모르다':   { pres: '몰라요',     past: '몰랐어요',    rule: '르' },
  '부르다':   { pres: '불러요',     past: '불렀어요',    rule: '르' },
  '다르다':   { pres: '달라요',     past: '달랐어요',    rule: '르' },
  '빠르다':   { pres: '빨라요',     past: '빨랐어요',    rule: '르' },
  '고르다':   { pres: '골라요',     past: '골랐어요',    rule: '르' },
  '흐르다':   { pres: '흘러요',     past: '흘렀어요',    rule: '르' },
  '오르다':   { pres: '올라요',     past: '올랐어요',    rule: '르' },
  '자르다':   { pres: '잘라요',     past: '잘랐어요',    rule: '르' },
  // ── ㅎ irregular adjectives: ㅎ drops + remaining vowels contract ─────────
  '파랗다':   { pres: '파래요',     past: '파랬어요',    rule: 'ㅎ' },
  '노랗다':   { pres: '노래요',     past: '노랬어요',    rule: 'ㅎ' },
  '빨갛다':   { pres: '빨개요',     past: '빨갰어요',    rule: 'ㅎ' },
  '하얗다':   { pres: '하얘요',     past: '하얬어요',    rule: 'ㅎ' },
  '까맣다':   { pres: '까매요',     past: '까맸어요',    rule: 'ㅎ' },
  // ── 으 irregular: ㅡ drops before 아/어, harmony from preceding syllable ──
  '바쁘다':   { pres: '바빠요',     past: '바빴어요',    rule: '으' },
  '예쁘다':   { pres: '예뻐요',     past: '예뻤어요',    rule: '으' },
  '크다':     { pres: '커요',       past: '컸어요',      rule: '으' },
  '아프다':   { pres: '아파요',     past: '아팠어요',    rule: '으' },
  '기쁘다':   { pres: '기뻐요',     past: '기뻤어요',    rule: '으' },
  '슬프다':   { pres: '슬퍼요',     past: '슬펐어요',    rule: '으' },
  '나쁘다':   { pres: '나빠요',     past: '나빴어요',    rule: '으' },
}

const IRREGULAR_RULE_TEXT = {
  'ㅂ': 'ㅂ irregular (ㅂ 불규칙): final ㅂ → 우 before 아/어, then contracts (e.g. 덥+어요 → 더우어요 → 더워요).',
  'ㄷ': 'ㄷ irregular (ㄷ 불규칙): final ㄷ → ㄹ before vowel endings (e.g. 듣+어요 → 들어요).',
  '르': '르 irregular (르 불규칙): 르 drops, ㄹ attaches to the previous syllable, then 라/러요 (e.g. 모르 → 몰라요).',
  'ㅎ': 'ㅎ irregular (ㅎ 불규칙): final ㅎ drops before 아/어 and the vowels contract (e.g. 파랗+아요 → 파래요).',
  '으': '으 irregular (으 불규칙): ㅡ drops before 아/어, then harmony is determined by the preceding syllable (e.g. 바쁘 → 바빠요).',
}

function makeIrregularQ(word) {
  const entry = IRREGULAR_MAP[word.korean]
  if (!entry) return null
  const { pres, past, rule } = entry
  const stem = word.korean.slice(0, -1)
  // Ask present or past randomly for variety
  const askPast = Math.random() > 0.5
  const answer  = askPast ? past : pres
  const tense   = askPast ? 'past' : 'present'

  // Distractors: naive (stem+아/어요 without applying the rule) + wrong tense
  const naiveDark   = `${stem}어요`
  const naiveBright = `${stem}아요`
  const wrongTense  = askPast ? pres : past   // correct form but wrong tense

  // For ㅎ, naive form keeps ㅎ; show both naive options + wrong tense
  const rawOptions = rule === 'ㅎ'
    ? [answer, `${stem}아요`, `${stem}어요`, wrongTense]
    : [answer, naiveDark, naiveBright, wrongTense]

  const options = shuffle([...new Set(rawOptions)].slice(0, 4))

  return {
    category: 'IrregularVerbs',
    question: `${rule} irregular — choose the correct polite ${tense} form:\n\n${word.korean}`,
    translation: `"${word.korean}" = ${word.english}`,
    answer,
    options,
    explanation: `${IRREGULAR_RULE_TEXT[rule]} "${word.korean}" → ${pres} / ${past}.`,
  }
}

// ── Build question pool ──────────────────────────────────────────────────────
// pool: 'noun' → particle/copula generators; 'verb' → conjugation generators
// ruleTitle = exact rule.title string from grammar.js this generator tests.
// null = generator applies to any rule in that category (e.g. IrregularVerbs spans 5 rules).
const DYNAMIC_GENERATORS = [
  { cat: 'SentenceStructure', ruleTitle: 'SOV Word Order',                 fn: makeSentenceStructureQ, pool: 'noun' },
  { cat: 'TopicVsSubject',    ruleTitle: 'Topic vs. Subject',              fn: makeTopicVsSubjectQ,    pool: 'noun' },
  { cat: 'TopicMarker',       ruleTitle: 'Topic marker 은/는',             fn: makeTopicQ,             pool: 'noun' },
  { cat: 'ObjectMarker',      ruleTitle: 'Object marker 을/를',            fn: makeObjectQ,            pool: 'noun' },
  { cat: 'SubjectMarker',     ruleTitle: 'Subject marker 이/가',           fn: makeSubjectQ,           pool: 'noun' },
  { cat: 'Copula',            ruleTitle: 'To be 이에요/예요',              fn: makeCopulaQ,            pool: 'noun' },
  { cat: 'ConjParticle',      ruleTitle: 'With/And 와/과, 하고',           fn: makeConjQ,              pool: 'noun' },
  { cat: 'LocationParticle',  ruleTitle: 'Direction/Means/Role 으로/로',   fn: makeDirQ,               pool: 'noun' },
  { cat: 'Verb Form',         ruleTitle: 'Present tense -아요/어요',       fn: makeVerbPresentQ,       pool: 'verb' },
  { cat: 'Verb Form',         ruleTitle: 'Past tense -았어요/었어요',      fn: makeVerbPastQ,          pool: 'verb' },
  { cat: 'Negation',          ruleTitle: 'Short negation 안',              fn: makeNegQ,               pool: 'verb' },
  { cat: 'Connectives',       ruleTitle: 'And (actions) -고',              fn: makeConnQ,              pool: 'any'  },
  { cat: 'IrregularVerbs',    ruleTitle: null,                             fn: makeIrregularQ,         pool: 'irregular' },
]

function buildQuestions(practicedWords, allWords, selectedRules, staticQuestions) {
  // selectedRules: array of {gameCategory, title} OR legacy Set<gameCategory>
  let selectedCats, selectedTitles
  if (Array.isArray(selectedRules) && selectedRules.length > 0) {
    selectedCats   = new Set(selectedRules.map(r => r.gameCategory))
    selectedTitles = new Set(selectedRules.map(r => r.title))
  } else if (selectedRules instanceof Set && selectedRules.size > 0) {
    selectedCats   = selectedRules
    selectedTitles = null
  }

  const hasFilter = !!selectedCats
  const rawPool   = practicedWords.length > 0 ? practicedWords : allWords.slice(0, 30)

  const rawNouns  = rawPool.filter(isNoun)
  const nounPool  = rawNouns.length >= 5 ? rawNouns : rawPool.filter(w => !w.korean.trimEnd().endsWith('다'))
  const rawVerbs  = rawPool.filter(isVerb)
  const safeVerbs = rawVerbs.filter(isConjugable)
  const verbPool  = safeVerbs.length >= 3 ? safeVerbs : rawVerbs
  const irregularPool = (() => {
    const practiced = rawPool.filter(w => IRREGULAR_MAP[w.korean])
    return practiced.length >= 2 ? practiced : allWords.filter(w => IRREGULAR_MAP[w.korean])
  })()

  const getPool = (gen) =>
    gen.pool === 'noun'      ? nounPool :
    gen.pool === 'verb'      ? verbPool :
    gen.pool === 'irregular' ? irregularPool :
    rawPool

  const makeDynamic = (eligible, count) => {
    if (!eligible.length) return []
    const gens = shuffle([...eligible])
    const out  = []
    // Track used words per generator to avoid duplicate questions
    const usedPerGen = new Map()
    for (let i = 0; i < count; i++) {
      const gen  = gens[i % gens.length]
      const pool = getPool(gen)
      if (!pool.length) continue
      const used = usedPerGen.get(gen) || new Set()
      const available = pool.filter(w => !used.has(w.korean))
      if (!available.length) continue // all words exhausted for this generator
      const word = shuffle(available)[0]
      used.add(word.korean)
      usedPerGen.set(gen, used)
      const q = gen.fn(word)
      if (q) out.push({ ...q, ruleTitle: gen.ruleTitle ?? q.category })
    }
    return out
  }

  if (hasFilter) {
    // Generators that match selected categories, filtered by ruleTitle when available
    const eligible = DYNAMIC_GENERATORS.filter(g => {
      if (!selectedCats.has(g.cat)) return false
      // null ruleTitle = applies to any rule in this category (e.g. IrregularVerbs)
      if (g.ruleTitle === null) return true
      // With title filtering: only include generators whose ruleTitle is selected
      if (selectedTitles) return selectedTitles.has(g.ruleTitle)
      return true
    })

    // For static questions: tag with rule title when exactly 1 rule from that category is selected
    const catCount = {}
    if (selectedRules.forEach) selectedRules.forEach(r => { catCount[r.gameCategory] = (catCount[r.gameCategory] || 0) + 1 })
    const catToTitle = {}
    if (selectedRules.forEach) selectedRules.forEach(r => { if (catCount[r.gameCategory] === 1) catToTitle[r.gameCategory] = r.title })

    const filtered = staticQuestions
      .filter(q => selectedCats.has(q.category))
      .map(q => ({ ...q, ruleTitle: catToTitle[q.category] ?? q.category }))

    const cap = 5 + Math.floor(Math.random() * 6) // 5–10
    const dynamic = makeDynamic(eligible, 15)
    const result  = shuffle([...filtered, ...dynamic]).slice(0, cap)

    // Fallback: if title-filtering left us with too few questions, relax to category-level
    if (result.length < 4 && selectedTitles) {
      const fallbackGen = DYNAMIC_GENERATORS.filter(g => selectedCats.has(g.cat))
      const fallbackDyn = makeDynamic(fallbackGen, 15)
      return shuffle([...filtered, ...fallbackDyn]).slice(0, cap)
    }

    return result
  }

  // Unfiltered
  const cap = 5 + Math.floor(Math.random() * 6) // 5–10
  const dynamic = makeDynamic(DYNAMIC_GENERATORS, 15)
  return shuffle([...dynamic, ...shuffle(staticQuestions).slice(0, 12)]).slice(0, cap)
}

// ── Component ────────────────────────────────────────────────────────────────
const categoryColors = {
  // TOPIK I — sentence structure
  'SentenceStructure': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'TopicVsSubject':    'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
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
  'IrregularVerbs':  'bg-orange-500/20 text-orange-300 border-orange-500/30',
}

export default function GrammarGame({ wordStats, allWords, onClose, onComplete, selectedCategories, staticQuestions }) {
  const practicedWords = useMemo(() => {
    const keys = Object.keys(wordStats || {})
    return allWords.filter(w => keys.includes(w.korean))
  }, [wordStats, allWords])

  const buildFresh = () => buildQuestions(practicedWords, allWords, selectedCategories, staticQuestions)

  // ── Queue-based state ─────────────────────────────────────────────────────
  // Wrong answers are re-inserted into the queue to be asked again.
  const [queue, setQueue]               = useState(buildFresh)
  const [selected, setSelected]         = useState(null)
  const [totalCorrect, setTotalCorrect] = useState(0)
  const [totalAnswered, setTotalAnswered] = useState(0)
  const [streak, setStreak]             = useState(0)
  const [done, setDone]                 = useState(false)
  const initialCount = useRef(null)
  if (initialCount.current === null) initialCount.current = queue.length

  const answersRef   = useRef([])
  const scrollAreaRef = useRef(null)

  const q        = queue[0]
  const answered = selected !== null
  const isCorrect = selected === q?.answer

  useEffect(() => {
    if (scrollAreaRef.current) scrollAreaRef.current.scrollTop = 0
  }, [queue.length, queue[0]])

  function choose(opt) {
    if (answered) return
    const correct = opt === q.answer
    answersRef.current.push({ category: q.category, ruleTitle: q.ruleTitle || q.category, correct })
    setSelected(opt)
    setTotalAnswered(a => a + 1)
    if (correct) {
      setTotalCorrect(c => c + 1)
      setStreak(s => s + 1)
    } else {
      setStreak(0)
    }
  }

  function next() {
    const [current, ...newQueue] = queue
    const wasCorrect = selected === current.answer

    if (newQueue.length === 0) {
      onComplete?.(totalCorrect, totalAnswered, answersRef.current)
      setDone(true)
    } else {
      setQueue(newQueue)
      setSelected(null)
    }
  }

  function restart() {
    const fresh = buildFresh()
    answersRef.current = []
    initialCount.current = fresh.length
    setQueue(fresh)
    setSelected(null)
    setTotalCorrect(0)
    setTotalAnswered(0)
    setStreak(0)
    setDone(false)
  }

  // ── Not enough words screen ──
  const MIN_NOUNS = 5
  const MIN_VERBS = 3
  const practicedNouns = practicedWords.filter(isNoun)
  const practicedVerbs = practicedWords.filter(isVerb)
  const unlockedNouns  = practicedNouns.length >= MIN_NOUNS
  const unlockedVerbs  = practicedVerbs.length >= MIN_VERBS
  if (!unlockedNouns || !unlockedVerbs) return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="bg-gray-800/80 rounded-2xl border border-gray-700/50 p-8 max-w-sm w-full text-center shadow-2xl">
        <BookOpen className="mx-auto mb-4 text-purple-400" size={48} />
        <p className="text-white text-xl font-bold mb-2">Unlock Grammar Game</p>
        <p className="text-gray-400 text-sm leading-relaxed mb-6">
          Practice more vocabulary to unlock dynamic grammar questions.
        </p>

        {/* Noun progress */}
        <div className="mb-4 text-left">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-sm text-gray-300 font-medium">Nouns <span className="text-gray-500 font-normal text-xs">(명사)</span></span>
            <span className={`text-sm font-bold ${unlockedNouns ? 'text-green-400' : 'text-gray-400'}`}>
              {practicedNouns.length} / {MIN_NOUNS}
              {unlockedNouns && ' ✓'}
            </span>
          </div>
          <div className="w-full bg-gray-700/60 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${unlockedNouns ? 'bg-green-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.min(100, (practicedNouns.length / MIN_NOUNS) * 100)}%` }}
            />
          </div>
        </div>

        {/* Verb progress */}
        <div className="mb-8 text-left">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-sm text-gray-300 font-medium">Verbs & Adjectives <span className="text-gray-500 font-normal text-xs">(동사·형용사)</span></span>
            <span className={`text-sm font-bold ${unlockedVerbs ? 'text-green-400' : 'text-gray-400'}`}>
              {practicedVerbs.length} / {MIN_VERBS}
              {unlockedVerbs && ' ✓'}
            </span>
          </div>
          <div className="w-full bg-gray-700/60 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${unlockedVerbs ? 'bg-green-500' : 'bg-violet-500'}`}
              style={{ width: `${Math.min(100, (practicedVerbs.length / MIN_VERBS) * 100)}%` }}
            />
          </div>
        </div>

        <button onClick={onClose} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-bold hover:opacity-90 transition-opacity cursor-pointer">
          Go to Vocabulary
        </button>
      </div>
    </div>
  )

  const pct   = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0
  const grade = pct >= 90 ? { label: 'Excellent!',     color: 'text-green-400'  }
              : pct >= 70 ? { label: 'Good job!',       color: 'text-blue-400'   }
              : pct >= 50 ? { label: 'Keep going!',     color: 'text-yellow-400' }
              :              { label: 'Keep studying!', color: 'text-orange-400' }

  // ── Done screen ──
  if (done) {
    // Per-rule breakdown sorted worst → best
    const catMap = {}
    for (const { ruleTitle, correct } of answersRef.current) {
      const key = ruleTitle
      if (!catMap[key]) catMap[key] = { correct: 0, total: 0 }
      catMap[key].total++
      if (correct) catMap[key].correct++
    }
    const cats = Object.entries(catMap).sort(([, a], [, b]) => (a.correct / a.total) - (b.correct / b.total))

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="bg-gray-800/80 rounded-2xl border border-gray-700/50 p-6 max-w-sm w-full shadow-2xl">
          <div className="text-center mb-5">
            <Trophy className="mx-auto mb-3 text-yellow-400" size={40} />
            <p className={`text-2xl font-bold mb-1 ${grade.color}`}>{grade.label}</p>
            <p className="text-4xl font-bold text-white mt-2">
              {totalCorrect}<span className="text-gray-500 text-xl">/{totalAnswered}</span>
            </p>
            <p className="text-gray-500 text-sm mt-1">{pct}% first-try accuracy</p>
            <div className="w-full bg-gray-700 rounded-full h-1.5 mt-3 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>

          {/* Per-rule breakdown */}
          {cats.length > 0 && (
            <div className="border-t border-gray-700/50 pt-4 mb-5">
              <p className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold mb-3">By rule</p>
              <div className="space-y-2">
                {cats.map(([cat, { correct: c, total: t }]) => {
                  const a = Math.round((c / t) * 100)
                  const barColor = a >= 80 ? 'bg-green-500' : a >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                  const textColor = a >= 80 ? 'text-green-400' : a >= 50 ? 'text-yellow-400' : 'text-red-400'
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs text-gray-400 truncate max-w-[65%]">{cat}</span>
                        <span className={`text-xs font-bold tabular-nums ${textColor}`}>{c}/{t}</span>
                      </div>
                      <div className="h-1 bg-gray-700/60 rounded-full overflow-hidden">
                        <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${a}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={restart} className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-bold hover:opacity-90 transition-opacity cursor-pointer text-sm">
              <RotateCw size={15} /> Play Again
            </button>
            <button onClick={onClose} className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 py-3 rounded-xl font-bold transition-colors cursor-pointer text-sm">
              Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Question screen ──
  const catStyle = categoryColors[q.category] || 'bg-gray-500/20 text-gray-300 border-gray-500/30'
  const progressPct = initialCount.current > 0
    ? Math.round((totalCorrect / initialCount.current) * 100)
    : 0

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold flex-shrink-0 ${catStyle}`}>{q.category}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Correct counter */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-800 border border-purple-500/30">
            <span className="text-purple-400 font-bold text-xs">✓ {totalCorrect}</span>
          </div>
          {/* Streak — shown when > 1 */}
          {streak > 1 && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/30">
              <span className="text-orange-400 font-bold text-xs">🔥{streak}</span>
            </div>
          )}
          {/* Remaining */}
          <span className="text-gray-600 text-xs tabular-nums">{queue.length} left</span>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white cursor-pointer">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Progress bar — fills as you get correct answers */}
      <div className="h-1 bg-gray-800">
        <div
          className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
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
              <p className={`text-sm font-bold mb-1.5 ${isCorrect ? 'text-green-400' : 'text-orange-400'}`}>
                {isCorrect
                  ? `✓ Correct!${streak > 2 ? ` 🔥 ${streak} in a row` : ''}`
                  : `✗ Answer: ${q.answer}`}
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
            {queue.length <= 1 ? 'See Results' : 'Next Question'}
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  )
}
