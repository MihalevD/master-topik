import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Server-only: uses service role key (never exposed to browser)
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export async function POST(request) {
  if (!process.env.SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_KEY not set in .env.local' }, { status: 500 })
  }

  const { koreans } = await request.json()
  if (!Array.isArray(koreans) || koreans.length === 0) {
    return NextResponse.json({ error: 'koreans array is required' }, { status: 400 })
  }

  const { error } = await adminSupabase
    .from('words')
    .update({ image: null })
    .in('korean', koreans)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, removed: koreans.length })
}
