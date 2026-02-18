/**
 * Revised Romanization of Korean (RRK) — simplified converter.
 * Converts each syllable block and joins with hyphens.
 * Handles basic resyllabification (final → next initial when next starts with ㅇ).
 */

const INITIAL = ['g','kk','n','d','tt','r','m','b','pp','s','ss','','j','jj','ch','k','t','p','h']
const VOWEL   = ['a','ae','ya','yae','eo','e','yeo','ye','o','wa','wae','oe','yo','u','wo','we','wi','yu','eu','ui','i']
const FINAL   = ['','k','k','k','n','n','n','t','l','k','m','p','l','l','p','l','m','p','p','t','t','ng','t','t','k','t','p','t']
const FINAL_TO_INITIAL = ['','g','kk','g','n','n','n','d','r','g','m','b','r','r','b','r','m','b','b','s','ss','ng','j','ch','k','t','p','h']

function decompose(code) {
  const offset = code - 0xAC00
  return {
    ini: Math.floor(offset / 28 / 21),
    vow: Math.floor(offset / 28) % 21,
    fin: offset % 28
  }
}

export function romanize(text) {
  const syllables = []
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    if (code >= 0xAC00 && code <= 0xD7A3) {
      syllables.push(decompose(code))
    } else {
      syllables.push({ char: text[i] })
    }
  }

  const parts = []
  for (let i = 0; i < syllables.length; i++) {
    const s = syllables[i]
    if (s.char !== undefined) {
      parts.push(s.char)
      continue
    }

    const next = syllables[i + 1]
    let ini = INITIAL[s.ini]
    let vow = VOWEL[s.vow]
    let fin = FINAL[s.fin]

    // Resyllabification: if this syllable has a final and next starts with ㅇ (null initial, index 11)
    if (s.fin > 0 && next && !next.char && next.ini === 11) {
      fin = ''
      syllables[i + 1] = { ...next, ini: -1, iniOverride: FINAL_TO_INITIAL[s.fin] }
    }

    if (s.iniOverride !== undefined) {
      ini = s.iniOverride
    }

    parts.push(ini + vow + fin)
  }

  return parts.filter(Boolean).join('-')
}
