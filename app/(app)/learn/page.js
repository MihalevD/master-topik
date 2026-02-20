'use client'

import { useState } from 'react'
import { useApp } from '@/app/providers'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { allWords } from '@/lib/words'

const LearnView   = dynamic(() => import('@/components/LearnView'))
const GrammarGame = dynamic(() => import('@/components/GrammarGame'))

export default function LearnPage() {
  const router = useRouter()
  const { wordStats } = useApp()
  const [grammarCategories, setGrammarCategories] = useState(null)
  const [showGrammar, setShowGrammar] = useState(false)

  if (showGrammar) {
    return (
      <GrammarGame
        wordStats={wordStats}
        allWords={allWords}
        onClose={() => setShowGrammar(false)}
        selectedCategories={grammarCategories}
      />
    )
  }

  return (
    <LearnView
      setCurrentView={(view) => router.push(view === 'practice' ? '/practice' : `/${view}`)}
      onStartGame={(cats) => {
        setGrammarCategories(cats)
        setShowGrammar(true)
      }}
    />
  )
}
