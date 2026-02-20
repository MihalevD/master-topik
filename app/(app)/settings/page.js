'use client'

import { useApp } from '@/app/providers'
import SettingsView from '@/components/SettingsView'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const router = useRouter()
  const {
    dailyChallenge, setDailyChallenge,
    reviewMode, setReviewMode,
    reverseMode, setReverseMode,
    wordsGeneratedRef, generateDailyWords,
  } = useApp()

  return (
    <SettingsView
      dailyChallenge={dailyChallenge}
      setDailyChallenge={setDailyChallenge}
      reviewMode={reviewMode}
      setReviewMode={setReviewMode}
      reverseMode={reverseMode}
      setReverseMode={setReverseMode}
      setCurrentView={(view) => router.push(view === 'practice' ? '/practice' : `/${view}`)}
      wordsGeneratedRef={wordsGeneratedRef}
      generateDailyWords={generateDailyWords}
    />
  )
}
