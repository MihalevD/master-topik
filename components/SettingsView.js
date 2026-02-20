'use client'

import { Settings as SettingsIcon } from 'lucide-react'
import { DAILY_CHALLENGE_OPTIONS } from '@/lib/constants'

export default function SettingsView({
  dailyChallenge, setDailyChallenge,
  reviewMode, setReviewMode,
  reverseMode, setReverseMode,
  setCurrentView, wordsGeneratedRef, generateDailyWords
}) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="md:hidden p-4 border-b border-gray-800">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <button
            onClick={() => setCurrentView('practice')}
            className="px-4 py-2 rounded-lg bg-gray-800 text-white shadow hover:bg-gray-700 cursor-pointer"
          >
            ← Back
          </button>
          <h2 className="text-2xl font-bold text-white">
            <SettingsIcon className="inline mr-2" />
            Settings
          </h2>
          <div className="w-24"></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-800 rounded-xl shadow-lg p-6 space-y-6">
            <div>
              <label className="block text-sm font-bold mb-2 text-white">
                Daily Challenge Size
              </label>
              <select
                value={dailyChallenge}
                onChange={(e) => setDailyChallenge(Number(e.target.value))}
                className="w-full p-3 rounded-lg border-2 bg-gray-700 text-white border-gray-600 cursor-pointer"
              >
                {DAILY_CHALLENGE_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-white">Review Mode</p>
                <p className="text-sm text-gray-400">Practice only difficult words (&lt;80% accuracy)</p>
              </div>
              <button
                onClick={() => {
                  setReviewMode(!reviewMode)
                  setCurrentView('practice')
                  if (!reviewMode) {
                    wordsGeneratedRef.current = false
                    generateDailyWords()
                  }
                }}
                className={`px-4 py-2 rounded-lg ${reviewMode ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-400'} cursor-pointer`}
              >
                {reviewMode ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-white">Reverse Mode</p>
                <p className="text-sm text-gray-400">See Korean → type the English meaning</p>
              </div>
              <button
                onClick={() => {
                  setReverseMode(!reverseMode)
                  setCurrentView('practice')
                }}
                className={`px-4 py-2 rounded-lg ${reverseMode ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400'} cursor-pointer`}
              >
                {reverseMode ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
