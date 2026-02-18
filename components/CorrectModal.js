'use client'

export default function CorrectModal({ word, points, onNext }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-5 md:p-8 max-w-md w-full border-2 border-green-500">
        <div className="text-center mb-4 md:mb-6">
          <div className="text-5xl md:text-6xl mb-2">✓</div>
          <p className="text-xl md:text-2xl font-bold text-green-400">Correct!</p>
          <p className="text-2xl md:text-4xl font-bold text-white mt-2">{word.korean}</p>
          <p className="text-gray-400 mt-1 text-sm md:text-base">{word.english}</p>
          <p className="text-green-300 mt-1 text-sm md:text-base">+{points} points</p>
        </div>
        <div className="bg-gray-700 rounded-xl p-3 md:p-4 mb-4 md:mb-6">
          <p className="text-xs text-gray-400 mb-2">Example Sentence</p>
          <p className="text-base md:text-lg font-bold text-white mb-1">{word.sentences[0]}</p>
          <p className="text-gray-300 italic text-xs md:text-sm">{word.sentences[1]}</p>
        </div>
        <button
          onClick={onNext}
          className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 md:py-4 rounded-xl font-bold text-lg md:text-xl hover:opacity-90 transition-opacity cursor-pointer"
        >
          Next Word →
        </button>
      </div>
    </div>
  )
}
