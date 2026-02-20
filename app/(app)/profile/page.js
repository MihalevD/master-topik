'use client'

import { useApp } from '@/app/providers'
import ProfileView from '@/components/ProfileView'

export default function ProfilePage() {
  const { totalCompleted, streak, getHardWords, getAccuracyData } = useApp()
  return (
    <ProfileView
      totalCompleted={totalCompleted}
      streak={streak}
      hardWords={getHardWords()}
      accuracy={getAccuracyData()}
    />
  )
}
