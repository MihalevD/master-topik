'use client'

import { useApp } from '@/app/providers'
import DictionaryView from '@/components/DictionaryView'
import { allWords } from '@/lib/words'

export default function DictionaryPage() {
  const { wordStats } = useApp()
  return <DictionaryView wordStats={wordStats} allWords={allWords} />
}
