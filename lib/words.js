import { supabase } from '@/lib/supabase'

// ── Word type classification ──────────────────────────────────────────────────
// Korean predicates (verbs + adjectives) end in 다 in dictionary form.
// Everything else (nouns, adverbs, expressions) is classified as 'noun'
// for grammar-game purposes.
export function classifyWordType(korean) {
  return korean.trimEnd().endsWith('다') ? 'verb' : 'noun'
}

const CACHE_KEY = 'words_cache_v2'   // bumped — adds 'type' field
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

    const tag = (w) => ({ ...w, type: classifyWordType(w.korean) })

    const topikIWords  = data.filter(w => w.level === 'topik-i').map(tag)
    const topikIIWords = data.filter(w => w.level === 'topik-ii').map(tag)
    const allWords     = data.map(tag)

    const result = { topikIWords, topikIIWords, allWords }
    saveCache(result)
    _promise = null  // reset so re-fetch works after cache expires
    return result
  })()
  return _promise
}
