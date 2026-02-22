import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Shared compression: wordStats object → compact DB format
function compressWordStats(wordStats) {
  const progress = {}
  for (const [korean, s] of Object.entries(wordStats)) {
    progress[korean] = {
      a: s.attempts, c: s.correct, h: s.hintsUsed, e: s.examplesUsed,
      t:  Math.floor(s.lastSeen   / 1000),
      n:  s.nextReview ? Math.floor(s.nextReview / 1000) : 0,
      iv: s.interval || 0,
    }
  }
  return progress
}

// Saves full word_progress to user_stats (canonical store — on complete / sign-out)
export async function saveWordProgress(userId, wordStats) {
  if (!userId || !wordStats || Object.keys(wordStats).length === 0) return
  const { error } = await supabase
    .from('user_stats')
    .update({ word_progress: compressWordStats(wordStats) })
    .eq('user_id', userId)
  if (error) console.error('Error saving word progress:', error)
}

// Updates in-progress word stats in daily_challenges (staging — during session)
export async function updateDailyChallengeProgress(userId, wordStats) {
  if (!userId || !wordStats || Object.keys(wordStats).length === 0) return
  const today = new Date().toISOString().split('T')[0]
  const { error } = await supabase
    .from('daily_challenges')
    .update({ word_progress: compressWordStats(wordStats) })
    .eq('user_id', userId)
    .eq('challenge_date', today)
  if (error) console.error('Error updating daily challenge progress:', error)
}

export async function saveUserStats(userId, totalCompleted, streak, lastLogin, dailyCorrect = 0) {
  if (!userId) return null
  const { data, error } = await supabase
    .from('user_stats')
    .upsert({
      user_id: userId,
      total_completed: totalCompleted,
      streak,
      last_login: lastLogin,
      daily_correct: dailyCorrect,
    }, { onConflict: 'user_id' })
    .select()
  if (error) console.error('Error saving user stats:', error)
  return { data, error }
}

export async function getUserStats(userId) {
  if (!userId) return { data: null, error: null }
  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .single()
  if (error) {
    if (error.code === 'PGRST116') return { data: null, error: null } // no row = new user
    console.error('Error getting user stats:', error)
  }
  return { data, error }
}

// Create or reset today's daily challenge (called when generating new words)
// Always resets word_progress to {} to start fresh
export async function saveDailyChallenge(userId, wordKoreans) {
  if (!userId) return null
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('daily_challenges')
    .upsert({ user_id: userId, challenge_date: today, word_koreans: wordKoreans, word_progress: {} }, {
      onConflict: 'user_id,challenge_date'
    })
    .select()
  if (error) console.error('Error saving daily challenge:', error)
  return { data, error }
}

// Update only word_koreans in an existing row (when adjusting buffer size mid-session)
export async function updateDailyChallengeWords(userId, wordKoreans) {
  if (!userId) return
  const today = new Date().toISOString().split('T')[0]
  const { error } = await supabase
    .from('daily_challenges')
    .update({ word_koreans: wordKoreans })
    .eq('user_id', userId)
    .eq('challenge_date', today)
  if (error) console.error('Error updating daily challenge words:', error)
}

// Delete today's daily challenge row (called when challenge is complete)
export async function deleteDailyChallenge(userId) {
  if (!userId) return
  const today = new Date().toISOString().split('T')[0]
  const { error } = await supabase
    .from('daily_challenges')
    .delete()
    .eq('user_id', userId)
    .eq('challenge_date', today)
  if (error) console.error('Error deleting daily challenge:', error)
}

// Record that the user completed today's daily challenge (used to detect cross-device completion)
export async function markDailyCompleted(userId) {
  if (!userId) return
  const { error } = await supabase
    .from('user_stats')
    .update({ daily_completed: true })
    .eq('user_id', userId)
  if (error) console.error('Error marking daily completed:', error)
}

export async function resetDailyCompleted(userId) {
  if (!userId) return
  const { error } = await supabase
    .from('user_stats')
    .update({ daily_completed: false })
    .eq('user_id', userId)
  if (error) console.error('Error resetting daily completed:', error)
}

export async function saveDailyChallengePref(userId, dailyChallenge) {
  if (!userId) return
  const { error } = await supabase
    .from('user_stats')
    .update({ daily_challenge: dailyChallenge })
    .eq('user_id', userId)
  if (error) console.error('Error saving daily challenge preference:', error)
}

export async function saveGrammarStats(userId, grammarStats) {
  if (!userId) return
  const { error } = await supabase
    .from('user_stats')
    .update({ grammar_stats: grammarStats })
    .eq('user_id', userId)
  if (error) console.error('Error saving grammar stats:', error)
}

// Returns both word_koreans and word_progress for today's challenge
export async function getDailyChallenge(userId) {
  if (!userId) return { data: null, error: null }
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('daily_challenges')
    .select('word_koreans, word_progress')
    .eq('user_id', userId)
    .eq('challenge_date', today)
    .single()
  if (error) {
    if (error.code === 'PGRST116') return { data: null, error: null } // no challenge yet today
    console.error('Error getting daily challenge:', error)
  }
  return { data, error }
}
