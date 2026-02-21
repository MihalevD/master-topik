'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/app/providers'
import DictionaryView from '@/components/DictionaryView'
import { getWords } from '@/lib/words'

export default function DictionaryPage() {
  const { wordStats } = useApp()
  const [allWords, setAllWords] = useState([])

  useEffect(() => {
    getWords().then(({ allWords }) => setAllWords(allWords))
  }, [])

  return <DictionaryView wordStats={wordStats} allWords={allWords} />
}
