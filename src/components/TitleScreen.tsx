import { Play } from 'lucide-react'

export default function TitleScreen({ onStart }: { onStart: () => void }) {
  return (
    <div 
      className="w-screen h-screen flex flex-col items-center justify-center text-white overflow-hidden relative"
      style={{
        backgroundImage: 'url(/assets/space-background.gif)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* Content */}
      <div className="relative z-10 text-center content-center justify-center">
        <h1 className="text-8xl font-black mb-2 bg-clip-text text-transparent">
          SPACEMORPH
        </h1>

        <p className="text-xl fomt-semibold max-w-2xl mx-auto leading-relaxed">
          Destroy all planets by clicking smashing debris into them.
        </p>

        <div className="mb-16 mt-4 bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-8 max-w-2xl">
          <h2 className="text-2xl font-bold mb-6 text-cyan-400">How to Play</h2>
          <ul className="text-left space-y-3">
            <li className="flex items-center gap-3">
              <span className="text-slate-200">Click planets to damage them and smash them into debris</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-slate-200">Smash debris into planets to cause more destruction</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-slate-200">Destroy the solar system in each round before the time runs out</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-slate-200">Upgrade every 3 rounds, and there's a boss every 5!</span>
            </li>
          </ul>
        </div>

        <button
          onClick={onStart}
          className="flex mx-auto px-6 py-3 bg-indigo-800 hover:bg-indigo-600 text-white rounded-lg transition-colors items-center gap-2"
        >
          <Play size={28} />
          Start Game
        </button>
      </div>
    </div>
  )
}
