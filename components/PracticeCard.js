'use client'

import { Eye, EyeOff, BookOpen, Brain } from 'lucide-react'

export default function PracticeCard({
  word, input, setInput, feedback, setFeedback,
  showHint, setShowHint, showExample, setShowExample,
  handleSubmit, handleNextWord, currentWordDifficulty
}) {
  return (
    <div className="bg-gray-800 rounded-2xl shadow-2xl p-4 md:p-8">
      {/* Difficulty Badge */}
      <div className="flex justify-center mb-4 md:mb-6">
        <span className={`px-3 py-1 rounded-full text-xs md:text-sm font-bold ${
          currentWordDifficulty === 'Hard' ? 'bg-red-900 text-red-300' :
          currentWordDifficulty === 'Medium' ? 'bg-yellow-900 text-yellow-300' :
          currentWordDifficulty === 'Easy' ? 'bg-green-900 text-green-300' :
          'bg-blue-900 text-blue-300'
        }`}>
          <Brain className="inline mr-1" size={12} />
          {currentWordDifficulty}
        </span>
      </div>

      {/* Question */}
      <div className="text-center mb-6 md:mb-8">
        <p className="text-xs md:text-sm text-gray-400 mb-2 md:mb-3">Translate to Korean</p>
        <h2 className="text-3xl md:text-6xl font-bold text-white mb-3 md:mb-4">
          {word.english}
        </h2>
        <p className={`text-base md:text-xl italic transition-all duration-300 ${
          showExample ? 'text-gray-400 blur-none' : 'text-gray-600 blur-md select-none'
        }`}>
          ({word.romanization})
        </p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="mb-4 md:mb-6">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type here..."
          className={`w-full text-2xl md:text-4xl text-center p-3 md:p-4 border-4 rounded-xl mb-3 md:mb-4 transition-all bg-gray-700 text-white ${
            feedback === 'wrong'
              ? 'border-red-400 bg-red-900 animate-shake'
              : 'border-purple-500 focus:border-purple-400 focus:outline-none'
          }`}
          autoFocus
        />

        {feedback === 'wrong' ? (
          <div className="flex gap-2 md:gap-3">
            <button
              type="button"
              onClick={() => { setFeedback(''); setInput(''); setShowHint(false) }}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 md:py-4 rounded-xl font-bold text-base md:text-xl hover:opacity-90 transition-opacity shadow-lg cursor-pointer"
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={handleNextWord}
              className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white py-3 md:py-4 rounded-xl font-bold text-base md:text-xl hover:opacity-90 transition-opacity shadow-lg cursor-pointer"
            >
              Skip →
            </button>
          </div>
        ) : (
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 md:py-4 rounded-xl font-bold text-base md:text-xl hover:opacity-90 transition-opacity shadow-lg cursor-pointer"
          >
            Submit Answer
          </button>
        )}
      </form>

      {/* Wrong Feedback */}
      {feedback === 'wrong' && (
        <div className="p-3 md:p-4 bg-red-900 text-red-200 rounded-xl text-center font-bold border border-red-500 mb-3 md:mb-4 text-sm md:text-base">
          ✗ Wrong! Try again or skip
        </div>
      )}

      {/* Hint Buttons */}
      <div className="flex gap-2 md:gap-3 justify-center mt-4 md:mt-6">
        <button
          onClick={() => { if (!showHint) setShowHint(true) }}
          disabled={showHint}
          className={`flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 rounded-lg transition-colors text-sm md:text-lg font-bold ${
            showHint
              ? 'bg-yellow-700 text-yellow-300 cursor-not-allowed'
              : 'bg-yellow-900 hover:bg-yellow-800 text-yellow-200 cursor-pointer'
          }`}
        >
          {showHint ? <EyeOff size={16} /> : <Eye size={16} />}
          {showHint ? word.korean : 'Show Answer (-5)'}
        </button>

        <button
          onClick={() => setShowExample(!showExample)}
          className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 rounded-lg transition-colors bg-blue-900 hover:bg-blue-800 text-blue-200 cursor-pointer text-sm md:text-base"
        >
          <BookOpen size={16} />
          {showExample ? 'Hide' : 'Show'} Romanization (-3)
        </button>
      </div>
    </div>
  )
}
