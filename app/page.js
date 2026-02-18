'use client'

import React, { useState, useEffect } from 'react'
import { supabase, saveWordProgress, getWordProgress, saveUserStats, getUserStats } from '@/lib/supabase'
import { topikIWords, allWords, ranks } from '@/lib/words'
import AuthComponent from '@/components/AuthComponent'
import NavBar from '@/components/NavBar'
import StatsView from '@/components/StatsView'
import AchievementsView from '@/components/AchievementsView'
import SettingsView from '@/components/SettingsView'
import CorrectModal from '@/components/CorrectModal'
import PracticeCard from '@/components/PracticeCard'
import Sidebar from '@/components/Sidebar'
import ChallengeComplete from '@/components/ChallengeComplete'
import TypingGame from '@/components/TypingGame'

export default function Home() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dailyWords, setDailyWords] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [input, setInput] = useState('')
  const [showHint, setShowHint] = useState(false)
  const [showExample, setShowExample] = useState(false)
  const [score, setScore] = useState(0)
  const [totalCompleted, setTotalCompleted] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [dailyChallenge, setDailyChallengeState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dailyChallenge')
      return saved ? Number(saved) : 25
    }
    return 25
  })
  const setDailyChallenge = (val) => {
    localStorage.setItem('dailyChallenge', val)
    setDailyChallengeState(val)
  }
  const [streak, setStreak] = useState(0)
  const [wordStats, setWordStats] = useState({})
  const [currentView, setCurrentView] = useState('practice')
  const [reviewMode, setReviewMode] = useState(false)
  const [reverseMode, setReverseMode] = useState(false)
  const [dailyCorrect, setDailyCorrect] = useState(0)
  const [dailySkipped, setDailySkipped] = useState(0) // #15
  const [isReviewing, setIsReviewing] = useState(false)
  const [error, setError] = useState(null)            // #10
  const wordsGeneratedRef = React.useRef(false)        // #4 — single source of truth (removed state)

  // --- #8: SM-2 inspired spaced repetition priority ---
  const calculateWordPriority = (word, freshWordStats) => {
    const ws = freshWordStats ?? wordStats
    const stats = ws[word.korean] || {
      attempts: 0, correct: 0, hintsUsed: 0, examplesUsed: 0, lastSeen: 0
    }

    // New words: elevated but not max priority
    if (stats.attempts === 0) return 60

    const accuracy = stats.correct / stats.attempts
    const daysSinceLastSeen = (Date.now() - (stats.lastSeen || 0)) / (1000 * 60 * 60 * 24)

    // Rate-based penalties (not total count) — a 10% hint rate matters more than 5 total hints on a word seen 200 times
    const hintRate = stats.hintsUsed / stats.attempts
    const exampleRate = stats.examplesUsed / stats.attempts
    const adjustedAccuracy = Math.max(0, accuracy - hintRate * 0.25 - exampleRate * 0.1)

    // SM-2 ease factor: maps adjusted accuracy to 1.3–2.5 scale
    const easeFactor = Math.max(1.3, 2.5 + (adjustedAccuracy - 0.6) * 3)

    // Exponential interval growth: 1 → 6 → 6·EF → 6·EF² → … capped at 30 days
    let interval
    if (stats.correct <= 1) interval = 1
    else if (stats.correct === 2) interval = 6
    else interval = Math.min(30, Math.round(6 * Math.pow(easeFactor, stats.correct - 2)))

    // Poor accuracy resets to daily review
    if (adjustedAccuracy < 0.6) interval = 1

    // Not yet due → low priority
    if (daysSinceLastSeen < interval) {
      return (1 - adjustedAccuracy) * 10
    }

    // Due or overdue → ratio-based scaling, capped at 3× to avoid drowning new words
    const overdueRatio = Math.min(daysSinceLastSeen / Math.max(interval, 1), 3)
    return (1 - adjustedAccuracy) * 100 + overdueRatio * 25
  }

  // --- #11: generateDailyWords accepts freshWordStats to avoid stale closure ---
  const generateDailyWords = (freshWordStats) => {
    if (wordsGeneratedRef.current && dailyWords.length > 0) return

    const topikIIUnlocked = totalCompleted >= 500
    let availableWords = topikIIUnlocked ? allWords : topikIWords

    if (reviewMode) {
      const ws = freshWordStats ?? wordStats
      availableWords = availableWords.filter(word => {
        const stats = ws[word.korean]
        if (!stats || stats.attempts === 0) return false
        return stats.correct / stats.attempts < 0.8
      })

      if (availableWords.length === 0) {
        alert('No difficult words to review! You\'re doing great! 🎉')
        setReviewMode(false)
        availableWords = topikIIUnlocked ? allWords : topikIWords
      }
    }

    const sortedByPriority = [...availableWords].sort((a, b) =>
      calculateWordPriority(b, freshWordStats) - calculateWordPriority(a, freshWordStats)
    )

    const bufferSize = dailyChallenge * 3
    const difficultCount = Math.floor(bufferSize * 0.7)
    const randomCount = bufferSize - difficultCount

    const difficultWords = sortedByPriority.slice(0, difficultCount)
    const remainingWords = sortedByPriority.slice(difficultCount)
    const randomWords = remainingWords.sort(() => Math.random() - 0.5).slice(0, randomCount)

    const selected = [...difficultWords, ...randomWords].sort(() => Math.random() - 0.5)

    setDailyWords(selected)
    setCurrentIndex(0)
    setInput('')
    setShowHint(false)
    setShowExample(false)
    setFeedback('')
    wordsGeneratedRef.current = true
  }

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setUser(session?.user || null)
    if (session?.user && !wordsGeneratedRef.current) { // #4 — use ref only
      await loadUserData()
    }
    setLoading(false)
  }

  // --- #10: error handling around Supabase calls ---
  const loadUserData = async () => {
    try {
      const { data: stats, error: statsError } = await getUserStats()
      if (statsError) throw statsError

      if (stats) {
        setTotalCompleted(stats.total_completed || 0)
        setScore(stats.current_score || 0)
        setStreak(stats.streak || 0)

        const today = new Date().toISOString().split('T')[0]
        const lastLogin = stats.last_login

        if (lastLogin !== today) {
          const yesterday = new Date()
          yesterday.setDate(yesterday.getDate() - 1)
          const yesterdayStr = yesterday.toISOString().split('T')[0]

          const newStreak = lastLogin === yesterdayStr ? stats.streak + 1 : 0
          setStreak(newStreak)
          setDailyCorrect(0)
          setScore(0)
          await saveUserStats(stats.total_completed, 0, newStreak, today, 0)
        } else {
          setDailyCorrect(stats.daily_correct || 0) // #13 — console.log removed
        }
      }

      const { data: progress, error: progressError } = await getWordProgress()
      if (progressError) throw progressError

      let freshWordStats = {}
      if (progress) {
        progress.forEach(p => {
          freshWordStats[p.word_korean] = {
            attempts: p.attempts,
            correct: p.correct,
            hintsUsed: p.hints_used,
            examplesUsed: p.examples_used,
            lastSeen: new Date(p.last_seen).getTime()
          }
        })
        setWordStats(freshWordStats)
      }

      if (!wordsGeneratedRef.current) {
        generateDailyWords(freshWordStats) // #11 — pass fresh stats to avoid stale closure
      }
    } catch (err) {
      if (err?.status === 406 || err?.code === 'PGRST116') {
        await supabase.auth.signOut()
        setUser(null)
      } else {
        setError('Failed to load data. Please check your connection.')
      }
    }
  }

  useEffect(() => {
    let mounted = true

    checkUser()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      const wasLoggedOut = !user && session?.user
      setUser(session?.user || null)
      if (wasLoggedOut && session?.user) {
        loadUserData()
      }
    })

    return () => {
      mounted = false
      authListener?.subscription?.unsubscribe()
    }
  }, [])

  const updateWordStats = async (word, isCorrect, usedHint, usedExample) => {
    const stats = wordStats[word.korean] || {
      attempts: 0, correct: 0, hintsUsed: 0, examplesUsed: 0, lastSeen: 0
    }

    const newStats = {
      attempts: stats.attempts + 1,
      correct: stats.correct + (isCorrect ? 1 : 0),
      hintsUsed: stats.hintsUsed + (usedHint ? 1 : 0),
      examplesUsed: stats.examplesUsed + (usedExample ? 1 : 0),
      lastSeen: Date.now()
    }

    setWordStats({ ...wordStats, [word.korean]: newStats })

    try {
      await saveWordProgress(word.korean, newStats.attempts, newStats.correct, newStats.hintsUsed, newStats.examplesUsed)
    } catch {
      setError('Failed to save progress. Your streak may not be recorded.')
    }
  }

  // --- #15: isSkip param to track skipped words ---
  const handleNextWord = (isSkip = false) => {
    if (isSkip && !isReviewing) setDailySkipped(prev => prev + 1)

    if (!isReviewing && dailyCorrect >= dailyChallenge) {
      setFeedback('complete')
    } else if (currentIndex < dailyWords.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setInput('')
      setShowHint(false)
      setShowExample(false)
      setFeedback('')
    } else if (isReviewing) {
      // loop back to start during review
      setCurrentIndex(0)
      setInput('')
      setShowHint(false)
      setShowExample(false)
      setFeedback('')
    } else {
      setFeedback('complete')
    }
  }

  const speakKorean = (text) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'ko-KR'
    utterance.rate = 0.85
    window.speechSynthesis.speak(utterance)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

    const currentWord = dailyWords[currentIndex]
    const normalizedInput = input.trim().toLowerCase().replace(/\s+/g, '')

    let isCorrect
    if (reverseMode) {
      // Reverse: user types English — accept any comma-separated alternative
      const alternatives = currentWord.english.split(',').map(a => a.trim().toLowerCase().replace(/\s+/g, ''))
      isCorrect = alternatives.some(alt => alt === normalizedInput)
    } else {
      const normalizedAnswer = currentWord.korean.toLowerCase().replace(/\s+/g, '')
      isCorrect = normalizedInput === normalizedAnswer
    }
    await updateWordStats(currentWord, isCorrect, showHint, showExample)

    if (isCorrect) {
      setFeedback('correct')
      if (!isReviewing) {
        const points = showHint ? 5 : (showExample ? 7 : 10)
        const newScore = score + points
        const newTotal = totalCompleted + 1
        const newDailyCorrect = dailyCorrect + 1

        setScore(newScore)
        setTotalCompleted(newTotal)
        setDailyCorrect(newDailyCorrect)

        try {
          const today = new Date().toISOString().split('T')[0]
          await saveUserStats(newTotal, newScore, streak, today, newDailyCorrect)
        } catch {
          setError('Failed to save stats. Please check your connection.')
        }
      }
    } else {
      setFeedback('wrong')
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const handleReviewDifficult = () => {
    const difficultWords = Object.entries(wordStats)
      .filter(([_, stats]) => stats.attempts > 0 && stats.correct / stats.attempts < 0.8)
      .map(([korean]) => allWords.find(w => w.korean === korean))
      .filter(Boolean)
      .sort(() => Math.random() - 0.5)
      .slice(0, 10)

    if (difficultWords.length === 0) {
      alert('No difficult words to review! Keep practicing! 🎉')
    } else {
      setDailyWords(difficultWords)
      setCurrentIndex(0)
      setInput('')
      setFeedback('')
      setShowHint(false)
      setShowExample(false)
      wordsGeneratedRef.current = true
    }
  }

  const getWordDifficulty = (word) => {
    const stats = wordStats[word.korean]
    if (!stats || stats.attempts === 0) return 'New'
    const accuracy = stats.correct / stats.attempts
    if (accuracy >= 0.8) return 'Easy'
    if (accuracy >= 0.5) return 'Medium'
    return 'Hard'
  }

  const getCurrentRank = () => ranks.find(r => totalCompleted >= r.min && totalCompleted <= r.max)

  const getHardWords = () =>
    Object.entries(wordStats)
      .filter(([_, s]) => s.attempts > 0)
      .map(([korean, s]) => ({ korean, accuracy: s.correct / s.attempts, attempts: s.attempts }))
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 10)

  const getAccuracyData = () => {
    const totalAttempts = Object.values(wordStats).reduce((sum, s) => sum + s.attempts, 0)
    const totalCorrect = Object.values(wordStats).reduce((sum, s) => sum + s.correct, 0)
    return totalAttempts > 0 ? ((totalCorrect / totalAttempts) * 100).toFixed(1) : 0
  }

  // --- Early returns ---

  if (loading) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-2xl text-purple-400">Loading...</div>
      </div>
    )
  }

  if (!user) return <AuthComponent />

  const currentRank = getCurrentRank()
  const topikIIUnlocked = totalCompleted >= 500

  if (currentView === 'typing') {
    return <TypingGame setCurrentView={setCurrentView} />
  }

  if (currentView === 'stats') {
    return <StatsView totalCompleted={totalCompleted} streak={streak} hardWords={getHardWords()} accuracy={getAccuracyData()} setCurrentView={setCurrentView} />
  }

  if (currentView === 'achievements') {
    return <AchievementsView totalCompleted={totalCompleted} streak={streak} setCurrentView={setCurrentView} />
  }

  if (currentView === 'settings') {
    return (
      <SettingsView
        dailyChallenge={dailyChallenge} setDailyChallenge={setDailyChallenge}
        reviewMode={reviewMode} setReviewMode={setReviewMode}
        reverseMode={reverseMode} setReverseMode={setReverseMode}
        setCurrentView={setCurrentView}
        wordsGeneratedRef={wordsGeneratedRef} generateDailyWords={generateDailyWords}
      />
    )
  }

  if (dailyWords.length === 0) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-2xl text-purple-400">Loading words...</div>
      </div>
    )
  }

  if (feedback === 'complete') {
    return (
      <ChallengeComplete
        score={score}
        streak={streak}
        totalCompleted={totalCompleted}
        dailyCorrect={dailyCorrect}   // #15
        dailySkipped={dailySkipped}   // #15
        onReview={() => {
          setIsReviewing(true)
          setCurrentIndex(0)
          setInput('')
          setFeedback('')
          setShowHint(false)
          setShowExample(false)
        }}
        onNewChallenge={() => {
          setIsReviewing(false)
          wordsGeneratedRef.current = false
          generateDailyWords()
          setScore(0)
          setDailyCorrect(0)
          setDailySkipped(0)
          setFeedback('')
          const today = new Date().toISOString().split('T')[0]
          saveUserStats(totalCompleted, 0, streak, today, 0)
        }}
      />
    )
  }

  // --- Main Practice View ---

  const currentWord = dailyWords[currentIndex]
  const progress = (dailyCorrect / dailyChallenge) * 100
  const currentWordDifficulty = getWordDifficulty(currentWord)
  const points = showHint ? 5 : (showExample ? 7 : 10)

  return (
    <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">
      {feedback === 'correct' && (
        <CorrectModal word={currentWord} points={points} onNext={handleNextWord} onSpeak={speakKorean} />
      )}

      {/* #10 — error toast */}
      {error && (
        <div className="bg-red-900 border-b border-red-700 text-red-200 px-4 py-2 text-sm flex justify-between items-center z-50">
          <span>⚠ {error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-100 ml-4 font-bold">✕</button>
        </div>
      )}

      <NavBar
        currentView={currentView}
        setCurrentView={setCurrentView}
        currentRank={currentRank}
        streak={streak}
        handleSignOut={handleSignOut}
      />

      <div className="flex-1 p-3 overflow-y-auto md:overflow-hidden pb-[5.5rem] md:pb-4">
        <div className="max-w-7xl mx-auto md:h-full grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 flex flex-col justify-center">
            <PracticeCard
              word={currentWord}
              input={input}
              setInput={setInput}
              feedback={feedback}
              setFeedback={setFeedback}
              showHint={showHint}
              setShowHint={setShowHint}
              showExample={showExample}
              setShowExample={setShowExample}
              handleSubmit={handleSubmit}
              handleNextWord={handleNextWord}
              currentWordDifficulty={currentWordDifficulty}
              reverseMode={reverseMode}
              onSpeak={speakKorean}
            />
          </div>

          <div className="hidden md:flex md:col-span-1 flex-col justify-center">
            <Sidebar
              dailyCorrect={dailyCorrect}
              dailyChallenge={dailyChallenge}
              score={score}
              progress={progress}
              totalCompleted={totalCompleted}
              topikIIUnlocked={topikIIUnlocked}
              currentRank={currentRank}
              streak={streak}
              currentWord={currentWord}
              onReviewDifficult={handleReviewDifficult}
            />
          </div>
        </div>
      </div>

      {/* Mobile bottom bar — improved */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-40">
        {/* Stats row */}
        <div className="flex items-center justify-between px-4 pt-2.5 pb-1">
          <div className="flex items-center gap-4">
            {/* Today progress */}
            <div className="flex items-baseline gap-0.5">
              <span className="text-base font-bold text-purple-400">{dailyCorrect}</span>
              <span className="text-xs text-gray-500">/{dailyChallenge}</span>
              <span className="text-xs text-gray-500 ml-1">words</span>
            </div>
            {/* Score */}
            <div className="flex items-baseline gap-1">
              <span className="text-xs text-gray-500">⚡</span>
              <span className="text-sm font-bold text-pink-400">{score}</span>
            </div>
            {/* Streak */}
            <div className="flex items-baseline gap-1">
              <span className="text-xs">🔥</span>
              <span className="text-sm font-bold text-orange-400">{streak}</span>
            </div>
          </div>
          <button
            onClick={handleReviewDifficult}
            className="bg-red-900 hover:bg-red-800 border border-red-700 text-red-300 text-xs px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition-colors"
          >
            Review ↻
          </button>
        </div>
        {/* Progress bar row */}
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

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake { animation: shake 0.3s; }
      `}</style>
    </div>
  )
}
