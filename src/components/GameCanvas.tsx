import { useCallback, useState } from "react";
import { useGameLoop } from "../hooks/useGameLoop";
import { getPlanetPosition, type Coordinate, type GameState } from "../types";
import Planet from "./Planet";
import DebrisComponent from "./Debris";
import Cursor from "./Cursor";
import Explosion from "./Explosion"
// import FireworksParticles from "./Particles";
import { Minus, Plus } from "lucide-react";
import { createGame, proceedRound } from "../game";


type ExplosionParticle = {
  id: string
  dx: number
  dy: number
  size: number
  color: string
  delay: number
}

type ExplosionEvent = {
  id: string
  position: Coordinate
  color: string
  particles: ExplosionParticle[]
}

export default function GameCanvas({
  state,
  setState,
  onTick,
  progress,
  explosions,
  removeExplosion,
  round,
  isRoundOver,
  isWin
}: {
  state: GameState;
  setState: React.Dispatch<GameState>;
  onTick: (deltaTime: number) => void;
  progress: number;
  explosions: ExplosionEvent[];
  removeExplosion: (id: string) => void;
  round: number;
  isRoundOver: boolean;
  isWin: boolean;
}) {
  const [zoom, setZoom] = useState(1);

  useGameLoop(onTick);

  const { planets, debris, remainingTime } = state;
  const TOTAL_TIME = 30000;
  const timePct = remainingTime / TOTAL_TIME;
  const timeBarColor = timePct > 0.5 ? "#4ade80" : timePct > 0.25 ? "#facc15" : "#f87171";

  const nextRound = () => {
    setState(proceedRound(state))
  };

  const restartGame = () => {
    setState(createGame())
  }

  return (
    <>
      <Cursor setState={setState} state={state} />

      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundImage: "url('/assets/space-background.gif')",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center center",
          backgroundColor: "transparent",
          imageRendering: "pixelated",
          overflow: "hidden",
          transform: `scale(${zoom})`,
          transformOrigin: "center center",
        }}
      >
        {planets.map((planet) => (
          <Planet key={planet.id} planet={planet} rotation={planet.rotation} position={getPlanetPosition(planet)} />
        ))}
    
        {debris.map((d) => (
          <DebrisComponent position={d.position} rotation={d.rotation} key={d.id} debris={d} />
        ))}

        {explosions.map((explosion) => (
          <Explosion
            key={explosion.id}
            position={explosion.position}
            particles={explosion.particles}
            onDone={() => removeExplosion(explosion.id)}
          />
        ))}
      </div>

      <div className="fixed top-0 left-0 w-full h-2 bg-white/10">
        <div
          style={{
            width: `${timePct * 100}%`,
            backgroundColor: timeBarColor,
          }}
          className="h-full"
        />
      </div>
      <div className="fixed top-2 left-1/2 -translate-x-1/2 text-white/60 text-xs tabular-nums">
        {Math.round(remainingTime / 100) / 10}s
      </div>

      <div className="fixed top-8 left-6 px-4 py-2 bg-white/10 rounded-lg text-left">
        Round {round}: {progress}%
        <br />
        0 Coins
      </div>

      <div className="fixed flex top-6 right-6 gap-2">
        <button
          className="flex bg-white/20 w-9 h-9 rounded-lg items-center justify-center"
          onClick={() => setZoom(z => Math.max(z-0.25, 1))}
        >
          <Minus size={16} />
        </button>
        <button
          className="flex bg-white/20 w-9 h-9 rounded-lg items-center justify-center"
          onClick={() => setZoom(z => Math.min(z+0.25, 3))}
        >
          <Plus size={16} />
        </button>
      </div>

      {isRoundOver && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
          <div className="text-center">
            <p className="text-white text-5xl font-bold mb-4">
              {isWin ? `Round ${round} Clear!` : "Time's Up!"}
            </p>
            {isWin ? (
              <button
                onClick={nextRound}
                className="px-6 py-3 mt-6 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
              >
                Next Round
              </button>
            ) : (
              <button
                onClick={restartGame}
                className="px-6 py-3 mt-6 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
              >
              Restart
            </button>
            )}
            
          </div>
        </div>
      )}
    </>
  );
}
