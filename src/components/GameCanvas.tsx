import { useCallback, useState } from "react";
import { useGameLoop } from "../hooks/useGameLoop";
import { getPlanetPosition, type GameState, type Debris } from "../types";
import Planet from "./Planet";
import DebrisComponent from "./Debris";
import Cursor from "./Cursor";
import FireworksParticles from "./Particles";
import { shufflePlanets } from "../game";

export default function GameCanvas({
  state,
  setState,
  onTick,
}: {
  state: GameState;
  setState: React.Dispatch<GameState>;
  onTick: (deltaTime: number) => void;
}) {
  const [, setTick] = useState(0);
  const [fireworkTarget, setFireworkTarget] = useState<{ x: number; y: number } | null>(null);
  const [fireworkKey, setFireworkKey] = useState(0);

  const tick = useCallback(
    (deltaTime: number) => {
      onTick(deltaTime);
      setTick((t) => t + 1);
    },
    [onTick],
  );

  useGameLoop(tick);

  const { planets, debris } = state;

  // const handlePlanetClick = (position: { x: number; y: number }) => {
  //   setFireworkTarget(position);
  //   setFireworkKey((k) => k + 1);
  // };

  // const handleTestExplosion = () => {
  //   setFireworkTarget({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  //   setFireworkKey((k) => k + 1);
  // };

  const handleShuffle = () => {
    setState(shufflePlanets(state));
  };

  return (
    <>
      <FireworksParticles key={fireworkKey} emitterPosition={fireworkTarget} />
      <Cursor state={state} />
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
          backgroundColor: "black",
          imageRendering: "pixelated",
          overflow: "hidden",
        }}
      >
        {planets.map((planet) => (
          <Planet key={planet.id} planet={planet} rotation={planet.rotation} position={getPlanetPosition(planet)} />
        ))}
    
        {debris.map((d) => (
          <DebrisComponent position={d.position} key={d.id} debris={d} />
        ))}
      </div>

      <button className="fixed bottom-6 right-6 px-4 py-2 bg-white/10 rounded-lg" onClick={handleShuffle}>
        Shuffle 
      </button>
    </>
  );
}
