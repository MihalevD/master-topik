'use client'

import { useState } from 'react'
import { useApp } from '@/app/providers'
import dynamic from 'next/dynamic'
import { TOPIKII_UNLOCK_THRESHOLD } from '@/lib/constants'

const PracticeCard     = dynamic(() => import('@/components/PracticeCard'))
const Sidebar          = dynamic(() => import('@/components/Sidebar'))
const CorrectModal     = dynamic(() => import('@/components/CorrectModal'))
const ChallengeComplete = dynamic(() => import('@/components/ChallengeComplete'))

export default function PracticePage() {
  const {
    dailyWords, setDailyWords, currentIndex, setCurrentIndex,
    totalCompleted, setTotalCompleted,
    dailyChallenge, wordStats, updateWordStats,
    reviewMode, reverseMode, dailyCorrect, setDailyCorrect,
    isReviewing,
    isEndlessMode,
    streak, speakKorean, handleReviewDifficult, handleReturnToChallenge,
    handleContinueEndless, handleReviewLearned,
    savedChallenge, completeChallengeScore,
    getWordDifficulty,
  } = useApp()

  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState('')
  const [showHint, setShowHint] = useState(false)
  const [showExample, setShowExample] = useState(false)

  const currentWord = dailyWords.length > 0 ? dailyWords[currentIndex] : null
  const progress = (dailyCorrect / dailyChallenge) * 100
  const currentWordDifficulty = currentWord ? getWordDifficulty(currentWord) : 'New'
  const topikIIUnlocked = totalCompleted >= TOPIKII_UNLOCK_THRESHOLD
  const handleNextWord = () => {
    const looping = isReviewing || reviewMode || isEndlessMode
    if (!looping && dailyCorrect >= dailyChallenge) {
      completeChallengeScore()
      setFeedback('complete')
    } else if (currentIndex < dailyWords.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setInput(''); setShowHint(false); setShowExample(false); setFeedback('')
    } else {
      // Ran out of words in the buffer — reshuffle and keep going until the goal is met
      setDailyWords(prev => [...prev].sort(() => Math.random() - 0.5))
      setCurrentIndex(0)
      setInput(''); setShowHint(false); setShowExample(false); setFeedback('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim()) return
    const currentWord = dailyWords[currentIndex]
    const normalized = input.trim().toLowerCase().replace(/\s+/g, '')
    let isCorrect
    if (reverseMode) {
      const alts = currentWord.english.split(',').map(a => a.trim().toLowerCase().replace(/\s+/g, ''))
      isCorrect = alts.some(a => a === normalized)
    } else {
      isCorrect = normalized === currentWord.korean.toLowerCase().replace(/\s+/g, '')
    }
    const isNewWord = !wordStats[currentWord.korean] || wordStats[currentWord.korean].attempts === 0
    if (isCorrect) {
      await updateWordStats(currentWord, true, showHint, showExample)
      setFeedback('correct')
      if (!isReviewing && !reviewMode) {
        const newTotal = isNewWord ? totalCompleted + 1 : totalCompleted
        const newDailyCorrect = isEndlessMode ? dailyCorrect : dailyCorrect + 1
        setTotalCompleted(newTotal)
        setDailyCorrect(newDailyCorrect)
      }
    } else {
      setFeedback('wrong')
    }
  }

  return (
    <>
      {currentWord && feedback === 'correct' && (
        <CorrectModal word={currentWord} onNext={handleNextWord} onSpeak={speakKorean} />
      )}

      {isReviewing && (
        <div className="fixed top-16 md:top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border border-purple-500/50 bg-gray-900/95 backdrop-blur-md whitespace-nowrap">
          <span className="text-purple-300 text-sm font-semibold">📖 Review · no points</span>
          <div className="w-px h-4 bg-purple-700" />
          {savedChallenge ? (
            <button
              onClick={() => { handleReturnToChallenge(); setFeedback('') }}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-1.5 rounded-xl text-sm font-bold transition-all cursor-pointer shadow-md"
            >
              {savedChallenge.fromReview ? '← Back to Review' : '← Back to Challenge'}
            </button>
          ) : (
            <button
              onClick={() => { handleContinueEndless(); setFeedback(''); setInput(''); setShowHint(false); setShowExample(false) }}
              className="bg-gradient-to-r from-green-600 to-emerald-500 hover:opacity-90 text-white px-4 py-1.5 rounded-xl text-sm font-bold transition-all cursor-pointer shadow-md"
            >
              Go Endless ∞
            </button>
          )}
        </div>
      )}

      {isEndlessMode && (
        <div className="fixed top-16 md:top-20 left-1/2 -translate-x-1/2 z-50 flex items-center px-5 py-3 rounded-2xl shadow-2xl border border-green-500/50 bg-gray-900/95 backdrop-blur-md whitespace-nowrap">
          <span className="text-green-300 text-sm font-semibold">∞ Endless</span>
        </div>
      )}

      {feedback === 'complete' ? (
        <ChallengeComplete
          streak={streak} totalCompleted={totalCompleted}
          onReview={() => {
            handleReviewLearned()
            setFeedback(''); setInput(''); setShowHint(false); setShowExample(false)
          }}
          onNewChallenge={() => {
            handleContinueEndless()
            setFeedback(''); setInput(''); setShowHint(false); setShowExample(false)
          }}
        />
      ) : dailyWords.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-2xl text-purple-400">Loading words...</div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto md:overflow-hidden md:flex md:flex-col">

            <div className="p-4 md:p-6 pb-[5.5rem] md:pb-6 md:flex-1 md:min-h-0 md:flex md:flex-col md:justify-center">
              <div className="max-w-[1100px] w-full mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-4 md:gap-5 md:items-start">
                  <div className="md:overflow-y-auto">
                    <PracticeCard
                      word={currentWord} input={input} setInput={setInput}
                      feedback={feedback} setFeedback={setFeedback}
                      showHint={showHint} setShowHint={setShowHint}
                      showExample={showExample} setShowExample={setShowExample}
                      handleSubmit={handleSubmit} handleNextWord={handleNextWord}
                      currentWordDifficulty={currentWordDifficulty}
                      reverseMode={reverseMode} onSpeak={speakKorean}
                    />
                  </div>
                  <div className="hidden md:block md:overflow-y-auto">
                    <Sidebar
                      dailyCorrect={dailyCorrect} dailyChallenge={dailyChallenge}
                      progress={progress} totalCompleted={totalCompleted}
                      wordProgressCount={Object.keys(wordStats).length}
                      topikIIUnlocked={topikIIUnlocked}
                      streak={streak} currentWord={currentWord}
                      onReviewDifficult={() => handleReviewDifficult(dailyWords, currentIndex, dailyCorrect)} isReviewing={isReviewing}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile bottom bar */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-40">
            <div className="flex items-center justify-between px-4 pt-2.5 pb-1">
              <div className="flex items-center gap-4">
                <div className="flex items-baseline gap-0.5">
                  <span className="text-base font-bold text-purple-400">{dailyCorrect}</span>
                  <span className="text-xs text-gray-500">/{dailyChallenge}</span>
                  <span className="text-xs text-gray-500 ml-1">words</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs">🔥</span>
                  <span className="text-sm font-bold text-orange-400">{streak}</span>
                </div>
              </div>
              <button
                onClick={() => handleReviewDifficult(dailyWords, currentIndex, dailyCorrect)}
                className="bg-red-900 hover:bg-red-800 border border-red-700 text-red-300 text-xs px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition-colors"
              >
                Review ↻
              </button>
            </div>
            <div className="flex items-center gap-2 px-4 pb-3">
              <div className="flex-1 bg-gray-800 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <span className="text-xs font-bold text-gray-400 tabular-nums w-9 text-right">
                {Math.round(progress)}%
              </span>
            </div>
          </div>

          <style>{`
            @keyframes shake {
              0%, 100% { transform: translateX(0); }
              25% { transform: translateX(-10px); }
              75% { transform: translateX(10px); }
            }
            .animate-shake { animation: shake 0.3s; }
          `}</style>
        </>
      )}
    </>
  )
}
