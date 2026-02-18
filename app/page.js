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
  const [dailyChallenge, setDailyChallenge] = useState(25)
  const [streak, setStreak] = useState(0)
  const [wordStats, setWordStats] = useState({})
  const [currentView, setCurrentView] = useState('practice')
  const [reviewMode, setReviewMode] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [wordsGenerated, setWordsGenerated] = useState(false)
  const [dailyCorrect, setDailyCorrect] = useState(0)
  const wordsGeneratedRef = React.useRef(false)

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setUser(session?.user || null)
    if (session?.user && !wordsGenerated) {
      await loadUserData()
    }
    setLoading(false)
  }

  const loadUserData = async () => {
    const { data: stats } = await getUserStats()
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
        const dailyCorrectFromDB = stats.daily_correct || 0
        setDailyCorrect(dailyCorrectFromDB)
      }
    }

    const { data: progress } = await getWordProgress()
    if (progress) {
      const statsObj = {}
      progress.forEach(p => {
        statsObj[p.word_korean] = {
          attempts: p.attempts,
          correct: p.correct,
          hintsUsed: p.hints_used,
          examplesUsed: p.examples_used,
          lastSeen: new Date(p.last_seen).getTime()
        }
      })
      setWordStats(statsObj)
    }

    if (!wordsGenerated && !wordsGeneratedRef.current) {
      generateDailyWords()
      setWordsGenerated(true)
      wordsGeneratedRef.current = true
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

  const calculateWordPriority = (word) => {
    const stats = wordStats[word.korean] || {
      attempts: 0,
      correct: 0,
      hintsUsed: 0,
      examplesUsed: 0,
      lastSeen: 0
    }

    const accuracy = stats.attempts > 0 ? stats.correct / stats.attempts : 0.5
    const hintPenalty = stats.hintsUsed * 2
    const examplePenalty = stats.examplesUsed
    const daysSinceLastSeen = (Date.now() - (stats.lastSeen || 0)) / (1000 * 60 * 60 * 24)

    return (1 - accuracy) * 100 + hintPenalty + examplePenalty + (daysSinceLastSeen * 5)
  }

  const generateDailyWords = () => {
    if (wordsGeneratedRef.current && dailyWords.length > 0) {
      return
    }

    const topikIIUnlocked = totalCompleted >= 500
    let availableWords = topikIIUnlocked ? allWords : topikIWords

    if (reviewMode) {
      availableWords = availableWords.filter(word => {
        const stats = wordStats[word.korean]
        if (!stats || stats.attempts === 0) return false
        const accuracy = stats.correct / stats.attempts
        return accuracy < 0.8
      })

      if (availableWords.length === 0) {
        alert('No difficult words to review! You\'re doing great! 🎉')
        setReviewMode(false)
        availableWords = topikIIUnlocked ? allWords : topikIWords
      }
    }

    const sortedByPriority = [...availableWords].sort((a, b) => {
      return calculateWordPriority(b) - calculateWordPriority(a)
    })

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
    setWordsGenerated(true)
    wordsGeneratedRef.current = true
  }

  const updateWordStats = async (word, isCorrect, usedHint, usedExample) => {
    const stats = wordStats[word.korean] || {
      attempts: 0,
      correct: 0,
      hintsUsed: 0,
      examplesUsed: 0,
      lastSeen: 0
    }

    const newStats = {
      attempts: stats.attempts + 1,
      correct: stats.correct + (isCorrect ? 1 : 0),
      hintsUsed: stats.hintsUsed + (usedHint ? 1 : 0),
      examplesUsed: stats.examplesUsed + (usedExample ? 1 : 0),
      lastSeen: Date.now()
    }

    setWordStats({ ...wordStats, [word.korean]: newStats })

    await saveWordProgress(
      word.korean,
      newStats.attempts,
      newStats.correct,
      newStats.hintsUsed,
      newStats.examplesUsed
    )
  }

  const handleNextWord = () => {
    if (dailyCorrect >= dailyChallenge) {
      setFeedback('complete')
    } else if (currentIndex < dailyWords.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setInput('')
      setShowHint(false)
      setShowExample(false)
      setFeedback('')
    } else {
      setFeedback('complete')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!input.trim()) return

    const currentWord = dailyWords[currentIndex]
    const normalizedInput = input.trim().toLowerCase().replace(/\s+/g, '')
    const normalizedAnswer = currentWord.korean.toLowerCase().replace(/\s+/g, '')

    const isCorrect = normalizedInput === normalizedAnswer
    await updateWordStats(currentWord, isCorrect, showHint, showExample)

    if (isCorrect) {
      setFeedback('correct')
      const points = showHint ? 5 : (showExample ? 7 : 10)
      const newScore = score + points
      const newTotal = totalCompleted + 1
      const newDailyCorrect = dailyCorrect + 1

      setScore(newScore)
      setTotalCompleted(newTotal)
      setDailyCorrect(newDailyCorrect)

      const today = new Date().toISOString().split('T')[0]
      await saveUserStats(newTotal, newScore, streak, today, newDailyCorrect)
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

  const getCurrentRank = () => {
    return ranks.find(rank => totalCompleted >= rank.min && totalCompleted <= rank.max)
  }

  const getHardWords = () => {
    return Object.entries(wordStats)
      .filter(([_, stats]) => stats.attempts > 0)
      .map(([korean, stats]) => ({
        korean,
        accuracy: stats.correct / stats.attempts,
        attempts: stats.attempts
      }))
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 10)
  }

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

  if (!user) {
    return <AuthComponent />
  }

  const currentRank = getCurrentRank()
  const topikIIUnlocked = totalCompleted >= 500

  if (currentView === 'stats') {
    return (
      <StatsView
        totalCompleted={totalCompleted}
        streak={streak}
        hardWords={getHardWords()}
        accuracy={getAccuracyData()}
        setCurrentView={setCurrentView}
      />
    )
  }

  if (currentView === 'achievements') {
    return (
      <AchievementsView
        totalCompleted={totalCompleted}
        streak={streak}
        setCurrentView={setCurrentView}
      />
    )
  }

  if (currentView === 'settings') {
    return (
      <SettingsView
        dailyChallenge={dailyChallenge}
        setDailyChallenge={setDailyChallenge}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        reviewMode={reviewMode}
        setReviewMode={setReviewMode}
        setCurrentView={setCurrentView}
        wordsGeneratedRef={wordsGeneratedRef}
        generateDailyWords={generateDailyWords}
      />
    )
  }

  if (dailyWords.length === 0 && currentView === 'practice') {
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
        onNewChallenge={() => {
          wordsGeneratedRef.current = false
          generateDailyWords()
          setScore(0)
          setFeedback('')
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
        <CorrectModal word={currentWord} points={points} onNext={handleNextWord} />
      )}

      <NavBar
        currentView={currentView}
        setCurrentView={setCurrentView}
        currentRank={currentRank}
        streak={streak}
        handleSignOut={handleSignOut}
      />

      <div className="flex-1 p-3 md:p-6 overflow-y-auto md:overflow-hidden">
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
            />
          </div>

          <div className="hidden md:block md:col-span-1">
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

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.3s;
        }
      `}</style>
    </div>
  )
}
