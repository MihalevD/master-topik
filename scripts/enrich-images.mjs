/**
 * Enrich topik-i-full.json with Pixabay image URLs.
 *
 * Usage:
 *   PIXABAY_KEY=your_api_key node scripts/enrich-images.mjs
 *
 * - Only processes words that are missing an `image` field
 * - Saves progress to the JSON every 50 words (safe to re-run after interruption)
 * - 700ms delay between requests (~85 req/min, under Pixabay's 100/min limit)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_PATH = path.join(__dirname, '..', 'data', 'topik-i-full.json')
const DELAY_MS = 700
const SAVE_EVERY = 50

const API_KEY = process.env.PIXABAY_KEY
if (!API_KEY) {
  console.error('Error: PIXABAY_KEY environment variable is not set.')
  console.error('Get a free key at https://pixabay.com/api/docs/ then run:')
  console.error('  PIXABAY_KEY=your_key node scripts/enrich-images.mjs')
  process.exit(1)
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Takes the first English term before any comma — best search term
function getSearchTerm(english) {
  return english.split(',')[0].trim()
}

async function fetchPixabayImage(query) {
  const url = new URL('https://pixabay.com/api/')
  url.searchParams.set('key', API_KEY)
  url.searchParams.set('q', query)
  url.searchParams.set('image_type', 'photo')
  url.searchParams.set('safesearch', 'true')
  url.searchParams.set('per_page', '3')
  url.searchParams.set('lang', 'en')

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Pixabay HTTP ${res.status}`)
  const data = await res.json()
  if (data.hits && data.hits.length > 0) {
    return data.hits[0].webformatURL
  }
  return null
}

async function main() {
  const words = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))

  const missing = words.filter(w => !w.image)
  const total = missing.length
  console.log(`Found ${total} words without images (${words.length - total} already have images)`)

  let enriched = 0
  let skipped = 0
  let processed = 0

  for (const word of words) {
    if (word.image) continue

    const query = getSearchTerm(word.english)
    try {
      const imageUrl = await fetchPixabayImage(query)
      if (imageUrl) {
        word.image = imageUrl
        enriched++
      } else {
        skipped++
        console.log(`  [no result] ${word.korean} (${query})`)
      }
    } catch (err) {
      skipped++
      console.error(`  [error] ${word.korean} (${query}): ${err.message}`)
    }

    processed++
    if (processed % 10 === 0) {
      process.stdout.write(`\r${processed}/${total} processed — ${enriched} enriched, ${skipped} skipped`)
    }

    // Save progress periodically
    if (processed % SAVE_EVERY === 0) {
      fs.writeFileSync(DATA_PATH, JSON.stringify(words, null, 2))
      process.stdout.write(` [saved]\n`)
    }

    await sleep(DELAY_MS)
  }

  // Final save
  fs.writeFileSync(DATA_PATH, JSON.stringify(words, null, 2))
  console.log(`\n\nDone! ${enriched} images added, ${skipped} words had no results.`)
  console.log(`Final: ${words.filter(w => w.image).length}/${words.length} words have images.`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
