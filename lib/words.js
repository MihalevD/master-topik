import { supabase } from '@/lib/supabase'

const CACHE_KEY = 'words_cache_v1'
const CACHE_TTL = 24 * 60 * 60 * 1000  // 24 hours

function loadCache() {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { ts, data } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL) { localStorage.removeItem(CACHE_KEY); return null }
    return data
  } catch { return null }
}

function saveCache(data) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data })) } catch {}
}

let _promise = null

export function getWords() {
  if (_promise) return _promise
  _promise = (async () => {
    const cached = loadCache()
    if (cached) return cached

    const { data, error } = await supabase
      .from('words')
      .select('korean, english, romanization, sentences, image, level')
      .order('id')

    if (error) throw error

    const topikIWords  = data.filter(w => w.level === 'topik-i')
    const topikIIWords = data.filter(w => w.level === 'topik-ii')
    const allWords     = data

    const result = { topikIWords, topikIIWords, allWords }
    saveCache(result)
    _promise = null  // reset so re-fetch works after cache expires
    return result
  })()
  return _promise
}
