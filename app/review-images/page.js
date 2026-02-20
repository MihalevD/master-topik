'use client'

import { useState, useMemo } from 'react'
import words from '@/data/topik-i-full.json'

const PAGE_SIZE = 60

export default function ReviewImagesPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // all | with | without
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    let list = words
    if (filter === 'with') list = list.filter(w => w.image)
    if (filter === 'without') list = list.filter(w => !w.image)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(w =>
        w.korean.includes(q) ||
        w.english.toLowerCase().includes(q) ||
        (w.romanization || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [search, filter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const withImages = words.filter(w => w.image).length

  function handleSearch(e) {
    setSearch(e.target.value)
    setPage(1)
  }

  function handleFilter(f) {
    setFilter(f)
    setPage(1)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#111', color: '#fff', fontFamily: 'sans-serif', padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Image Review</h1>
        <p style={{ color: '#888', fontSize: 14 }}>
          {withImages} / {words.length} words have images &nbsp;·&nbsp; showing {filtered.length} results
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={search}
          onChange={handleSearch}
          placeholder="Search Korean, English, romanization..."
          style={{
            flex: 1, minWidth: 220, padding: '8px 14px', borderRadius: 8,
            background: '#222', border: '1px solid #444', color: '#fff', fontSize: 14
          }}
        />
        {['all', 'with', 'without'].map(f => (
          <button
            key={f}
            onClick={() => handleFilter(f)}
            style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              border: '1px solid',
              borderColor: filter === f ? '#a855f7' : '#444',
              background: filter === f ? '#a855f720' : '#222',
              color: filter === f ? '#c084fc' : '#888',
            }}
          >
            {f === 'all' ? `All (${words.length})` : f === 'with' ? `With image (${withImages})` : `No image (${words.length - withImages})`}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 12,
        marginBottom: 24
      }}>
        {paginated.map((word, i) => (
          <div key={word.korean + i} style={{
            background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 12,
            overflow: 'hidden', display: 'flex', flexDirection: 'column'
          }}>
            {word.image ? (
              <img
                src={word.image}
                alt={word.english}
                style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }}
                loading="lazy"
              />
            ) : (
              <div style={{
                width: '100%', height: 110, background: '#2a2a2a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#444', fontSize: 12
              }}>
                no image
              </div>
            )}
            <div style={{ padding: '8px 10px' }}>
              <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 2, lineHeight: 1.2 }}>{word.korean}</p>
              <p style={{ fontSize: 11, color: '#a78bfa', marginBottom: 2 }}>{word.romanization}</p>
              <p style={{ fontSize: 11, color: '#888', lineHeight: 1.3 }}>{word.english}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: '6px 14px', borderRadius: 8, background: '#222', border: '1px solid #444',
              color: page === 1 ? '#444' : '#fff', cursor: page === 1 ? 'default' : 'pointer', fontSize: 13
            }}
          >
            ← Prev
          </button>
          <span style={{ color: '#888', fontSize: 13 }}>Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              padding: '6px 14px', borderRadius: 8, background: '#222', border: '1px solid #444',
              color: page === totalPages ? '#444' : '#fff', cursor: page === totalPages ? 'default' : 'pointer', fontSize: 13
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
