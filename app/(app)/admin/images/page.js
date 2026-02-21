'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { ImageOff, Search, CheckCircle2, Trash2, RefreshCw } from 'lucide-react'

export default function AdminImagesPage() {
  const [words, setWords]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('all')
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState(new Set())   // Set of korean strings
  const [removed, setRemoved]   = useState(new Set())   // removed this session
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]       = useState(null)

  useEffect(() => {
    supabase
      .from('words')
      .select('korean, english, image, level')
      .order('id')
      .then(({ data, error: err }) => {
        if (err) { setError(err.message); setLoading(false); return }
        setWords(data || [])
        setLoading(false)
      })
  }, [])

  const filtered = useMemo(() => {
    let list = words
    if (filter === 'with')    list = list.filter(w => w.image && !removed.has(w.korean))
    if (filter === 'without') list = list.filter(w => !w.image || removed.has(w.korean))
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(w => w.korean.includes(q) || w.english.toLowerCase().includes(q))
    }
    return list
  }, [words, filter, search, removed])

  function toggleSelect(korean) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(korean) ? next.delete(korean) : next.add(korean)
      return next
    })
  }

  function selectAll() {
    // Select all visible words that have images and haven't been removed
    const selectable = filtered.filter(w => w.image && !removed.has(w.korean)).map(w => w.korean)
    setSelected(new Set(selectable))
  }

  function clearSelection() {
    setSelected(new Set())
  }

  async function submitRemove() {
    if (selected.size === 0) return
    setSubmitting(true)
    const koreans = [...selected]
    try {
      const res = await fetch('/api/admin/update-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ koreans }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Unknown error')
      setRemoved(prev => new Set([...prev, ...koreans]))
      setSelected(new Set())
    } catch (err) {
      alert(`Failed to remove images: ${err.message}`)
    }
    setSubmitting(false)
  }

  const withCount    = words.filter(w => w.image && !removed.has(w.korean)).length
  const withoutCount = words.filter(w => !w.image || removed.has(w.korean)).length

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-gray-400 text-sm animate-pulse">Loading words from Supabase…</div>
    </div>
  )

  if (error) return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-red-400 text-sm bg-red-900/20 border border-red-500/30 rounded-xl px-5 py-4">
        <p className="font-bold mb-1">Error loading words</p>
        <p className="opacity-80">{error}</p>
      </div>
    </div>
  )

  const selectableInView = filtered.filter(w => w.image && !removed.has(w.korean))
  const allVisibleSelected = selectableInView.length > 0 && selectableInView.every(w => selected.has(w.korean))

  return (
    <div className="flex-1 flex flex-col min-h-0 p-4 md:p-6">
      {/* Header */}
      <div className="mb-4 flex-shrink-0">
        <h1 className="text-2xl font-bold text-white mb-1">Image Review</h1>
        <p className="text-gray-400 text-sm">
          {words.length} total · <span className="text-green-400">{withCount} with images</span> · <span className="text-gray-500">{withoutCount} without</span>
          {removed.size > 0 && <span className="text-orange-400 ml-2">· {removed.size} removed this session</span>}
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-4 flex-shrink-0">
        {/* Filter tabs */}
        <div className="flex rounded-xl overflow-hidden border border-gray-700/60">
          {[
            { key: 'all',     label: `All (${words.length})` },
            { key: 'with',    label: `Has image (${withCount})` },
            { key: 'without', label: `No image (${withoutCount})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                filter === key ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-gray-800 border border-gray-700/60 rounded-xl px-3 py-2 flex-1 min-w-40">
          <Search size={14} className="text-gray-500 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search Korean or English…"
            className="bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none flex-1 min-w-0"
          />
        </div>

        {/* Select all / clear */}
        {selectableInView.length > 0 && (
          <button
            onClick={allVisibleSelected ? clearSelection : selectAll}
            className="px-4 py-2 rounded-xl bg-gray-800 border border-gray-700/60 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
          >
            {allVisibleSelected ? 'Deselect all' : `Select all (${selectableInView.length})`}
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500 text-sm">
            No words match the current filter.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 pb-24">
            {filtered.map(word => {
              const hasImage   = word.image && !removed.has(word.korean)
              const isSelected = selected.has(word.korean)
              const wasRemoved = removed.has(word.korean)
              return (
                <div
                  key={word.korean}
                  onClick={() => hasImage && toggleSelect(word.korean)}
                  className={`flex flex-col rounded-xl border overflow-hidden transition-all select-none ${
                    wasRemoved
                      ? 'border-orange-500/30 bg-orange-900/10 opacity-40'
                      : isSelected
                        ? 'border-red-500 bg-red-900/20 ring-2 ring-red-500/50 cursor-pointer'
                        : hasImage
                          ? 'border-gray-700/60 bg-gray-800/60 hover:border-gray-500 cursor-pointer'
                          : 'border-gray-800/40 bg-gray-800/30 opacity-40'
                  }`}
                >
                  {/* Image */}
                  <div className="relative aspect-square bg-gray-900/60 flex items-center justify-center overflow-hidden">
                    {hasImage ? (
                      <img src={word.image} alt={word.english} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <ImageOff size={24} className="text-gray-700" />
                    )}

                    {/* Selected checkmark */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-red-900/40 flex items-center justify-center">
                        <CheckCircle2 size={32} className="text-red-300" />
                      </div>
                    )}

                    {/* Removed badge */}
                    {wasRemoved && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                        <span className="text-orange-300 text-xs font-bold">REMOVED</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-2">
                    <p className="text-white font-bold text-sm truncate">{word.korean}</p>
                    <p className="text-gray-400 text-xs truncate">{word.english}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Sticky bottom bar — shown when something is selected */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-4 bg-gray-900/95 backdrop-blur-md border border-red-500/40 rounded-2xl shadow-2xl shadow-red-900/30 whitespace-nowrap">
          <p className="text-white font-semibold flex-1 md:flex-none">
            <span className="text-red-400 font-bold">{selected.size}</span> image{selected.size !== 1 ? 's' : ''} selected
          </p>
          <button
            onClick={clearSelection}
            className="text-gray-400 hover:text-white text-sm cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submitRemove}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors cursor-pointer shadow-lg"
          >
            {submitting
              ? <><RefreshCw size={14} className="animate-spin" />Removing…</>
              : <><Trash2 size={14} />Remove {selected.size} image{selected.size !== 1 ? 's' : ''}</>
            }
          </button>
        </div>
      )}
    </div>
  )
}
