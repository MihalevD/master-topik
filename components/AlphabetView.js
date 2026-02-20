'use client'

import { useState } from 'react'
import { Volume2, Keyboard } from 'lucide-react'
import TypingGame from './TypingGame'

function speak(text) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'ko-KR'
  u.rate = 0.7
  window.speechSynthesis.speak(u)
}

const consonants = [
  { char: 'ㄱ', rom: 'g/k',  sound: 'like g in "go"',      example: '가' },
  { char: 'ㄴ', rom: 'n',    sound: 'like n in "no"',       example: '나' },
  { char: 'ㄷ', rom: 'd/t',  sound: 'like d in "do"',       example: '다' },
  { char: 'ㄹ', rom: 'r/l',  sound: 'between r and l',      example: '라' },
  { char: 'ㅁ', rom: 'm',    sound: 'like m in "me"',       example: '마' },
  { char: 'ㅂ', rom: 'b/p',  sound: 'like b in "boy"',      example: '바' },
  { char: 'ㅅ', rom: 's',    sound: 'like s in "sea"',      example: '사' },
  { char: 'ㅇ', rom: '-/ng', sound: 'silent at start, ng at end', example: '아' },
  { char: 'ㅈ', rom: 'j',    sound: 'like j in "joy"',      example: '자' },
  { char: 'ㅊ', rom: 'ch',   sound: 'like ch in "chair"',   example: '차' },
  { char: 'ㅋ', rom: 'k',    sound: 'like k in "kite"',     example: '카' },
  { char: 'ㅌ', rom: 't',    sound: 'like t in "top"',      example: '타' },
  { char: 'ㅍ', rom: 'p',    sound: 'like p in "pen"',      example: '파' },
  { char: 'ㅎ', rom: 'h',    sound: 'like h in "hi"',       example: '하' },
]

const tenseConsonants = [
  { char: 'ㄲ', rom: 'kk', sound: 'tense g/k (tighter)',  example: '까' },
  { char: 'ㄸ', rom: 'tt', sound: 'tense d/t (tighter)',  example: '따' },
  { char: 'ㅃ', rom: 'pp', sound: 'tense b/p (tighter)',  example: '빠' },
  { char: 'ㅆ', rom: 'ss', sound: 'tense s (stronger)',   example: '싸' },
  { char: 'ㅉ', rom: 'jj', sound: 'tense j (tighter)',    example: '짜' },
]

const vowels = [
  { char: 'ㅏ', rom: 'a',   sound: 'like a in "father"',  example: '아' },
  { char: 'ㅑ', rom: 'ya',  sound: 'like ya in "yard"',   example: '야' },
  { char: 'ㅓ', rom: 'eo',  sound: 'like eo in "earn"',   example: '어' },
  { char: 'ㅕ', rom: 'yeo', sound: 'like yeo',            example: '여' },
  { char: 'ㅗ', rom: 'o',   sound: 'like o in "go"',      example: '오' },
  { char: 'ㅛ', rom: 'yo',  sound: 'like yo in "yoga"',   example: '요' },
  { char: 'ㅜ', rom: 'u',   sound: 'like oo in "moon"',   example: '우' },
  { char: 'ㅠ', rom: 'yu',  sound: 'like you',            example: '유' },
  { char: 'ㅡ', rom: 'eu',  sound: 'like eu (no English equivalent)', example: '으' },
  { char: 'ㅣ', rom: 'i',   sound: 'like ee in "see"',    example: '이' },
]

const compoundVowels = [
  { char: 'ㅐ', rom: 'ae',  sound: 'like e in "bed"',     example: '애' },
  { char: 'ㅒ', rom: 'yae', sound: 'like ye',             example: '얘' },
  { char: 'ㅔ', rom: 'e',   sound: 'like e in "bed"',     example: '에' },
  { char: 'ㅖ', rom: 'ye',  sound: 'like ye in "yes"',    example: '예' },
  { char: 'ㅘ', rom: 'wa',  sound: 'like wa in "water"',  example: '와' },
  { char: 'ㅙ', rom: 'wae', sound: 'like we',             example: '왜' },
  { char: 'ㅚ', rom: 'oe',  sound: 'like we',             example: '외' },
  { char: 'ㅝ', rom: 'wo',  sound: 'like wo in "won\'t"', example: '워' },
  { char: 'ㅞ', rom: 'we',  sound: 'like we',             example: '웨' },
  { char: 'ㅟ', rom: 'wi',  sound: 'like wi in "week"',   example: '위' },
  { char: 'ㅢ', rom: 'ui',  sound: 'like ee said quickly',example: '의' },
]

const syllableExamples = [
  { syllable: '한', breakdown: 'ㅎ + ㅏ + ㄴ', meaning: 'Korean (한국)' },
  { syllable: '글', breakdown: 'ㄱ + ㅡ + ㄹ', meaning: 'writing (한글)' },
  { syllable: '사', breakdown: 'ㅅ + ㅏ',      meaning: 'four / company' },
  { syllable: '랑', breakdown: 'ㄹ + ㅏ + ㅇ', meaning: 'love (사랑)' },
]

function CharCard({ item, onPlay }) {
  return (
    <button
      onClick={() => onPlay(item.example || item.char)}
      className="group bg-gray-800/70 border border-gray-700/50 rounded-xl p-3 text-center hover:border-purple-500/50 hover:bg-gray-800 transition-all cursor-pointer w-full"
    >
      <div className="text-2xl font-bold text-white mb-0.5 group-hover:text-purple-300 transition-colors">{item.char}</div>
      <div className="text-purple-400 text-xs font-semibold">{item.rom}</div>
      <div className="text-gray-600 text-xs mt-0.5 leading-tight hidden sm:block">{item.sound}</div>
    </button>
  )
}

export default function AlphabetView({ setCurrentView }) {
  const [activeTab, setActiveTab] = useState('consonants')

  // Render TypingGame as a full subtab — back button resets to consonants
  if (activeTab === 'typing') {
    return (
      <TypingGame
        setCurrentView={(view) => {
          if (view === 'practice') setActiveTab('consonants')
          else setCurrentView?.(view)
        }}
      />
    )
  }

  const tab = (id, label, icon) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
        activeTab === id ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'
      }`}
    >
      {icon}
      {label}
    </button>
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Tab bar */}
      <div className="px-4 py-3 border-b border-gray-800">
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {tab('consonants', 'Consonants')}
            {tab('vowels', 'Vowels')}
            {tab('syllables', 'How it Works')}
            {tab('typing', 'Typing Practice', <Keyboard size={14} />)}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-4 space-y-6">

          {activeTab === 'consonants' && (
            <>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-bold text-sm">Basic Consonants</h3>
                  <div className="flex items-center gap-1 text-gray-600 text-xs">
                    <Volume2 size={12} />
                    tap to hear
                  </div>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {consonants.map(c => <CharCard key={c.char} item={c} onPlay={speak} />)}
                </div>
              </div>

              <div>
                <h3 className="text-white font-bold text-sm mb-1">Tense Consonants</h3>
                <p className="text-gray-500 text-xs mb-3">Pronounced with more tension — like holding your breath slightly.</p>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {tenseConsonants.map(c => <CharCard key={c.char} item={c} onPlay={speak} />)}
                </div>
              </div>

              <div className="bg-gray-800/40 border border-gray-700/30 rounded-xl p-4">
                <p className="text-gray-300 text-sm font-semibold mb-1">💡 Key tips</p>
                <ul className="text-gray-400 text-xs space-y-1">
                  <li>• <span className="text-white">ㄱ ㄷ ㅂ ㅈ</span> sound softer at the start of a word, harder at the end</li>
                  <li>• <span className="text-white">ㄹ</span> sounds like a flicked R — similar to the D in "ladder"</li>
                  <li>• <span className="text-white">ㅇ</span> is completely silent when it starts a syllable</li>
                </ul>
              </div>
            </>
          )}

          {activeTab === 'vowels' && (
            <>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-bold text-sm">Basic Vowels</h3>
                  <div className="flex items-center gap-1 text-gray-600 text-xs">
                    <Volume2 size={12} />
                    tap to hear
                  </div>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {vowels.map(v => <CharCard key={v.char} item={v} onPlay={speak} />)}
                </div>
              </div>

              <div>
                <h3 className="text-white font-bold text-sm mb-1">Compound Vowels</h3>
                <p className="text-gray-500 text-xs mb-3">Formed by combining two basic vowels.</p>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {compoundVowels.map(v => <CharCard key={v.char} item={v} onPlay={speak} />)}
                </div>
              </div>

              <div className="bg-gray-800/40 border border-gray-700/30 rounded-xl p-4">
                <p className="text-gray-300 text-sm font-semibold mb-1">💡 Vowel shape rule</p>
                <ul className="text-gray-400 text-xs space-y-1">
                  <li>• Vertical vowels (ㅏ ㅓ ㅣ…) go to the <span className="text-white">right</span> of the consonant: 가 나 다</li>
                  <li>• Horizontal vowels (ㅗ ㅜ ㅡ…) go <span className="text-white">below</span> the consonant: 고 구 그</li>
                </ul>
              </div>
            </>
          )}

          {activeTab === 'syllables' && (
            <div className="space-y-5">
              <div className="bg-gray-800/60 border border-gray-700/40 rounded-xl p-5">
                <h3 className="text-white font-bold mb-3">How Korean syllables work</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">
                  Every Korean syllable is written in a <span className="text-white font-semibold">block</span>. Each block has a consonant + vowel, and optionally a final consonant (받침).
                </p>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-700/40">
                    <p className="text-gray-500 text-xs mb-2">Simple: C + V</p>
                    <p className="text-4xl font-bold text-white mb-1">가</p>
                    <p className="text-purple-400 text-sm">ㄱ + ㅏ = ga</p>
                  </div>
                  <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-700/40">
                    <p className="text-gray-500 text-xs mb-2">Full: C + V + C</p>
                    <p className="text-4xl font-bold text-white mb-1">한</p>
                    <p className="text-purple-400 text-sm">ㅎ + ㅏ + ㄴ = han</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-white font-bold text-sm mb-3">Example syllables — tap to hear</h3>
                <div className="grid grid-cols-2 gap-3">
                  {syllableExamples.map(s => (
                    <button
                      key={s.syllable}
                      onClick={() => speak(s.syllable)}
                      className="bg-gray-800/70 border border-gray-700/50 rounded-xl p-4 text-left hover:border-purple-500/50 hover:bg-gray-800 transition-all cursor-pointer"
                    >
                      <div className="text-3xl font-bold text-white mb-1">{s.syllable}</div>
                      <div className="text-purple-400 text-xs font-mono">{s.breakdown}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{s.meaning}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-purple-500/10 border border-purple-500/25 rounded-xl p-4">
                <p className="text-purple-300 text-sm font-semibold mb-1">✨ You're ready to practice!</p>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Korean has only 24 letters — far fewer than many alphabets. With a bit of practice, most learners can read Hangul within a day.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
