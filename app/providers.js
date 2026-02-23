'use client'

import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase, saveWordProgress, saveUserStats, getUserStats, saveDailyChallenge, getDailyChallenge, saveGrammarStats, saveDailyChallengePref, updateDailyChallengeProgress, deleteDailyChallenge, deleteStaleChallenge, updateDailyChallengeWords, markDailyCompleted, resetDailyCompleted } from '@/lib/supabase'
import { getWords } from '@/lib/words'
import { ranks } from '@/lib/ranks'
import { TOPIKII_UNLOCK_THRESHOLD, DEFAULT_DAILY_CHALLENGE, REVIEW_DIFFICULT_COUNT } from '@/lib/constants'

// ── Type-balanced daily word picker ──────────────────────────────────────────
// Ratios reflect actual dataset distribution (noun 71%, verb 18%, adj 6%, adv 4%, expr 1%)
// while keeping non-noun types slightly over-represented for variety.
// Ratios sum to 1. Slack from under-stocked types is filled by next-best SRS words.
const TYPE_SLOTS = [
  ['noun',       0.52],
  ['verb',       0.23],
  ['adjective',  0.13],
  ['adverb',     0.08],
  ['expression', 0.04],
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

// ── Decompress stored word stats ──────────────────────────────────────────────
function decompressWordStats(compressed) {
  const result = {}
  for (const [korean, v] of Object.entries(compressed)) {
    result[korean] = {
      attempts: v.a, correct: v.c,
      hintsUsed: v.h, examplesUsed: v.e,
      lastSeen:   v.t  * 1000,
      nextReview: v.n  ? v.n  * 1000 : 0,
      interval:   v.iv || 0,
    }
  }
  return result
}

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dailyWords, setDailyWords] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
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
  const [isReviewing, setIsReviewing] = useState(false)
  const [savedChallenge, setSavedChallenge] = useState(null) // snapshot before difficult review
  const [isEndlessMode, setIsEndlessMode] = useState(false)
  const [error, setError] = useState(null)
  const wordsGeneratedRef = useRef(false)
  // Refs for use inside timers/callbacks (avoid stale closures)
  const userRef = useRef(null)
  const wordStatsRef = useRef({})     // always-current mirror of wordStats state
  const dailyWordsRef = useRef([])    // always-current mirror of dailyWords state
  const totalCompletedRef = useRef(0)
  const dailyCorrectRef = useRef(0)   // needed for auto-complete in setDailyChallenge
  const sessionAnsweredRef = useRef(new Set()) // words answered this session (for delta saves)
  const saveTimerRef = useRef(null)
  const isEndlessModeRef = useRef(false)

  useEffect(() => { userRef.current = user }, [user])
  useEffect(() => { dailyWordsRef.current = dailyWords }, [dailyWords])
  useEffect(() => { totalCompletedRef.current = totalCompleted }, [totalCompleted])
  useEffect(() => { dailyCorrectRef.current = dailyCorrect }, [dailyCorrect])
  useEffect(() => { isEndlessModeRef.current = isEndlessMode }, [isEndlessMode])

  const setDailyChallenge = async (val) => {
    if (typeof window !== 'undefined') localStorage.setItem('dailyChallenge', String(val))
    setDailyChallengeState(val)
    const userId = userRef.current?.id
    if (userId) saveDailyChallengePref(userId, val)

    const current = dailyWordsRef.current
    if (current.length === 0) return

    // If user already answered >= new target, auto-complete the current challenge
    if (dailyCorrectRef.current >= val) {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      await completeChallenge()
      // Reset state and start a fresh challenge
      setDailyCorrect(0)
      setIsReviewing(false)
      setSavedChallenge(null)
      wordsGeneratedRef.current = false
      generateDailyWords(wordStatsRef.current, userId)
      const today = new Date().toISOString().split('T')[0]
      if (userId) saveUserStats(userId, totalCompletedRef.current, streak, today)
      return
    }

    // Adjust the word buffer to match the new challenge size
    const targetBuffer = val * 3
    if (current.length > targetBuffer) {
      // Too many words — trim to new buffer size
      const trimmed = current.slice(0, targetBuffer)
      setDailyWords(trimmed)
      dailyWordsRef.current = trimmed
      if (userId) updateDailyChallengeWords(userId, trimmed.map(w => w.korean))
    } else if (current.length < targetBuffer) {
      // Too few words — pull more from the pool, avoiding duplicates
      const { topikIWords, allWords } = await getWords()
      const pool = totalCompletedRef.current >= TOPIKII_UNLOCK_THRESHOLD ? allWords : topikIWords
      const existing = new Set(current.map(w => w.korean))
      const extra = pool
        .filter(w => !existing.has(w.korean))
        .sort(() => Math.random() - 0.5)
        .slice(0, targetBuffer - current.length)
      const updated = [...current, ...extra]
      setDailyWords(updated)
      dailyWordsRef.current = updated
      if (userId) updateDailyChallengeWords(userId, updated.map(w => w.korean))
    }
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
    // saveDailyChallenge upserts word_koreans and resets word_progress to {} for a fresh challenge
    // Reset session tracking so the new challenge starts with an empty delta
    sessionAnsweredRef.current = new Set()
    if (uid) saveDailyChallenge(uid, selected.map(w => w.korean))
    setDailyWords(selected)
    setCurrentIndex(0)
    wordsGeneratedRef.current = true
  }

  const loadUserData = async (userId) => {
    getWords() // pre-warm cache in parallel with Supabase fetches
    try {
      // Fetch stats + today's daily challenge in parallel
      const [
        { data: stats, error: statsError },
        { data: todayChallenge },
      ] = await Promise.all([
        getUserStats(userId),
        getDailyChallenge(userId),
      ])
      if (statsError) throw statsError
      const today = new Date().toISOString().split('T')[0]
      let effectiveDailyCompleted = stats?.daily_completed === true
      if (stats) {
        setTotalCompleted(stats.total_completed || 0)
        setStreak(stats.streak || 0)
        const lastLogin = stats.last_login
        if (lastLogin !== today) {
          effectiveDailyCompleted = false
          const yesterday = new Date()
          yesterday.setDate(yesterday.getDate() - 1)
          const newStreak = lastLogin === yesterday.toISOString().split('T')[0] ? stats.streak + 1 : 0
          setStreak(newStreak)
          setDailyCorrect(0)
          await Promise.all([
            saveUserStats(userId, stats.total_completed, newStreak, today),
            resetDailyCompleted(userId),
          ])
        }
        // Restore challenge preference from DB (overrides localStorage if different)
        if (stats.daily_challenge) {
          if (typeof window !== 'undefined') localStorage.setItem('dailyChallenge', String(stats.daily_challenge))
          setDailyChallengeState(stats.daily_challenge)
        }
      }

      // Separate today's challenge from a stale row (different date)
      const challengeIsToday = todayChallenge?.challenge_date === today
      const activeTodayChallenge = challengeIsToday ? todayChallenge : null
      const staleChallenge       = !challengeIsToday && todayChallenge ? todayChallenge : null

      // Load canonical word stats from user_stats
      let freshWordStats = {}
      if (stats?.word_progress) {
        freshWordStats = decompressWordStats(stats.word_progress)
      }

      // If there's a stale challenge row from a previous day:
      // 1. Merge its word_progress into canonical so unfinished work is not lost
      // 2. Save the merged stats back to user_stats.word_progress
      // 3. Delete the stale row so a fresh challenge can be generated for today
      if (staleChallenge) {
        const staleRaw = staleChallenge.word_progress || {}
        const hasProgress = Object.keys(staleRaw).length > 0
        if (hasProgress) {
          const staleDecompressed = decompressWordStats(staleRaw)
          freshWordStats = { ...freshWordStats, ...staleDecompressed }
        }
        // Always delete the stale row; only write user_stats if there's actual progress to save
        await Promise.all([
          deleteStaleChallenge(userId, today),
          hasProgress ? saveWordProgress(userId, freshWordStats) : Promise.resolve(),
        ])
      }

      // Decompress today's session delta (words answered this session only).
      // daily_challenges.word_progress starts as {} on a new challenge and only accumulates
      // words actually answered — so any key here means "touched this session".
      const stagedRaw = activeTodayChallenge?.word_progress || {}
      const stagedDecompressed = Object.keys(stagedRaw).length > 0
        ? decompressWordStats(stagedRaw)
        : {}

      // Seed sessionAnsweredRef from existing staged data so resume saves the right delta
      for (const k of Object.keys(stagedDecompressed)) sessionAnsweredRef.current.add(k)

      // Merge staged into canonical (staged wins — more recent)
      const mergedStats = { ...freshWordStats, ...stagedDecompressed }
      setWordStats(mergedStats)
      wordStatsRef.current = mergedStats

      // Derive dailyCorrect from staged delta: words in today's challenge answered correctly
      const wordKoreans = activeTodayChallenge?.word_koreans ?? []
      const derivedDailyCorrect = wordKoreans.filter(k => (stagedDecompressed[k]?.correct || 0) > 0).length
      setDailyCorrect(derivedDailyCorrect)

      if (stats?.grammar_stats) {
        setGrammarStats(stats.grammar_stats)
      }

      const completedToday = effectiveDailyCompleted

      if (!wordsGeneratedRef.current) {
        if (completedToday && !activeTodayChallenge) {
          // Challenge already completed today (on this or another device) — go straight to endless mode
          const topikIIUnlocked = (stats?.total_completed || 0) >= TOPIKII_UNLOCK_THRESHOLD
          const { topikIWords, allWords } = await getWords()
          const pool = topikIIUnlocked ? allWords : topikIWords
          const endless = [...pool].sort(() => Math.random() - 0.5)
          setDailyWords(endless)
          dailyWordsRef.current = endless
          setCurrentIndex(0)
          wordsGeneratedRef.current = true
          setIsEndlessMode(true)
        } else if (activeTodayChallenge?.word_koreans?.length > 0) {
          // Restore today's in-progress challenge word list
          const { allWords } = await getWords()
          const words = activeTodayChallenge.word_koreans.map(k => allWords.find(w => w.korean === k)).filter(Boolean)
          if (words.length > 0) {
            setDailyWords(words)
            // Resume from first word not yet answered correctly (skip already-done words)
            const startIdx = words.findIndex(w => !(stagedDecompressed[w.korean]?.correct > 0))
            setCurrentIndex(startIdx >= 0 ? startIdx : 0)
            wordsGeneratedRef.current = true
          } else {
            await generateDailyWords(wordStatsRef.current, userId)
          }
        } else {
          // No valid challenge for today — generate and create one
          await generateDailyWords(wordStatsRef.current, userId)
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

  // Save in-progress word stats — only the session delta to daily_challenges.
  // Keeping the delta small means on any device we can derive dailyCorrect and
  // skip already-completed words without a separate daily_correct counter.
  const flushSessionProgress = async () => {
    const userId = userRef.current?.id
    if (!userId) return
    if (isEndlessModeRef.current) {
      await saveWordProgress(userId, wordStatsRef.current)
    } else {
      const delta = {}
      for (const k of sessionAnsweredRef.current) {
        if (wordStatsRef.current[k]) delta[k] = wordStatsRef.current[k]
      }
      if (Object.keys(delta).length > 0) {
        await updateDailyChallengeProgress(userId, delta)
      }
    }
  }

  // Finalize a challenge: flush canonical word stats to user_stats + delete the daily_challenges row
  // + mark today's challenge as completed (for cross-device detection)
  const completeChallenge = async () => {
    const userId = userRef.current?.id
    if (!userId) return
    await Promise.all([
      saveWordProgress(userId, wordStatsRef.current),
      deleteDailyChallenge(userId),
      markDailyCompleted(userId),
    ])
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
    wordStatsRef.current = { ...wordStatsRef.current, [word.korean]: newStats }
    sessionAnsweredRef.current.add(word.korean) // track for delta saves
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    // Debounced save — only the delta (words touched this session) to daily_challenges
    saveTimerRef.current = setTimeout(() => {
      flushSessionProgress().catch(() =>
        setError('Failed to save progress. Your streak may not be recorded.')
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
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    const userId = userRef.current?.id
    if (userId) {
      // Save delta to staging (so session can resume today with correct progress)
      // Save full stats to canonical (source of truth for next session)
      const delta = {}
      for (const k of sessionAnsweredRef.current) {
        if (wordStatsRef.current[k]) delta[k] = wordStatsRef.current[k]
      }
      await Promise.all([
        Object.keys(delta).length > 0
          ? updateDailyChallengeProgress(userId, delta)
          : Promise.resolve(),
        saveWordProgress(userId, wordStatsRef.current),
      ])
    }
    await supabase.auth.signOut()
    setUser(null)
  }

  // Triggers DB finalization (save to user_stats + delete daily_challenges)
  const completeChallengeScore = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    completeChallenge() // async fire-and-forget
  }

  const handleNewChallenge = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    // Finalize: flush canonical word stats + delete daily_challenges row
    completeChallenge()
    resetDailyCompleted(userRef.current?.id)
    setIsReviewing(false)
    setIsEndlessMode(false)
    setSavedChallenge(null)
    wordsGeneratedRef.current = false
    generateDailyWords() // async fire-and-forget — state updates when words resolve
    setDailyCorrect(0)
    const today = new Date().toISOString().split('T')[0]
    saveUserStats(userRef.current?.id, totalCompleted, streak, today)
  }

  // "Continue" after challenge complete — endless mode with words not in today's challenge
  const handleContinueEndless = async () => {
    const topikIIUnlocked = totalCompletedRef.current >= TOPIKII_UNLOCK_THRESHOLD
    const { topikIWords, allWords } = await getWords()
    const pool = topikIIUnlocked ? allWords : topikIWords
    const todaysKoreans = new Set(dailyWordsRef.current.map(w => w.korean))
    const availableWords = pool
      .filter(w => !todaysKoreans.has(w.korean))
      .sort(() => Math.random() - 0.5)
    setDailyWords(availableWords)
    dailyWordsRef.current = availableWords
    setCurrentIndex(0)
    setIsEndlessMode(true)
    setIsReviewing(false)
    setSavedChallenge(null)
  }

  // "Review Learned" after challenge complete — all words with at least 1 attempt
  const handleReviewLearned = async () => {
    const { allWords } = await getWords()
    const ws = wordStatsRef.current
    const learned = allWords
      .filter(w => ws[w.korean]?.attempts > 0)
      .sort(() => Math.random() - 0.5)
    if (learned.length === 0) return
    setDailyWords(learned)
    dailyWordsRef.current = learned
    setCurrentIndex(0)
    setIsReviewing(true)
    setIsEndlessMode(false)
    setSavedChallenge(null)
  }

  const handleReviewDifficult = async (currentDailyWords, currentIdx, currentDailyCorrect) => {
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
      totalCompleted, setTotalCompleted,
      dailyChallenge, setDailyChallenge,
      streak, setStreak,
      wordStats, updateWordStats,
      reviewMode, setReviewMode,
      reverseMode, setReverseMode,
      dailyCorrect, setDailyCorrect,
      isReviewing, setIsReviewing,
      isEndlessMode, setIsEndlessMode,
      error, setError,
      wordsGeneratedRef, generateDailyWords,
      speakKorean, handleSignOut,
      handleNewChallenge, handleReviewDifficult, handleReturnToChallenge, completeChallengeScore,
      handleContinueEndless, handleReviewLearned,
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
