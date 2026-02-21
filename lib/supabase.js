import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Batch-saves all pending word stats in one RPC call (JSONB merge on user_stats)
export async function saveWordProgress(userId, wordStats) {
  if (!userId || !wordStats || Object.keys(wordStats).length === 0) return
  const patch = {}
  for (const [korean, s] of Object.entries(wordStats)) {
    patch[korean] = {
      a: s.attempts, c: s.correct, h: s.hintsUsed, e: s.examplesUsed,
      t:  Math.floor(s.lastSeen   / 1000),
      n:  s.nextReview ? Math.floor(s.nextReview / 1000) : 0,
      iv: s.interval || 0,
    }
  }
  const { error } = await supabase.rpc('merge_word_progress', { p_user_id: userId, p_patch: patch })
  if (error) console.error('Error saving word progress:', error)
}

export async function saveUserStats(userId, totalCompleted, currentScore, streak, lastLogin, dailyCorrect = 0, totalScore = 0) {
  if (!userId) return null
  const { data, error } = await supabase
    .from('user_stats')
    .upsert({
      user_id: userId,
      total_completed: totalCompleted,
      current_score: currentScore,
      streak,
      last_login: lastLogin,
      daily_correct: dailyCorrect,
      total_score: totalScore,
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

export async function saveDailyChallenge(userId, wordKoreans) {
  if (!userId) return null
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('daily_challenges')
    .upsert({ user_id: userId, challenge_date: today, word_koreans: wordKoreans }, {
      onConflict: 'user_id,challenge_date'
    })
    .select()
  if (error) console.error('Error saving daily challenge:', error)
  return { data, error }
}

export async function saveGrammarStats(userId, grammarStats) {
  if (!userId) return
  const { error } = await supabase
    .from('user_stats')
    .update({ grammar_stats: grammarStats })
    .eq('user_id', userId)
  if (error) console.error('Error saving grammar stats:', error)
}

export async function getDailyChallenge(userId) {
  if (!userId) return { data: null, error: null }
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('daily_challenges')
    .select('word_koreans')
    .eq('user_id', userId)
    .eq('challenge_date', today)
    .single()
  if (error) {
    if (error.code === 'PGRST116') return { data: null, error: null } // no challenge yet today
    console.error('Error getting daily challenge:', error)
  }
  return { data, error }
}
