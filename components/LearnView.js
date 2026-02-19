'use client'

import { useState } from 'react'
import { BookOpen, ChevronDown, ChevronRight, Zap, Check } from 'lucide-react'

const grammar = [
  {
    category: 'Sentence Structure',
    gameCategory: 'Particles',
    color: 'purple',
    rules: [
      {
        title: 'SOV Word Order',
        pattern: 'Subject + Object + Verb',
        example: '저는 사과를 먹어요.',
        translation: 'I eat an apple.',
        note: 'Korean always puts the verb at the end of the sentence.',
      },
      {
        title: 'Topic vs. Subject',
        pattern: 'Topic: 은/는 · Subject: 이/가',
        example: '저는 학생이에요. 제가 해요.',
        translation: 'I am a student. (It is) I who does it.',
        note: '은/는 marks the topic (what we are talking about); 이/가 marks the grammatical subject.',
      },
    ],
  },
  {
    category: 'Particles (조사)',
    gameCategory: 'Particles',
    color: 'blue',
    rules: [
      {
        title: 'Topic marker 은/는',
        pattern: 'Noun(consonant) + 은 · Noun(vowel) + 는',
        example: '저는 한국어를 공부해요.',
        translation: 'I study Korean.',
        note: '은 after a consonant, 는 after a vowel.',
      },
      {
        title: 'Subject marker 이/가',
        pattern: 'Noun(consonant) + 이 · Noun(vowel) + 가',
        example: '고양이가 귀여워요.',
        translation: 'The cat is cute.',
        note: '이 after a consonant, 가 after a vowel.',
      },
      {
        title: 'Object marker 을/를',
        pattern: 'Noun(consonant) + 을 · Noun(vowel) + 를',
        example: '물을 마셔요.',
        translation: 'I drink water.',
        note: '을 after a consonant, 를 after a vowel.',
      },
      {
        title: 'Location 에 vs 에서',
        pattern: '에 = place of existence/direction · 에서 = place of action',
        example: '학교에 가요. 학교에서 공부해요.',
        translation: 'I go to school. I study at school.',
        note: '에 is used with 있다/없다 and movement verbs; 에서 is used with action verbs.',
      },
      {
        title: 'Possessive marker 의',
        pattern: 'Noun + 의 + Noun',
        example: '제 친구의 책이에요.',
        translation: 'It is my friend\'s book.',
        note: '의 is often dropped in casual speech.',
      },
      {
        title: 'Direction/Means 으로/로',
        pattern: 'Noun(consonant except ㄹ) + 으로 · Noun(vowel or ㄹ) + 로',
        example: '왼쪽으로 가세요. 버스로 가요.',
        translation: 'Go to the left. I go by bus.',
        note: 'Used for direction, means of transport, or tool.',
      },
      {
        title: 'With/And 와/과, 하고',
        pattern: 'Noun(vowel) + 와 · Noun(consonant) + 과 · Noun + 하고 (casual)',
        example: '친구와 영화를 봐요.',
        translation: 'I watch a movie with a friend.',
        note: '하고 is more common in spoken Korean.',
      },
    ],
  },
  {
    category: 'Verb Conjugation',
    gameCategory: 'Verb Form',
    color: 'green',
    rules: [
      {
        title: 'Present tense -아요/어요',
        pattern: 'Stem(아/오 vowel) + 아요 · Stem(other) + 어요',
        example: '먹어요. 가요. 해요.',
        translation: 'Eat. Go. Do.',
        note: '하다 verbs → 해요. Stems ending in ㅏ/ㅗ take 아요, all others take 어요.',
      },
      {
        title: 'Past tense -았어요/었어요',
        pattern: 'Stem(아/오) + 았어요 · Stem(other) + 었어요',
        example: '먹었어요. 갔어요. 했어요.',
        translation: 'Ate. Went. Did.',
        note: '하다 verbs → 했어요.',
      },
      {
        title: 'Future -(으)ㄹ 거예요',
        pattern: 'Stem(consonant) + 을 거예요 · Stem(vowel) + ㄹ 거예요',
        example: '먹을 거예요. 갈 거예요.',
        translation: 'I will eat. I will go.',
        note: 'Expresses future plans or intentions.',
      },
      {
        title: 'Intention -(으)려고 해요',
        pattern: 'Stem(consonant) + 으려고 해요 · Stem(vowel) + 려고 해요',
        example: '공부하려고 해요.',
        translation: 'I am planning to study.',
        note: 'Expresses a plan or intention.',
      },
      {
        title: 'Progressive -고 있어요',
        pattern: 'Verb stem + 고 있어요',
        example: '밥을 먹고 있어요.',
        translation: 'I am eating.',
        note: 'Equivalent to the English "-ing" form.',
      },
    ],
  },
  {
    category: 'Negative Forms',
    gameCategory: 'Negation',
    color: 'red',
    rules: [
      {
        title: 'Short negation 안',
        pattern: '안 + Verb/Adjective',
        example: '안 먹어요. 안 가요.',
        translation: 'I don\'t eat. I don\'t go.',
        note: '안 is placed directly before the verb. Not used with 하다 → 하다 → 안 해요.',
      },
      {
        title: 'Long negation -지 않아요',
        pattern: 'Verb stem + 지 않아요',
        example: '먹지 않아요.',
        translation: 'I do not eat.',
        note: 'More formal than 안. Works with all verbs.',
      },
      {
        title: 'Cannot -지 못해요 / 못',
        pattern: '못 + Verb · Verb stem + 지 못해요',
        example: '못 가요. 가지 못해요.',
        translation: 'I can\'t go.',
        note: 'Expresses inability (not a choice, but a limitation).',
      },
      {
        title: 'Not exist 없어요',
        pattern: 'Noun + 이/가 없어요',
        example: '시간이 없어요.',
        translation: 'There is no time. / I don\'t have time.',
        note: 'Opposite of 있어요.',
      },
    ],
  },
  {
    category: 'Connectives',
    gameCategory: 'Connectives',
    color: 'yellow',
    rules: [
      {
        title: 'And (actions) -고',
        pattern: 'Verb stem + 고',
        example: '밥을 먹고 학교에 가요.',
        translation: 'I eat and (then) go to school.',
        note: 'Connects two sequential or simultaneous actions.',
      },
      {
        title: 'But -지만',
        pattern: 'Verb/Adj stem + 지만',
        example: '비싸지만 맛있어요.',
        translation: 'It is expensive but delicious.',
        note: 'Contrasts two clauses.',
      },
      {
        title: 'If -(으)면',
        pattern: 'Stem(consonant) + 으면 · Stem(vowel/ㄹ) + 면',
        example: '시간이 있으면 와요.',
        translation: 'If you have time, come.',
        note: 'Used for conditions.',
      },
      {
        title: 'Because -아서/어서',
        pattern: 'Stem(아/오) + 아서 · Stem(other) + 어서',
        example: '배가 고파서 먹어요.',
        translation: 'I eat because I am hungry.',
        note: 'Cannot be used with past/future tense endings.',
      },
      {
        title: 'Because -(으)니까',
        pattern: 'Stem(consonant) + 으니까 · Stem(vowel) + 니까',
        example: '늦으니까 빨리 가요.',
        translation: 'Since it\'s late, hurry.',
        note: 'Can combine with past tense; often used for commands/suggestions.',
      },
      {
        title: 'When -(으)ㄹ 때',
        pattern: 'Verb/Adj stem + (으)ㄹ 때',
        example: '어릴 때 한국에 살았어요.',
        translation: 'When I was young, I lived in Korea.',
        note: 'Expresses "when/at the time of".',
      },
    ],
  },
  {
    category: 'Copula & Existence',
    gameCategory: 'Copula',
    color: 'pink',
    rules: [
      {
        title: 'To be 이에요/예요',
        pattern: 'Noun(consonant) + 이에요 · Noun(vowel) + 예요',
        example: '저는 학생이에요. 저는 의사예요.',
        translation: 'I am a student. I am a doctor.',
        note: 'Polite form of 이다.',
      },
      {
        title: 'Not to be 이/가 아니에요',
        pattern: 'Noun + 이/가 아니에요',
        example: '저는 학생이 아니에요.',
        translation: 'I am not a student.',
        note: 'Negative form of 이다.',
      },
      {
        title: 'Exist/Have 있어요',
        pattern: 'Noun + 이/가 있어요',
        example: '책이 있어요. 시간이 있어요?',
        translation: 'There is a book. / Do you have time?',
        note: 'Used for existence and possession.',
      },
      {
        title: 'Not exist/Don\'t have 없어요',
        pattern: 'Noun + 이/가 없어요',
        example: '돈이 없어요.',
        translation: 'There is no money. / I don\'t have money.',
        note: 'Opposite of 있어요.',
      },
    ],
  },
  {
    category: 'Requests & Suggestions',
    gameCategory: 'Patterns',
    color: 'orange',
    rules: [
      {
        title: 'Please do -(으)세요',
        pattern: 'Stem(consonant) + 으세요 · Stem(vowel/ㄹ) + 세요',
        example: '앉으세요. 드세요.',
        translation: 'Please sit. Please eat.',
        note: 'Polite request or honorific present tense.',
      },
      {
        title: 'Let\'s -아요/어요 (suggestion)',
        pattern: 'Same as present tense',
        example: '같이 가요!',
        translation: 'Let\'s go together!',
        note: 'The same -아요/어요 form is used for suggestions depending on context.',
      },
      {
        title: 'Want to -고 싶어요',
        pattern: 'Verb stem + 고 싶어요',
        example: '한국에 가고 싶어요.',
        translation: 'I want to go to Korea.',
        note: 'Expresses a desire.',
      },
      {
        title: 'Can/Able to -(으)ㄹ 수 있어요',
        pattern: 'Stem(consonant) + 을 수 있어요 · Stem(vowel) + ㄹ 수 있어요',
        example: '한국어를 할 수 있어요.',
        translation: 'I can speak Korean.',
        note: 'Negate with -(으)ㄹ 수 없어요 or 없다.',
      },
    ],
  },
  {
    category: 'Numbers & Counters',
    gameCategory: 'Numbers',
    color: 'teal',
    rules: [
      {
        title: 'Sino-Korean numbers (일, 이, 삼…)',
        pattern: '일(1) 이(2) 삼(3) 사(4) 오(5) 육(6) 칠(7) 팔(8) 구(9) 십(10)',
        example: '십오 분, 삼월, 오백 원',
        translation: '15 minutes, March, 500 won',
        note: 'Used for dates, money, minutes, phone numbers.',
      },
      {
        title: 'Native Korean numbers (하나, 둘, 셋…)',
        pattern: '하나(1) 둘(2) 셋(3) 넷(4) 다섯(5) 여섯(6) 일곱(7) 여덟(8) 아홉(9) 열(10)',
        example: '사람 두 명, 사과 세 개',
        translation: 'Two people, three apples',
        note: 'Used with counters for counting objects and people. 하나→한, 둘→두, 셋→세, 넷→네 before counters.',
      },
      {
        title: 'Common counters',
        pattern: '개 (objects) · 명 (people) · 권 (books) · 잔 (drinks) · 번 (times)',
        example: '커피 두 잔, 책 한 권, 세 번',
        translation: 'Two coffees, one book, three times',
        note: 'Counter follows the number.',
      },
    ],
  },
]

const colorMap = {
  purple: { badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30', dot: 'bg-purple-500', header: 'text-purple-300' },
  blue:   { badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',     dot: 'bg-blue-500',   header: 'text-blue-300'   },
  green:  { badge: 'bg-green-500/20 text-green-300 border-green-500/30',  dot: 'bg-green-500',  header: 'text-green-300'  },
  red:    { badge: 'bg-red-500/20 text-red-300 border-red-500/30',        dot: 'bg-red-500',    header: 'text-red-300'    },
  yellow: { badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', dot: 'bg-yellow-500', header: 'text-yellow-300' },
  pink:   { badge: 'bg-pink-500/20 text-pink-300 border-pink-500/30',     dot: 'bg-pink-500',   header: 'text-pink-300'   },
  orange: { badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30', dot: 'bg-orange-500', header: 'text-orange-300' },
  teal:   { badge: 'bg-teal-500/20 text-teal-300 border-teal-500/30',     dot: 'bg-teal-500',   header: 'text-teal-300'   },
}

export default function LearnView({ setCurrentView, onStartGame }) {
  const [openCategories, setOpenCategories] = useState({ 0: true })
  const [openRules, setOpenRules] = useState({})

  const [selectedRules, setSelectedRules] = useState(() => new Set())

  const toggleCategory = (i) => setOpenCategories(p => ({ ...p, [i]: !p[i] }))
  const toggleRule = (key) => setOpenRules(p => ({ ...p, [key]: !p[key] }))
  const toggleRuleSelection = (key) => setSelectedRules(prev => {
    const next = new Set(prev)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    return next
  })

  // A game category is allowed if at least one of its section's rules is selected
  const allowedGameCategories = new Set(
    grammar
      .filter((section, si) => section.rules.some((_, ri) => selectedRules.has(`${si}-${ri}`)))
      .map(s => s.gameCategory)
  )

  const canPlay = selectedRules.size > 0

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Mobile back */}
      <div className="md:hidden p-4 border-b border-gray-800">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <button
            onClick={() => setCurrentView('practice')}
            className="px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 cursor-pointer"
          >
            ← Back
          </button>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen size={20} className="text-purple-400" />
            Grammar
          </h2>
          <div className="w-20" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-3">

          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-500 text-sm">Tick rules to include in the game.</p>
            <button
              onClick={() => canPlay && onStartGame(allowedGameCategories)}
              disabled={!canPlay}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-opacity flex-shrink-0 shadow-lg ${
                canPlay
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 cursor-pointer'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Zap size={14} />
              Practice Game
            </button>
          </div>

          {grammar.map((section, si) => {
            const c = colorMap[section.color]
            const isOpen = !!openCategories[si]
            return (
              <div key={si} className="bg-gray-800/80 rounded-2xl border border-gray-700/50 overflow-hidden">
                {/* Category header — collapse only */}
                <button
                  onClick={() => toggleCategory(si)}
                  className="w-full flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-700/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${c.dot}`} />
                    <span className={`font-bold text-base ${c.header}`}>{section.category}</span>
                    <span className="text-xs text-gray-600">{section.rules.length} rules</span>
                  </div>
                  {isOpen ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronRight size={16} className="text-gray-500" />}
                </button>

                {/* Rules */}
                {isOpen && (
                  <div className="border-t border-gray-700/50 divide-y divide-gray-700/40">
                    {section.rules.map((rule, ri) => {
                      const key = `${si}-${ri}`
                      const ruleOpen = !!openRules[key]
                      const isSelected = selectedRules.has(key)
                      return (
                        <div key={ri}>
                          {/* Rule header row */}
                          <div
                            onClick={() => toggleRule(key)}
                            className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-gray-700/20 transition-colors"
                          >
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${c.badge}`}>
                              {ri + 1}
                            </span>
                            <span className="text-white text-sm font-semibold flex-1 min-w-0 truncate">{rule.title}</span>

                            {/* Round tick */}
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleRuleSelection(key) }}
                              className="flex-shrink-0 cursor-pointer"
                              title={isSelected ? 'Remove from game' : 'Add to game'}
                            >
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                isSelected ? 'bg-purple-600 border-purple-600' : 'border-gray-600 bg-transparent'
                              }`}>
                                {isSelected && <Check size={10} className="text-white" strokeWidth={3} />}
                              </div>
                            </button>

                            {/* Chevron — rightmost */}
                            {ruleOpen
                              ? <ChevronDown size={14} className="text-gray-500 flex-shrink-0" />
                              : <ChevronRight size={14} className="text-gray-500 flex-shrink-0" />}
                          </div>

                          {ruleOpen && (
                            <div className="px-5 pb-4 space-y-2.5">
                              {/* Pattern */}
                              <div className="bg-gray-900/60 rounded-xl px-4 py-2.5 border border-gray-700/50">
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Pattern</p>
                                <p className="text-sm text-purple-300 font-mono">{rule.pattern}</p>
                              </div>
                              {/* Example */}
                              <div className="bg-gray-900/60 rounded-xl px-4 py-2.5 border border-gray-700/50">
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Example</p>
                                <p className="text-base font-bold text-white">{rule.example}</p>
                                <p className="text-sm text-gray-400 italic mt-0.5">{rule.translation}</p>
                              </div>
                              {/* Note */}
                              <div className="flex gap-2 px-1">
                                <span className="text-yellow-500 text-sm flex-shrink-0">💡</span>
                                <p className="text-xs text-gray-400 leading-relaxed">{rule.note}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
