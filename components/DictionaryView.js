'use client'

import { useState, useMemo } from 'react'
import { Search, BookMarked, Volume2 } from 'lucide-react'

function speakKorean(text) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'ko-KR'
  u.rate = 0.85
  window.speechSynthesis.speak(u)
}

export default function DictionaryView({ wordStats, allWords }) {
  const [query, setQuery] = useState('')

  const masteredWords = useMemo(() => {
    return allWords
      .filter(w => {
        const s = wordStats[w.korean]
        return s && s.attempts >= 3 && s.correct === s.attempts
      })
      .sort((a, b) => {
        // Sort by last seen descending (most recently mastered first)
        const sa = wordStats[a.korean]
        const sb = wordStats[b.korean]
        return (sb.lastSeen || 0) - (sa.lastSeen || 0)
      })
  }, [wordStats, allWords])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return masteredWords
    return masteredWords.filter(w =>
      w.korean.includes(q) ||
      w.english.toLowerCase().includes(q) ||
      w.romanization?.toLowerCase().includes(q)
    )
  }, [masteredWords, query])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Search bar */}
      <div className="px-4 py-3 border-b border-gray-800">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search your words…"
              className="w-full bg-gray-800/80 border border-gray-700/50 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/60"
            />
          </div>
          <div className="flex items-center gap-1.5 text-gray-500 text-xs whitespace-nowrap">
            <BookMarked size={13} className="text-purple-400" />
            <span className="text-purple-400 font-semibold">{masteredWords.length}</span>
            <span>mastered</span>
          </div>
        </div>
      </div>

      {/* Word list */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-4">
          {masteredWords.length === 0 ? (
            <div className="text-center py-16">
              <BookMarked className="mx-auto mb-4 text-gray-700" size={48} />
              <p className="text-gray-400 font-semibold mb-1">No mastered words yet</p>
              <p className="text-gray-600 text-sm">Words appear here once you answer them correctly 3 times in a row.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-sm">No words match "{query}"</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(word => {
                const s = wordStats[word.korean]
                return (
                  <div key={word.korean} className="bg-gray-800/60 border border-gray-700/40 rounded-xl p-4 flex gap-4 items-start">
                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white text-lg font-bold">{word.korean}</span>
                        <span className="text-gray-500 text-xs">{word.romanization}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/25 font-semibold">
                          {s.attempts}× ✓
                        </span>
                      </div>
                      <p className="text-purple-300 text-sm font-medium mt-0.5">{word.english}</p>
                      {word.sentences?.[0] && (
                        <p className="text-gray-500 text-xs mt-1.5 italic leading-relaxed">
                          {word.sentences[0]}
                          <span className="not-italic text-gray-600"> · {word.sentences[1]}</span>
                        </p>
                      )}
                    </div>
                    {/* Speak button */}
                    <button
                      onClick={() => speakKorean(word.korean)}
                      className="flex-shrink-0 p-2 rounded-lg bg-gray-700/50 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors cursor-pointer"
                    >
                      <Volume2 size={15} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
