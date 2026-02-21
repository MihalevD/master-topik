import { supabase } from '@/lib/supabase'

// ── Word type classification (fallback for words without a DB type) ───────────
// Once the enrich-types.mjs script has run, every word in the DB will have an
// authoritative `type` (verb | adjective | noun | adverb | expression).
// This function is only used when the DB field is null/missing.
export function classifyWordType(korean) {
  return korean.trimEnd().endsWith('다') ? 'verb' : 'noun'
}

const CACHE_KEY = 'words_cache_v3'          // bumped — adds category field
const CACHE_TTL = 24 * 60 * 60 * 1000      // 24 hours

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
      .select('korean, english, romanization, sentences, image, level, type, category')
      .order('id')

    if (error) throw error

    // Prefer the DB type; fall back to the heuristic for words not yet enriched
    const tag = (w) => ({
      ...w,
      type:     w.type     || classifyWordType(w.korean),
      category: w.category || 'other',
    })

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
