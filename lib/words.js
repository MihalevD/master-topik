import topikIFull from '@/data/topik-i-full.json'
export { ranks } from '@/lib/ranks'

export const topikIWords = topikIFull
export const topikIIWords = []
export const allWords = [...topikIWords, ...topikIIWords]
