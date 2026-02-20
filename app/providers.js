'use client'

import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase, saveWordProgress, getWordProgress, saveUserStats, getUserStats, saveDailyChallenge, getDailyChallenge } from '@/lib/supabase'
import { ranks } from '@/lib/ranks'

const AppContext = createContext(null)

// Lazy-load the 344KB word data — separate chunk, not in initial bundle
let _wordsCache = null
const getWords = () => {
  if (!_wordsCache) _wordsCache = import('@/lib/words')
  return _wordsCache
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dailyWords, setDailyWords] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [totalCompleted, setTotalCompleted] = useState(0)
  const [dailyChallenge, setDailyChallengeState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dailyChallenge')
      return saved ? Number(saved) : 25
    }
    return 25
  })
  const [streak, setStreak] = useState(0)
  const [wordStats, setWordStats] = useState({})
  const [reviewMode, setReviewMode] = useState(false)
  const [reverseMode, setReverseMode] = useState(false)
  const [dailyCorrect, setDailyCorrect] = useState(0)
  const [dailySkipped, setDailySkipped] = useState(0)
  const [isReviewing, setIsReviewing] = useState(false)
  const [error, setError] = useState(null)
  const wordsGeneratedRef = useRef(false)

  const setDailyChallenge = (val) => {
    if (typeof window !== 'undefined') localStorage.setItem('dailyChallenge', val)
    setDailyChallengeState(val)
  }

  const calculateWordPriority = (word, freshWordStats) => {
    const ws = freshWordStats ?? wordStats
    const stats = ws[word.korean] || { attempts: 0, correct: 0, hintsUsed: 0, examplesUsed: 0, lastSeen: 0 }
    if (stats.attempts === 0) return 60
    const accuracy = stats.correct / stats.attempts
    const daysSinceLastSeen = (Date.now() - (stats.lastSeen || 0)) / (1000 * 60 * 60 * 24)
    const hintRate = stats.hintsUsed / stats.attempts
    const exampleRate = stats.examplesUsed / stats.attempts
    const adjustedAccuracy = Math.max(0, accuracy - hintRate * 0.25 - exampleRate * 0.1)
    const easeFactor = Math.max(1.3, 2.5 + (adjustedAccuracy - 0.6) * 3)
    let interval
    if (stats.correct <= 1) interval = 1
    else if (stats.correct === 2) interval = 6
    else interval = Math.min(30, Math.round(6 * Math.pow(easeFactor, stats.correct - 2)))
    if (adjustedAccuracy < 0.6) interval = 1
    if (daysSinceLastSeen < interval) return (1 - adjustedAccuracy) * 10
    const overdueRatio = Math.min(daysSinceLastSeen / Math.max(interval, 1), 3)
    return (1 - adjustedAccuracy) * 100 + overdueRatio * 25
  }

  const generateDailyWords = async (freshWordStats) => {
    if (wordsGeneratedRef.current && dailyWords.length > 0) return
    const { topikIWords, allWords } = await getWords()
    const topikIIUnlocked = totalCompleted >= 500
    let availableWords = (topikIIUnlocked ? allWords : topikIWords).filter(w => w.image)
    if (reviewMode) {
      const ws = freshWordStats ?? wordStats
      availableWords = availableWords.filter(w => ws[w.korean]?.attempts > 0)
      if (availableWords.length === 0) {
        setReviewMode(false)
        availableWords = (topikIIUnlocked ? allWords : topikIWords).filter(w => w.image)
      }
    }
    const dc = typeof window !== 'undefined' ? Number(localStorage.getItem('dailyChallenge') || 25) : 25
    const sorted = [...availableWords].sort((a, b) => calculateWordPriority(b, freshWordStats) - calculateWordPriority(a, freshWordStats))
    const bufferSize = dc * 3
    const difficultCount = Math.floor(bufferSize * 0.7)
    const difficult = sorted.slice(0, difficultCount)
    const random = sorted.slice(difficultCount).sort(() => Math.random() - 0.5).slice(0, bufferSize - difficultCount)
    const selected = [...difficult, ...random].sort(() => Math.random() - 0.5)
    saveDailyChallenge(selected.map(w => w.korean))
    setDailyWords(selected)
    setCurrentIndex(0)
    wordsGeneratedRef.current = true
  }

  const loadUserData = async () => {
    getWords() // pre-warm cache in parallel with Supabase fetch
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
          const newStreak = lastLogin === yesterday.toISOString().split('T')[0] ? stats.streak + 1 : 0
          setStreak(newStreak)
          setDailyCorrect(0)
          setScore(0)
          await saveUserStats(stats.total_completed, 0, newStreak, today, 0)
        } else {
          setDailyCorrect(stats.daily_correct || 0)
        }
      }
      const { data: progress, error: progressError } = await getWordProgress()
      if (progressError) throw progressError
      let freshWordStats = {}
      if (progress) {
        progress.forEach(p => {
          freshWordStats[p.word_korean] = {
            attempts: p.attempts, correct: p.correct,
            hintsUsed: p.hints_used, examplesUsed: p.examples_used,
            lastSeen: new Date(p.last_seen).getTime(),
          }
        })
        setWordStats(freshWordStats)
      }
      if (!wordsGeneratedRef.current) {
        const { data: saved } = await getDailyChallenge()
        if (saved?.word_koreans?.length > 0) {
          const { allWords } = await getWords()
          const words = saved.word_koreans.map(k => allWords.find(w => w.korean === k)).filter(Boolean)
          if (words.length > 0) {
            setDailyWords(words)
            setCurrentIndex(0)
            wordsGeneratedRef.current = true
          } else {
            await generateDailyWords(freshWordStats)
          }
        } else {
          await generateDailyWords(freshWordStats)
        }
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
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted) return
      setUser(session?.user || null)
      if (session?.user && !wordsGeneratedRef.current) await loadUserData()
      setLoading(false)
    }
    checkUser()
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      const wasLoggedOut = !user && session?.user
      setUser(session?.user || null)
      if (wasLoggedOut && session?.user) loadUserData()
    })
    return () => {
      mounted = false
      authListener?.subscription?.unsubscribe()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateWordStats = async (word, isCorrect, usedHint, usedExample) => {
    const stats = wordStats[word.korean] || { attempts: 0, correct: 0, hintsUsed: 0, examplesUsed: 0, lastSeen: 0 }
    const newStats = {
      attempts: stats.attempts + 1,
      correct: stats.correct + (isCorrect ? 1 : 0),
      hintsUsed: stats.hintsUsed + (usedHint ? 1 : 0),
      examplesUsed: stats.examplesUsed + (usedExample ? 1 : 0),
      lastSeen: Date.now(),
    }
    setWordStats(prev => ({ ...prev, [word.korean]: newStats }))
    try {
      await saveWordProgress(word.korean, newStats.attempts, newStats.correct, newStats.hintsUsed, newStats.examplesUsed)
    } catch {
      setError('Failed to save progress. Your streak may not be recorded.')
    }
  }

  const speakKorean = (text) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'ko-KR'
    u.rate = 0.85
    window.speechSynthesis.speak(u)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const handleNewChallenge = () => {
    setIsReviewing(false)
    wordsGeneratedRef.current = false
    generateDailyWords() // async fire-and-forget — state updates when words resolve
    setScore(0)
    setDailyCorrect(0)
    setDailySkipped(0)
    const today = new Date().toISOString().split('T')[0]
    saveUserStats(totalCompleted, 0, streak, today, 0)
  }

  const handleReviewDifficult = async () => {
    const { allWords } = await getWords()
    const difficult = Object.entries(wordStats)
      .filter(([, s]) => s.attempts > 0 && s.correct / s.attempts < 0.8)
      .map(([korean]) => allWords.find(w => w.korean === korean))
      .filter(Boolean)
      .sort(() => Math.random() - 0.5)
      .slice(0, 10)
    if (difficult.length === 0) {
      alert('No difficult words to review! Keep practicing! 🎉')
    } else {
      setDailyWords(difficult)
      setCurrentIndex(0)
      setIsReviewing(true)
    }
  }

  const getWordDifficulty = (word) => {
    const stats = wordStats[word.korean]
    if (!stats || stats.attempts === 0) return 'New'
    const acc = stats.correct / stats.attempts
    if (acc >= 0.8) return 'Easy'
    if (acc >= 0.5) return 'Medium'
    return 'Hard'
  }

  const getCurrentRank = () => ranks.find(r => totalCompleted >= r.min && totalCompleted <= r.max)

  const getHardWords = () =>
    Object.entries(wordStats)
      .filter(([, s]) => s.attempts > 0)
      .map(([korean, s]) => ({ korean, accuracy: s.correct / s.attempts, attempts: s.attempts }))
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 10)

  const getAccuracyData = () => {
    const totalAttempts = Object.values(wordStats).reduce((s, v) => s + v.attempts, 0)
    const totalCorrect = Object.values(wordStats).reduce((s, v) => s + v.correct, 0)
    return totalAttempts > 0 ? ((totalCorrect / totalAttempts) * 100).toFixed(1) : 0
  }

  return (
    <AppContext.Provider value={{
      user, loading,
      dailyWords, setDailyWords, currentIndex, setCurrentIndex,
      score, setScore, totalCompleted, setTotalCompleted,
      dailyChallenge, setDailyChallenge,
      streak, setStreak,
      wordStats, updateWordStats,
      reviewMode, setReviewMode,
      reverseMode, setReverseMode,
      dailyCorrect, setDailyCorrect,
      dailySkipped, setDailySkipped,
      isReviewing, setIsReviewing,
      error, setError,
      wordsGeneratedRef, generateDailyWords,
      speakKorean, handleSignOut,
      handleNewChallenge, handleReviewDifficult,
      getWordDifficulty, getCurrentRank, getHardWords, getAccuracyData,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
