import topikIFull from '@/data/topik-i-full.json'

export const topikIWords = topikIFull
export const topikIIWords = []
export const allWords = [...topikIWords, ...topikIIWords]

export const ranks = [
  { name: '초보자',      min: 0,    max: 49,       color: 'gray',   level: 'TOPIK I' },
  { name: '학습자',      min: 50,   max: 149,      color: 'blue',   level: 'TOPIK I' },
  { name: '숙련자',      min: 150,  max: 299,      color: 'cyan',   level: 'TOPIK I' },
  { name: '고급자',      min: 300,  max: 499,      color: 'green',  level: 'TOPIK I→II' },
  { name: '전문가',      min: 500,  max: 999,      color: 'purple', level: 'TOPIK II' },
  { name: '마스터',      min: 1000, max: 1999,     color: 'pink',   level: 'TOPIK II' },
  { name: '그랜드마스터', min: 2000, max: 2999,     color: 'orange', level: 'TOPIK II' },
  { name: '전설',        min: 3000, max: Infinity, color: 'yellow', level: 'Complete' },
]
