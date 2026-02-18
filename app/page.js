'use client'

import React, { useState, useEffect } from 'react'
import { supabase, saveWordProgress, getWordProgress, saveUserStats, getUserStats } from '@/lib/supabase'
import { topikIWords, topikIIWords, allWords, ranks } from '@/lib/words'
import { Sparkles, Eye, EyeOff, Trophy, Star, BookOpen, Flame, Lock, Brain, LogOut, BarChart3, Award, Settings as SettingsIcon } from 'lucide-react'
import AuthComponent from '@/components/AuthComponent'

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
        // Same day - restore daily progress from database
        const dailyCorrectFromDB = stats.daily_correct || 0
        console.log('Restoring daily_correct:', dailyCorrectFromDB) // Debug
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
      console.log('Skipping word generation - already generated')
      return
    }
    
    console.log('Generating daily words...')
    
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
    // DON'T reset dailyCorrect here - it should come from database
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
    
    setWordStats({
      ...wordStats,
      [word.korean]: newStats
    })

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

  // Stats View
  if (currentView === 'stats') {
    const hardWords = getHardWords()
    const accuracy = getAccuracyData()
    
    return (
      <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <button
              onClick={() => setCurrentView('practice')}
              className="px-4 py-2 rounded-lg bg-gray-800 text-white shadow hover:bg-gray-700 cursor-pointer"
            >
              ← Back
            </button>
            <h2 className="text-2xl font-bold text-white">
              <BarChart3 className="inline mr-2" />
              Statistics
            </h2>
            <div className="w-24"></div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-800 rounded-xl p-6 text-center">
                <p className="text-sm text-gray-400">Total Mastered</p>
                <p className="text-4xl font-bold text-purple-400">{totalCompleted}</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-6 text-center">
                <p className="text-sm text-gray-400">Overall Accuracy</p>
                <p className="text-4xl font-bold text-green-400">{accuracy}%</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-6 text-center">
                <p className="text-sm text-gray-400">Best Streak</p>
                <p className="text-4xl font-bold text-orange-400">{streak} 🔥</p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Words to Review (Lowest Accuracy)</h3>
              <div className="space-y-3">
                {hardWords.length > 0 ? hardWords.map((word, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-700">
                    <div>
                      <span className="text-xl font-bold text-white">{word.korean}</span>
                      <span className="text-sm ml-3 text-gray-400">({word.attempts} attempts)</span>
                    </div>
                    <div className={`text-lg font-bold ${word.accuracy < 0.3 ? 'text-red-400' : word.accuracy < 0.6 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {(word.accuracy * 100).toFixed(0)}%
                    </div>
                  </div>
                )) : (
                  <p className="text-center text-gray-400">Start practicing to see your stats!</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Achievements View
  if (currentView === 'achievements') {
    const allAchievements = [
      { id: 'first_10', name: 'First Steps', desc: 'Learn 10 words', icon: '🎯', unlocked: totalCompleted >= 10 },
      { id: 'first_25', name: 'Quarter Century', desc: 'Learn 25 words', icon: '🌟', unlocked: totalCompleted >= 25 },
      { id: 'topik_ii', name: 'Level Up!', desc: 'Unlock TOPIK II', icon: '🔓', unlocked: totalCompleted >= 500 },
      { id: 'century', name: 'Century Club', desc: 'Learn 100 words', icon: '💯', unlocked: totalCompleted >= 100 },
      { id: 'week_streak', name: 'Dedicated', desc: '7 day streak', icon: '🔥', unlocked: streak >= 7 },
      { id: 'month_streak', name: 'Committed', desc: '30 day streak', icon: '🌙', unlocked: streak >= 30 },
    ]

    return (
      <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <button
              onClick={() => setCurrentView('practice')}
              className="px-4 py-2 rounded-lg bg-gray-800 text-white shadow hover:bg-gray-700 cursor-pointer"
            >
              ← Back
            </button>
            <h2 className="text-2xl font-bold text-white">
              <Award className="inline mr-2" />
              Achievements
            </h2>
            <div className="w-24"></div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto grid grid-cols-2 gap-4">
            {allAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`${
                  achievement.unlocked
                    ? 'bg-gradient-to-r from-purple-900 to-pink-900 border-2 border-yellow-500'
                    : 'bg-gray-800 opacity-50 border-2 border-gray-700'
                } rounded-xl p-6 shadow-lg transition-all`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-5xl">{achievement.icon}</div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{achievement.name}</h3>
                    <p className="text-sm text-gray-400">{achievement.desc}</p>
                    {achievement.unlocked && (
                      <span className="text-xs text-green-400 font-bold">✓ Unlocked!</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Settings View
  if (currentView === 'settings') {
    return (
      <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <button
              onClick={() => setCurrentView('practice')}
              className="px-4 py-2 rounded-lg bg-gray-800 text-white shadow hover:bg-gray-700 cursor-pointer"
            >
              ← Back
            </button>
            <h2 className="text-2xl font-bold text-white">
              <SettingsIcon className="inline mr-2" />
              Settings
            </h2>
            <div className="w-24"></div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-800 rounded-xl shadow-lg p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold mb-2 text-white">
                  Daily Challenge Size
                </label>
                <select
                  value={dailyChallenge}
                  onChange={(e) => setDailyChallenge(Number(e.target.value))}
                  className="w-full p-3 rounded-lg border-2 bg-gray-700 text-white border-gray-600 cursor-pointer"
                >
                  <option value={10}>10 words (Quick)</option>
                  <option value={25}>25 words (Standard)</option>
                  <option value={50}>50 words (Intense)</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">Sound Effects</p>
                  <p className="text-sm text-gray-400">Play sounds on correct/wrong answers</p>
                </div>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`px-4 py-2 rounded-lg ${soundEnabled ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'} cursor-pointer`}
                >
                  {soundEnabled ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">Review Mode</p>
                  <p className="text-sm text-gray-400">Practice only difficult words (&lt;80% accuracy)</p>
                </div>
                <button
                  onClick={() => {
                    setReviewMode(!reviewMode)
                    setCurrentView('practice')
                    if (!reviewMode) {
                      wordsGeneratedRef.current = false
                      generateDailyWords()
                    }
                  }}
                  className={`px-4 py-2 rounded-lg ${reviewMode ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-400'} cursor-pointer`}
                >
                  {reviewMode ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (dailyWords.length === 0 && currentView === 'practice') {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-2xl text-purple-400">Loading words...</div>
      </div>
    )
  }

  const progress = (dailyCorrect / dailyChallenge) * 100
  const currentWordDifficulty = dailyWords.length > 0 ? getWordDifficulty(dailyWords[currentIndex]) : 'New'

  // Challenge Complete
  if (feedback === 'complete') {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-2xl shadow-2xl p-12 text-center max-w-2xl">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-4xl font-bold mb-4">대박! Challenge Complete!</h2>
          <p className="text-xl mb-2">You scored {score} points today!</p>
          <p className="text-lg mb-6">Streak: {streak} days 🔥</p>
          {totalCompleted === 500 && (
            <div className="bg-yellow-400 text-yellow-900 rounded-xl p-4 mb-4">
              <Trophy className="inline mr-2" size={32} />
              <span className="text-xl font-bold">TOPIK II UNLOCKED!</span>
            </div>
          )}
          <button
            onClick={() => {
              wordsGeneratedRef.current = false
              generateDailyWords()
              setScore(0)
              setFeedback('')
            }}
            className="bg-white text-purple-600 px-8 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors cursor-pointer"
          >
            New Challenge
          </button>
        </div>
      </div>
    )
  }

  // Main Practice View
  return (
    <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">
      {/* Correct Answer Modal */}
      {feedback === 'correct' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border-2 border-green-500">
            <div className="text-center mb-6">
              <div className="text-6xl mb-2">✓</div>
              <p className="text-2xl font-bold text-green-400">Correct!</p>
              <p className="text-4xl font-bold text-white mt-2">{dailyWords[currentIndex].korean}</p>
              <p className="text-gray-400 mt-1">{dailyWords[currentIndex].english}</p>
              <p className="text-green-300 mt-1">+{showHint ? 5 : (showExample ? 7 : 10)} points</p>
            </div>
            <div className="bg-gray-700 rounded-xl p-4 mb-6">
              <p className="text-xs text-gray-400 mb-2">Example Sentence</p>
              <p className="text-lg font-bold text-white mb-1">{dailyWords[currentIndex].sentences[0]}</p>
              <p className="text-gray-300 italic text-sm">{dailyWords[currentIndex].sentences[1]}</p>
            </div>
            <button
              onClick={handleNextWord}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-4 rounded-xl font-bold text-xl hover:opacity-90 transition-opacity cursor-pointer"
            >
              Next Word →
            </button>
          </div>
        </div>
      )}
      {/* Top Navigation Bar */}
      <div className="p-4 border-b border-gray-800">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Sparkles className="text-purple-400" size={24} />
            <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              한글 TOPIK Master
            </h1>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentView('practice')}
              className={`px-4 py-2 rounded-lg ${currentView === 'practice' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'} transition-colors cursor-pointer`}
            >
              Practice
            </button>
            <button
              onClick={() => setCurrentView('stats')}
              className={`px-4 py-2 rounded-lg ${currentView === 'stats' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'} transition-colors cursor-pointer`}
            >
              <BarChart3 className="inline mr-1" size={18} />
              Stats
            </button>
            <button
              onClick={() => setCurrentView('achievements')}
              className={`px-4 py-2 rounded-lg ${currentView === 'achievements' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'} transition-colors cursor-pointer`}
            >
              <Award className="inline mr-1" size={18} />
              Badges
            </button>
            <button
              onClick={() => setCurrentView('settings')}
              className={`px-4 py-2 rounded-lg ${currentView === 'settings' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'} transition-colors cursor-pointer`}
            >
              <SettingsIcon className="inline mr-1" size={18} />
              Settings
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-800 border border-purple-500">
              <Trophy className="text-purple-400" size={16} />
              <span className="font-bold text-white text-sm">{currentRank.name}</span>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-800 border border-orange-500">
              <Flame className="text-orange-500" size={16} />
              <span className="font-bold text-white text-sm">{streak}</span>
            </div>

            <button
              onClick={handleSignOut}
              className="p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 cursor-pointer"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-hidden">
        <div className="max-w-7xl mx-auto h-full grid grid-cols-3 gap-6">
          {/* LEFT - Main Practice Area */}
          <div className="col-span-2 flex flex-col justify-center">
            <div className="bg-gray-800 rounded-2xl shadow-2xl p-8">
              {/* Difficulty Badge */}
              <div className="flex justify-center mb-6">
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                  currentWordDifficulty === 'Hard' ? 'bg-red-900 text-red-300' :
                  currentWordDifficulty === 'Medium' ? 'bg-yellow-900 text-yellow-300' :
                  currentWordDifficulty === 'Easy' ? 'bg-green-900 text-green-300' :
                  'bg-blue-900 text-blue-300'
                }`}>
                  <Brain className="inline mr-1" size={14} />
                  {currentWordDifficulty}
                </span>
              </div>

              {/* Question */}
              <div className="text-center mb-8">
                <p className="text-sm text-gray-400 mb-3">Translate to Korean</p>
                <h2 className="text-6xl font-bold text-white mb-4">
                  {dailyWords[currentIndex].english}
                </h2>
                <p className={`text-xl italic transition-all duration-300 ${
                  showExample 
                    ? 'text-gray-400 blur-none' 
                    : 'text-gray-600 blur-md select-none'
                }`}>
                  ({dailyWords[currentIndex].romanization})
                </p>
              </div>

              {/* Input Form */}
              <form onSubmit={handleSubmit} className="mb-6">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type here..."
                  className={`w-full text-4xl text-center p-4 border-4 rounded-xl mb-4 transition-all bg-gray-700 text-white ${
                    feedback === 'wrong'
                      ? 'border-red-400 bg-red-900 animate-shake'
                      : 'border-purple-500 focus:border-purple-400 focus:outline-none'
                  }`}
                  autoFocus
                />
                
                {feedback === 'wrong' ? (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setFeedback(''); setInput(''); setShowHint(false) }}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold text-xl hover:opacity-90 transition-opacity shadow-lg cursor-pointer"
                    >
                      Try Again
                    </button>
                    <button
                      type="button"
                      onClick={handleNextWord}
                      className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white py-4 rounded-xl font-bold text-xl hover:opacity-90 transition-opacity shadow-lg cursor-pointer"
                    >
                      Skip →
                    </button>
                  </div>
                ) : (
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold text-xl hover:opacity-90 transition-opacity shadow-lg cursor-pointer"
                  >
                    Submit Answer
                  </button>
                )}
              </form>

              {/* Feedback */}
              {feedback === 'wrong' && (
                <div className="p-4 bg-red-900 text-red-200 rounded-xl text-center font-bold border border-red-500 mb-4">
                  ✗ Wrong! Try again or skip
                </div>
              )}

              {/* Hint Buttons */}
              <div className="flex gap-3 justify-center mt-6">
                <button
                  onClick={() => {
                    if (!showHint) {
                      setShowHint(true)
                    }
                  }}
                  disabled={showHint}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-lg font-bold ${
                    showHint
                      ? 'bg-yellow-700 text-yellow-300 cursor-not-allowed'
                      : 'bg-yellow-900 hover:bg-yellow-800 text-yellow-200 cursor-pointer'
                  }`}
                >
                  {showHint ? <EyeOff size={18} /> : <Eye size={18} />}
                  {showHint ? dailyWords[currentIndex].korean : 'Show Answer (-5)'}
                </button>
                
                <button
                  onClick={() => setShowExample(!showExample)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors bg-blue-900 hover:bg-blue-800 text-blue-200 cursor-pointer"
                >
                  <BookOpen size={18} />
                  {showExample ? 'Hide' : 'Show'} Romanization (-3)
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT - Stats Sidebar */}
          <div className="col-span-1 flex flex-col gap-4">
            {/* Daily Progress */}
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-gray-400">Today</p>
                  <p className="text-xl font-bold text-purple-400">
                    {dailyCorrect}/{dailyChallenge}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Score</p>
                  <p className="text-xl font-bold text-pink-400">
                    <Star className="inline" size={16} /> {score}
                  </p>
                </div>
              </div>
              
              <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-500 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Review Button */}
              <button
                onClick={() => {
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
                }}
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
              >
                <Brain size={16} />
                Review 10 Difficult Words
              </button>
            </div>

            {/* TOPIK Progress */}
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-sm font-bold text-white mb-3">TOPIK Progress</p>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-blue-400">TOPIK I</span>
                    <span className="text-xs font-bold text-blue-300">{Math.min(totalCompleted, 500)}/500</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${Math.min((totalCompleted / 500) * 100, 100)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className={`text-xs ${topikIIUnlocked ? 'text-purple-400' : 'text-gray-500'}`}>TOPIK II</span>
                    <span className={`text-xs font-bold ${topikIIUnlocked ? 'text-purple-300' : 'text-gray-500'}`}>
                      {Math.max(0, totalCompleted - 500)}/500
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className={`${topikIIUnlocked ? 'bg-purple-500' : 'bg-gray-600'} h-2 rounded-full transition-all`} style={{ width: `${topikIIUnlocked ? Math.min(((totalCompleted - 500) / 500) * 100, 100) : 0}%` }} />
                  </div>
                </div>
              </div>
              {!topikIIUnlocked && (
                <div className="flex items-center gap-2 mt-3 text-gray-400 text-xs">
                  <Lock size={14} />
                  <span>{500 - totalCompleted} more to unlock TOPIK II</span>
                </div>
              )}
            </div>

            {/* Overall Stats */}
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-sm font-bold text-white mb-3">Stats</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total</span>
                  <span className="font-bold text-purple-400">{totalCompleted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Rank</span>
                  <span className="font-bold text-pink-400">{currentRank.level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Streak</span>
                  <span className="font-bold text-orange-400">{streak} 🔥</span>
                </div>
              </div>
            </div>

            {/* Example */}
            <div className="bg-gray-800 rounded-xl p-4 flex-1 flex flex-col">
              <p className="text-sm font-bold text-white mb-2">
                <BookOpen className="inline mr-1" size={16} />
                Example
              </p>
              <div className="bg-gray-700 rounded-lg p-3 flex-1 flex items-center">
                <p className="text-sm text-gray-300 italic">
                  "{dailyWords[currentIndex].sentences[1]}"
                </p>
              </div>
            </div>
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