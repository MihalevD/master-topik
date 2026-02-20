'use client'

import AlphabetView from '@/components/AlphabetView'
import { useRouter } from 'next/navigation'

export default function AlphabetPage() {
  const router = useRouter()
  return <AlphabetView setCurrentView={(view) => router.push(`/${view}`)} />
}
