import { useState, useEffect, useRef } from "react";
import { useGameLoop } from "../hooks/useGameLoop";
import { getPlanetPosition, type BossPhase, type ExplosionEvent, type GameState } from "../types";
import Planet from "./Planet";
import DebrisComponent from "./Debris";
import Cursor from "./Cursor";
import Explosion from "./Explosion"
// import FireworksParticles from "./Particles";
import { Minus, Plus } from "lucide-react";
import { createGame, proceedRound, processUpgrade, upgrades } from "../game";



export default function GameCanvas({
  state,
  setState,
  onTick,
  progress,
  explosions,
  removeExplosion,
  addExplosion,
  round,
  isRoundOver,
  isWin,
  bossPhase,
}: {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  onTick: (deltaTime: number) => void;
  progress: number;
  explosions: ExplosionEvent[];
  removeExplosion: (id: string) => void;
  addExplosion: (e: ExplosionEvent) => void;
  round: number;
  isRoundOver: boolean;
  isWin: boolean;
  bossPhase: BossPhase;
}) {
  const [zoom, setZoom] = useState(1);
  const [openUpgrades, setOpenUpgrades] = useState(false);
  const showUpgradesThisRound = round % 3 === 0;

  const [shake, setShake] = useState({ x: 0, y: 0 });
  const prevExplosionsRef = useRef(0);

  useGameLoop(onTick);

  const { planets, debris, remainingTime } = state;
  const timePct = remainingTime / state.timeLimit;
  const timeBarColor = timePct > 0.5 ? "#4ade80" : timePct > 0.25 ? "#facc15" : "#f87171";

  const nextRound = () => {
    setState(proceedRound(state));
  };

  const restartGame = () => {
    setState(createGame());
  };
  
  useEffect(() => {
  const prev = prevExplosionsRef.current;
  const newCount = Math.max(0, explosions.length - prev);
  prevExplosionsRef.current = explosions.length;
  if (newCount === 0) return;

  const BASE_MAG = 10; // px per explosion unit
  const magnitude = Math.min(28, BASE_MAG * newCount);
  const DURATION_MS = 450;
  const start = performance.now();
  let rafId = 0;

  const step = (t: number) => {
    const elapsed = t - start;
    const p = Math.min(1, elapsed / DURATION_MS);
    const damper = 1 - p;
    const x = (Math.random() * 2 - 1) * magnitude * damper;
    const y = (Math.random() * 2 - 1) * magnitude * damper;
    setShake({ x, y });
    if (p < 1) rafId = requestAnimationFrame(step);
    else setShake({ x: 0, y: 0 });
  };

  rafId = requestAnimationFrame(step);
  return () => cancelAnimationFrame(rafId);
}, [explosions.length]);
  
  return (
    <>
      <Cursor setState={setState} state={state} addExplosion={addExplosion} />

      <div
        style={{
          position: "fixed",
          inset: 0,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url('/assets/space-background.gif')",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center center",
            transformOrigin: "center center",
            pointerEvents: "none",
            imageRendering: "pixelated",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            transform: `translate(${shake.x}px, ${shake.y}px) scale(${zoom})`,
            transformOrigin: "center center",
          }}
        >
          {planets.map((planet) => (
            <Planet
              key={planet.id}
              planet={planet}
              rotation={planet.rotation}
              position={getPlanetPosition(planet)}
            />
          ))}

          {debris.map((d) => (
            <DebrisComponent
              position={d.position}
              rotation={d.rotation}
              key={d.id}
              debris={d}
            />
          ))}

          {explosions.map((explosion) => (
            <Explosion
              dimensions={explosion.dimensions}
              key={explosion.id}
              position={explosion.position}
              particles={[]}
              gifSrc={explosion.gifSrc}
              onDone={() => removeExplosion(explosion.id)}
            />
          ))}
        </div>
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

      <div className="fixed top-8 left-6 px-4 py-2 w-36 bg-white/10 rounded-lg text-center">
        Round {round}: {progress}%
      </div>

      <div className="fixed top-20 left-6 w-36 px-4 py-2 bg-white/10 border border-transparent rounded-lg text-sm transition-colors">
        {state.isAttracting ? "Attracting" : "Z to Attract"}
      </div>

      <div className="fixed top-32 left-6 w-36">
        {state.hasBomb ? (
          <div className="px-4 py-2 bg-orange-500/30 border border-orange-400/60 rounded-lg text-orange-300 text-sm font-semibold text-center">
            Bomb Armed!
          </div>
        ) : state.bombCooldown > 0 ? (
          <div className="px-4 py-2 bg-white/10 rounded-lg">
            <div className="text-white/50 text-xs mb-1 text-center">
              Bomb cooldown: {Math.ceil(state.bombCooldown / 1000)}s
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-400 rounded-full transition-none"
                style={{ width: `${(1 - state.bombCooldown / state.bombCooldownTime) * 100}%` }}
              />
            </div>
          </div>
        ) : (
          <button
            onClick={() => setState(s => ({ ...s, hasBomb: true }))}
            className="w-full px-4 py-2 bg-white/10 hover:bg-orange-500/20 border border-transparent hover:border-orange-400/40 rounded-lg text-sm text-white transition-colors"
          >
            Prepare Bomb
          </button>
        )}
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

      {bossPhase === 'intro' && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-40">
          <p
            className="text-7xl font-black tracking-widest animate-pulse"
            style={{ color: '#ff4444', textShadow: '0 0 40px #ff0000, 0 0 80px #ff4444, 0 0 120px #ff0000' }}
          >
            BOSS FIGHT
          </p>
        </div>
      )}

      {isRoundOver && !openUpgrades && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
          <div className="text-center">
            <p className="text-white text-5xl font-bold mb-4">
              {isWin
                ? bossPhase === 'fight' ? 'BOSS DEFEATED!' : `Round ${round} Clear!`
                : "Time's Up!"}
            </p>
            <div className="flex items-center justify-center">
              {isWin ? (
                <div className="flex gap-2">
                  {showUpgradesThisRound ? (
                    <button
                      onClick={() => setOpenUpgrades(true)}
                      className="px-6 py-3 mt-6 bg-indigo-500/70 hover:bg-indigo-500/90 text-white rounded-lg transition-colors"
                    >
                      Upgrades
                    </button>
                  ) : (
                  <button
                    onClick={nextRound}
                    className="px-6 py-3 mt-6 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
                  >
                    Next Round
                  </button>
                  )}
                </div>
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
        </div>
      )}

      {openUpgrades && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
          <div className="bg-gray-900 border border-white/20 rounded-xl p-6 w-96">
            <h2 className="text-white text-xl font-bold mb-1">Choose an Upgrade</h2>
            <div className="flex flex-col gap-3">
              {upgrades.map(item => (
                <button
                  key={item.id}
                  className="w-full text-left px-4 py-3 bg-white/10 hover:bg-indigo-500/30 border border-transparent hover:border-indigo-400/50 rounded-lg transition-colors group"
                  onClick={() => {
                    setState(s => proceedRound(processUpgrade(s, item.id)))
                    setOpenUpgrades(false)
                  }}
                >
                  <p className="text-white font-semibold group-hover:text-indigo-200 transition-colors">{item.title}</p>
                  <p className="text-white/50 text-xs mt-0.5">{item.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
