'use client'

import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase, saveWordProgress, saveUserStats, getUserStats, saveDailyChallenge, getDailyChallenge, saveGrammarStats } from '@/lib/supabase'
import { getWords } from '@/lib/words'
import { ranks } from '@/lib/ranks'
import { TOPIKII_UNLOCK_THRESHOLD, DEFAULT_DAILY_CHALLENGE, REVIEW_DIFFICULT_COUNT } from '@/lib/constants'

// ── Type-balanced daily word picker ──────────────────────────────────────────
// Proportional targets per word type so every day has a healthy mix.
// Ratios must roughly sum to 1. If a type has fewer words than its target,
// the slack is filled by higher-priority words of any remaining type.
const TYPE_SLOTS = [
  ['noun',       0.38],
  ['verb',       0.27],
  ['adjective',  0.17],
  ['adverb',     0.09],
  ['expression', 0.05],
  ['other',      0.04],
]

function pickBalanced(priorityList, count) {
  // Group indices (= SRS rank) by word type; heuristic fallback when type is null.
  const groups = {}
  for (let i = 0; i < priorityList.length; i++) {
    const w = priorityList[i]
    const t = w.type || (w.korean?.trimEnd().endsWith('다') ? 'verb' : 'noun')
    ;(groups[t] || (groups[t] = [])).push(i)
  }

  const picked = new Set()

  // First pass — fill each type slot up to its proportional target.
  for (const [type, ratio] of TYPE_SLOTS) {
    const target = Math.max(1, Math.round(count * ratio))
    const indices = groups[type] || []
    for (let j = 0; j < Math.min(target, indices.length); j++) picked.add(indices[j])
  }

  // Second pass — backfill any remaining slots with the next-best SRS words.
  for (let i = 0; i < priorityList.length && picked.size < count; i++) picked.add(i)

  // Return in original priority order (shuffle happens in the caller).
  return [...picked].sort((a, b) => a - b).map(i => priorityList[i])
}

// ── SRS (SM-2 inspired) ───────────────────────────────────────────────────────
// Returns { interval (days), nextReview (ms timestamp) } after each answer
function computeSRS(stats, isCorrect) {
  const accuracy = (stats.correct + (isCorrect ? 1 : 0)) / (stats.attempts + 1)
  const easeFactor = Math.max(1.3, 2.5 + (accuracy - 0.6) * 3)
  const prevInterval = stats.interval || 0

  let interval
  if (!isCorrect) {
    interval = 1                                            // wrong → tomorrow
  } else if (stats.correct === 0) {
    interval = 1                                            // first correct → 1 day
  } else if (stats.correct === 1) {
    interval = 6                                            // second correct → 6 days
  } else {
    const base = prevInterval > 0 ? prevInterval : 6
    interval = Math.max(1, Math.min(180, Math.round(base * easeFactor)))
  }

  return { interval, nextReview: Date.now() + interval * 24 * 60 * 60 * 1000 }
}

const AppContext = createContext(null)

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
      return saved ? Number(saved) : DEFAULT_DAILY_CHALLENGE
    }
    return DEFAULT_DAILY_CHALLENGE
  })
  const [streak, setStreak] = useState(0)
  const [wordStats, setWordStats] = useState({})
  const [grammarStats, setGrammarStats] = useState({})
  const [reviewMode, setReviewMode] = useState(false)
  const [reverseMode, setReverseMode] = useState(false)
  const [dailyCorrect, setDailyCorrect] = useState(0)
  const [dailySkipped, setDailySkipped] = useState(0)
  const [isReviewing, setIsReviewing] = useState(false)
  const [savedChallenge, setSavedChallenge] = useState(null) // snapshot before difficult review
  const [totalScore, setTotalScore] = useState(0)
  const [error, setError] = useState(null)
  const wordsGeneratedRef = useRef(false)
  // Refs for use inside timers/callbacks (avoid stale closures)
  const userRef = useRef(null)
  const totalScoreRef = useRef(0)
  const pendingSavesRef = useRef({})   // word progress batch queue
  const saveTimerRef = useRef(null)
  const pendingStatsRef = useRef(null) // user stats debounce queue
  const statsTimerRef = useRef(null)

  useEffect(() => { userRef.current = user }, [user])
  useEffect(() => { totalScoreRef.current = totalScore }, [totalScore])

  const setDailyChallenge = (val) => {
    if (typeof window !== 'undefined') localStorage.setItem('dailyChallenge', val)
    setDailyChallengeState(val)
  }


  const generateDailyWords = async (freshWordStats, userId) => {
    if (wordsGeneratedRef.current && dailyWords.length > 0) return
    const { topikIWords, allWords } = await getWords()
    const topikIIUnlocked = totalCompleted >= TOPIKII_UNLOCK_THRESHOLD
    let availableWords = topikIIUnlocked ? allWords : topikIWords
    if (reviewMode) {
      const ws = freshWordStats ?? wordStats
      availableWords = availableWords.filter(w => ws[w.korean]?.attempts > 0)
      if (availableWords.length === 0) {
        setReviewMode(false)
        availableWords = topikIIUnlocked ? allWords : topikIWords
      }
    }
    const dc = typeof window !== 'undefined' ? Number(localStorage.getItem('dailyChallenge') || DEFAULT_DAILY_CHALLENGE) : DEFAULT_DAILY_CHALLENGE
    const ws  = freshWordStats ?? wordStats
    const now = Date.now()

    // Bucket words into: overdue reviews | new (never seen) | future (not due yet)
    const dueWords    = []
    const newWords    = []
    const futureWords = []
    for (const word of availableWords) {
      const s = ws[word.korean]
      if (!s || s.attempts === 0)              newWords.push(word)
      else if (!s.nextReview || s.nextReview <= now) dueWords.push(word)
      else                                     futureWords.push(word)
    }

    // Most overdue first → new words random → soonest-due next
    dueWords.sort((a, b)    => (ws[a.korean]?.nextReview || 0)        - (ws[b.korean]?.nextReview || 0))
    futureWords.sort((a, b) => (ws[a.korean]?.nextReview || Infinity)  - (ws[b.korean]?.nextReview || Infinity))
    newWords.sort(() => Math.random() - 0.5)

    const bufferSize = dc * 3
    const priorityList = [...dueWords, ...newWords, ...futureWords]
    const selected = pickBalanced(priorityList, bufferSize)
      .sort(() => Math.random() - 0.5)   // shuffle the final mix
    const uid = userId ?? userRef.current?.id
    if (uid) saveDailyChallenge(uid, selected.map(w => w.korean))
    setDailyWords(selected)
    setCurrentIndex(0)
    wordsGeneratedRef.current = true
  }

  const loadUserData = async (userId) => {
    getWords() // pre-warm cache in parallel with Supabase fetches
    try {
      // Fetch stats + daily challenge in parallel — word_progress JSONB is inside stats
      const [
        { data: stats, error: statsError },
        { data: savedChallenge },
      ] = await Promise.all([
        getUserStats(userId),
        getDailyChallenge(userId),
      ])
      if (statsError) throw statsError
      if (stats) {
        setTotalCompleted(stats.total_completed || 0)
        setScore(stats.current_score || 0)
        setStreak(stats.streak || 0)
        const loadedTotalScore = stats.total_score || 0
        setTotalScore(loadedTotalScore)
        totalScoreRef.current = loadedTotalScore
        const today = new Date().toISOString().split('T')[0]
        const lastLogin = stats.last_login
        if (lastLogin !== today) {
          const yesterday = new Date()
          yesterday.setDate(yesterday.getDate() - 1)
          const newStreak = lastLogin === yesterday.toISOString().split('T')[0] ? stats.streak + 1 : 0
          setStreak(newStreak)
          setDailyCorrect(0)
          setScore(0)
          await saveUserStats(userId, stats.total_completed, 0, newStreak, today, 0, loadedTotalScore)
        } else {
          setDailyCorrect(stats.daily_correct || 0)
        }
      }
      let freshWordStats = {}
      if (stats?.word_progress) {
        for (const [korean, v] of Object.entries(stats.word_progress)) {
          freshWordStats[korean] = {
            attempts: v.a, correct: v.c,
            hintsUsed: v.h, examplesUsed: v.e,
            lastSeen:   v.t  * 1000,
            nextReview: v.n  ? v.n  * 1000 : 0,
            interval:   v.iv || 0,
          }
        }
        setWordStats(freshWordStats)
      }
      if (stats?.grammar_stats) {
        setGrammarStats(stats.grammar_stats)
      }
      if (!wordsGeneratedRef.current) {
        if (savedChallenge?.word_koreans?.length > 0) {
          const { allWords } = await getWords()
          const words = savedChallenge.word_koreans.map(k => allWords.find(w => w.korean === k)).filter(Boolean)
          if (words.length > 0) {
            setDailyWords(words)
            setCurrentIndex(0)
            wordsGeneratedRef.current = true
          } else {
            await generateDailyWords(freshWordStats, userId)
          }
        } else {
          await generateDailyWords(freshWordStats, userId)
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
      if (session?.user && !wordsGeneratedRef.current) await loadUserData(session.user.id)
      setLoading(false)
    }
    checkUser()
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      const wasLoggedOut = !user && session?.user
      setUser(session?.user || null)
      if (wasLoggedOut && session?.user) loadUserData(session.user.id)
    })
    return () => {
      mounted = false
      authListener?.subscription?.unsubscribe()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Flush all queued word-progress saves immediately (used on sign-out)
  const flushPendingSaves = async () => {
    const userId = userRef.current?.id
    if (!userId) return
    if (Object.keys(pendingSavesRef.current).length === 0) return
    const snapshot = { ...pendingSavesRef.current }
    pendingSavesRef.current = {}
    await saveWordProgress(userId, snapshot)
  }

  const updateWordStats = async (word, isCorrect, usedHint, usedExample) => {
    const stats = wordStats[word.korean] || { attempts: 0, correct: 0, hintsUsed: 0, examplesUsed: 0, lastSeen: 0, nextReview: 0, interval: 0 }
    const { interval, nextReview } = computeSRS(stats, isCorrect)
    const newStats = {
      attempts:     stats.attempts     + 1,
      correct:      stats.correct      + (isCorrect   ? 1 : 0),
      hintsUsed:    stats.hintsUsed    + (usedHint    ? 1 : 0),
      examplesUsed: stats.examplesUsed + (usedExample ? 1 : 0),
      lastSeen:  Date.now(),
      nextReview,
      interval,
    }
    setWordStats(prev => ({ ...prev, [word.korean]: newStats }))
    // Queue for batched save — flushes 2s after the last answer
    pendingSavesRef.current[word.korean] = newStats
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      flushPendingSaves().catch(() =>
        setError('Failed to save progress. Your streak may not be recorded.')
      )
    }, 2000)
  }

  // Debounced user-stats save — safe because each call supersedes the previous (upsert)
  const recordScore = (newTotal, newScore, newStreak, newDailyCorrect) => {
    pendingStatsRef.current = { newTotal, newScore, newStreak, newDailyCorrect }
    if (statsTimerRef.current) clearTimeout(statsTimerRef.current)
    statsTimerRef.current = setTimeout(() => {
      const userId = userRef.current?.id
      if (!userId || !pendingStatsRef.current) return
      const { newTotal, newScore, newStreak, newDailyCorrect } = pendingStatsRef.current
      pendingStatsRef.current = null
      const today = new Date().toISOString().split('T')[0]
      saveUserStats(userId, newTotal, newScore, newStreak, today, newDailyCorrect, totalScoreRef.current).catch(() =>
        setError('Failed to save stats. Please check your connection.')
      )
    }, 2000)
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
    // Flush any queued saves before signing out
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    if (statsTimerRef.current) clearTimeout(statsTimerRef.current)
    await flushPendingSaves()
    if (pendingStatsRef.current) {
      const userId = userRef.current?.id
      if (userId) {
        const { newTotal, newScore, newStreak, newDailyCorrect } = pendingStatsRef.current
        const today = new Date().toISOString().split('T')[0]
        await saveUserStats(userId, newTotal, newScore, newStreak, today, newDailyCorrect, totalScoreRef.current)
      }
    }
    await supabase.auth.signOut()
    setUser(null)
  }

  // Called the moment a challenge is marked complete — adds daily score to lifetime total
  const completeChallengeScore = (dailyScore) => {
    if (dailyScore <= 0) return
    const newTotalScore = totalScoreRef.current + dailyScore
    setTotalScore(newTotalScore)
    totalScoreRef.current = newTotalScore
    // totalScoreRef is now updated; the pending recordScore debounce timer will pick it up
  }

  const handleNewChallenge = () => {
    setIsReviewing(false)
    setSavedChallenge(null)
    wordsGeneratedRef.current = false
    generateDailyWords() // async fire-and-forget — state updates when words resolve
    setScore(0)
    setDailyCorrect(0)
    setDailySkipped(0)
    const today = new Date().toISOString().split('T')[0]
    saveUserStats(userRef.current?.id, totalCompleted, 0, streak, today, 0, totalScoreRef.current)
  }

  const handleReviewDifficult = async (currentDailyWords, currentIdx, currentDailyCorrect, currentDailySkipped) => {
    const { allWords } = await getWords()
    const difficult = Object.entries(wordStats)
      .filter(([, s]) => s.attempts > 0 && s.correct / s.attempts < 0.8)
      .map(([korean]) => allWords.find(w => w.korean === korean))
      .filter(Boolean)
      .sort(() => Math.random() - 0.5)
      .slice(0, REVIEW_DIFFICULT_COUNT)
    if (difficult.length === 0) {
      alert('No difficult words to review! Keep practicing! 🎉')
    } else {
      // Save the current challenge state so the user can return to it
      setSavedChallenge({
        dailyWords: currentDailyWords,
        currentIndex: currentIdx,
        dailyCorrect: currentDailyCorrect,
        dailySkipped: currentDailySkipped,
        fromReview: isReviewing,
      })
      setDailyWords(difficult)
      setCurrentIndex(0)
      setIsReviewing(true)
    }
  }

  const handleReturnToChallenge = () => {
    if (savedChallenge) {
      setDailyWords(savedChallenge.dailyWords)
      setCurrentIndex(savedChallenge.currentIndex)
      setDailyCorrect(savedChallenge.dailyCorrect)
      setDailySkipped(savedChallenge.dailySkipped)
      setIsReviewing(savedChallenge.fromReview)
      setSavedChallenge(null)
    } else {
      setIsReviewing(false)
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

  const saveGrammarResult = (level, correct, total, perCat = []) => {
    const userId = userRef.current?.id
    if (!userId) return
    const key = level === 'II' ? 'topik_ii' : 'topik_i'
    setGrammarStats(prev => {
      const prevLevel = prev[key] || { correct: 0, total: 0, sessions: 0 }
      const prevRuleStats = prev.rule_stats || {}
      const newRuleStats = { ...prevRuleStats }
      // Group answers by category to detect perfect sessions (all correct in one game)
      const catSession = {}
      for (const { category, correct: c } of perCat) {
        if (!catSession[category]) catSession[category] = { correct: 0, total: 0 }
        catSession[category].total++
        if (c) catSession[category].correct++
      }
      for (const [category, sess] of Object.entries(catSession)) {
        const p = newRuleStats[category] || { correct: 0, total: 0, perfectGames: 0 }
        const perfect = sess.total > 0 && sess.correct === sess.total
        newRuleStats[category] = {
          correct:      p.correct + sess.correct,
          total:        p.total   + sess.total,
          perfectGames: (p.perfectGames || 0) + (perfect ? 1 : 0),
        }
      }
      const updated = {
        ...prev,
        [key]: {
          correct:  prevLevel.correct  + correct,
          total:    prevLevel.total    + total,
          sessions: prevLevel.sessions + 1,
        },
        rule_stats: newRuleStats,
      }
      saveGrammarStats(userId, updated)
      return updated
    })
  }

  // Words that have been seen at least once and whose review is overdue/today
  const getDueCount = () => {
    const now = Date.now()
    return Object.values(wordStats).filter(s => s.attempts > 0 && (!s.nextReview || s.nextReview <= now)).length
  }

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
      score, setScore, totalScore, totalCompleted, setTotalCompleted,
      dailyChallenge, setDailyChallenge,
      streak, setStreak,
      wordStats, updateWordStats, recordScore,
      reviewMode, setReviewMode,
      reverseMode, setReverseMode,
      dailyCorrect, setDailyCorrect,
      dailySkipped, setDailySkipped,
      isReviewing, setIsReviewing,
      error, setError,
      wordsGeneratedRef, generateDailyWords,
      speakKorean, handleSignOut,
      handleNewChallenge, handleReviewDifficult, handleReturnToChallenge, completeChallengeScore,
      savedChallenge,
      grammarStats, saveGrammarResult,
      getWordDifficulty, getCurrentRank, getDueCount, getHardWords, getAccuracyData,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
