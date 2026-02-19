// Standard 두벌식 (dubeolsik) Korean keyboard layout
export const KEY_MAP = {
  q:'ㅂ', w:'ㅈ', e:'ㄷ', r:'ㄱ', t:'ㅅ', y:'ㅛ', u:'ㅕ', i:'ㅑ', o:'ㅐ', p:'ㅔ',
  a:'ㅁ', s:'ㄴ', d:'ㅇ', f:'ㄹ', g:'ㅎ', h:'ㅗ', j:'ㅓ', k:'ㅏ', l:'ㅣ',
  z:'ㅋ', x:'ㅌ', c:'ㅊ', v:'ㅍ', b:'ㅠ', n:'ㅜ', m:'ㅡ',
  // Shift (tense consonants)
  Q:'ㅃ', W:'ㅉ', E:'ㄸ', R:'ㄲ', T:'ㅆ', O:'ㅒ', P:'ㅖ',
}

// Unicode syllable constants
const CHO  = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ']
const JUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ']
const JONG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ']

// Which consonants are valid as jongseong
const JONG_SET = new Set(JONG.filter(Boolean))

const COMPOUND_JONG = {
  'ㄱ+ㅅ':'ㄳ','ㄴ+ㅈ':'ㄵ','ㄴ+ㅎ':'ㄶ',
  'ㄹ+ㄱ':'ㄺ','ㄹ+ㅁ':'ㄻ','ㄹ+ㅂ':'ㄼ','ㄹ+ㅅ':'ㄽ','ㄹ+ㅌ':'ㄾ','ㄹ+ㅍ':'ㄿ','ㄹ+ㅎ':'ㅀ',
  'ㅂ+ㅅ':'ㅄ',
}
const SPLIT_JONG = {
  'ㄳ':['ㄱ','ㅅ'],'ㄵ':['ㄴ','ㅈ'],'ㄶ':['ㄴ','ㅎ'],
  'ㄺ':['ㄹ','ㄱ'],'ㄻ':['ㄹ','ㅁ'],'ㄼ':['ㄹ','ㅂ'],'ㄽ':['ㄹ','ㅅ'],'ㄾ':['ㄹ','ㅌ'],'ㄿ':['ㄹ','ㅍ'],'ㅀ':['ㄹ','ㅎ'],
  'ㅄ':['ㅂ','ㅅ'],
}
const COMPOUND_VOWEL = {
  'ㅗ+ㅏ':'ㅘ','ㅗ+ㅐ':'ㅙ','ㅗ+ㅣ':'ㅚ',
  'ㅜ+ㅓ':'ㅝ','ㅜ+ㅔ':'ㅞ','ㅜ+ㅣ':'ㅟ',
  'ㅡ+ㅣ':'ㅢ',
}
// Reverse compound vowel lookup (for backspace)
const SPLIT_VOWEL = Object.fromEntries(Object.entries(COMPOUND_VOWEL).map(([k,v]) => [v, k.split('+')[0]]))

function syllable(cho, jung, jong = '') {
  const ci = CHO.indexOf(cho), vi = JUNG.indexOf(jung), fi = JONG.indexOf(jong)
  if (ci === -1 || vi === -1 || fi === -1) return cho + jung + jong
  return String.fromCharCode(0xAC00 + ci * 21 * 28 + vi * 28 + fi)
}

export const EMPTY_STATE = { text: '', cho: null, jung: null, jong: null }

export function getFullText({ text, cho, jung, jong }) {
  if (!cho) return text
  if (!jung) return text + cho
  return text + syllable(cho, jung, jong || '')
}

export function addJamo(state, jamo) {
  const isVowel = JUNG.includes(jamo)
  const { text, cho, jung, jong } = state

  if (isVowel) {
    if (!cho) {
      // No current block → silent ㅇ + vowel
      return { text, cho: 'ㅇ', jung: jamo, jong: null }
    }
    if (!jung) {
      // Consonant waiting for vowel
      return { text, cho, jung: jamo, jong: null }
    }
    if (!jong) {
      // Try compound vowel
      const cv = COMPOUND_VOWEL[`${jung}+${jamo}`]
      if (cv) return { text, cho, jung: cv, jong: null }
      // Close current syllable, start new with ㅇ+vowel
      return { text: text + syllable(cho, jung), cho: 'ㅇ', jung: jamo, jong: null }
    }
    // Split jong: jong becomes next initial
    const sp = SPLIT_JONG[jong]
    if (sp) {
      return { text: text + syllable(cho, jung, sp[0]), cho: sp[1], jung: jamo, jong: null }
    }
    return { text: text + syllable(cho, jung), cho: jong, jung: jamo, jong: null }
  } else {
    // Consonant
    if (!cho) return { text, cho: jamo, jung: null, jong: null }
    if (!jung) {
      // Two consonants in a row
      return { text: text + cho, cho: jamo, jung: null, jong: null }
    }
    if (!jong) {
      // Try setting as jongseong
      if (JONG_SET.has(jamo)) return { text, cho, jung, jong: jamo }
      return { text: text + syllable(cho, jung), cho: jamo, jung: null, jong: null }
    }
    // Try compound jongseong
    const cj = COMPOUND_JONG[`${jong}+${jamo}`]
    if (cj) return { text, cho, jung, jong: cj }
    // Close syllable, start new
    return { text: text + syllable(cho, jung, jong), cho: jamo, jung: null, jong: null }
  }
}

export function backspace(state) {
  const { text, cho, jung, jong } = state
  if (jong) {
    const sp = SPLIT_JONG[jong]
    if (sp) return { text, cho, jung, jong: sp[0] }
    return { text, cho, jung, jong: null }
  }
  if (jung) {
    const base = SPLIT_VOWEL[jung]
    if (base) return { text, cho, jung: base, jong: null }
    return { text, cho, jung: null, jong: null }
  }
  if (cho) return { text, cho: null, jung: null, jong: null }
  if (text.length > 0) return { text: text.slice(0, -1), cho: null, jung: null, jong: null }
  return state
}
