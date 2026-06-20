import { useCallback, useState } from "react";
import { useGameLoop } from "../hooks/useGameLoop";
import { getPlanetPosition, type GameState, type Debris } from "../types";
import Planet from "./Planet";
import DebrisComponent from "./Debris";
import Cursor from "./Cursor";

export default function GameCanvas({
  state,
  onTick,
}: {
  state: GameState;
  onTick: (deltaTime: number) => void;
}) {
  const [, setTick] = useState(0);

  const tick = useCallback(
    (deltaTime: number) => {
      onTick(deltaTime);
      setTick((t) => t + 1);
    },
    [onTick],
  );

  useGameLoop(tick);

  const { planets, debris } = state;

  return (
    <>
      <Cursor />
      <div className="relative w-full h-screen bg-black cursor-crosshair overflow-hidden">
      {planets.map((planet) => (
          <Planet
            key={planet.id}
            planet={planet}
            position={getPlanetPosition(planet)}
          />
        ))}
        {debris.map((d) => (
          <DebrisComponent position={d.position} key={d.id} debris={d} />
        ))}
      </div>
    </>

  );
}
