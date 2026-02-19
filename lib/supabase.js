import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Rest of the file stays the same...
export async function saveWordProgress(wordKorean, attempts, correct, hintsUsed, examplesUsed) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('word_progress')
    .upsert({
      user_id: user.id,
      word_korean: wordKorean,
      attempts,
      correct,
      hints_used: hintsUsed,
      examples_used: examplesUsed,
      last_seen: new Date().toISOString()
    }, {
      onConflict: 'user_id,word_korean'
    })
    .select()

  if (error) console.error('Error saving word progress:', error)
  return { data, error }
}

export async function getWordProgress() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: null }

  const { data, error } = await supabase
    .from('word_progress')
    .select('*')
    .eq('user_id', user.id)

  if (error) console.error('Error getting word progress:', error)
  return { data, error }
}

export async function saveUserStats(totalCompleted, currentScore, streak, lastLogin, dailyCorrect = 0) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('user_stats')
    .upsert({
      user_id: user.id,
      total_completed: totalCompleted,
      current_score: currentScore,
      streak,
      last_login: lastLogin,
      daily_correct: dailyCorrect
    }, {
      onConflict: 'user_id'
    })
    .select()

  if (error) console.error('Error saving user stats:', error)
  return { data, error }
}

export async function getUserStats() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: null }

  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return { data: null, error: null } // no row = new user
    console.error('Error getting user stats:', error)
  }

  return { data, error }
}

export async function saveDailyChallenge(wordKoreans) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('daily_challenges')
    .upsert({ user_id: user.id, challenge_date: today, word_koreans: wordKoreans }, {
      onConflict: 'user_id,challenge_date'
    })
    .select()

  if (error) console.error('Error saving daily challenge:', error)
  return { data, error }
}

export async function getDailyChallenge() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: null }

  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('daily_challenges')
    .select('word_koreans')
    .eq('user_id', user.id)
    .eq('challenge_date', today)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return { data: null, error: null } // no challenge yet today
    console.error('Error getting daily challenge:', error)
  }
  return { data, error }
}