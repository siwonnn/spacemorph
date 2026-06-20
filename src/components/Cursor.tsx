import { useState, useEffect, useRef } from "react";
import { getPlanetAtPosition } from "./Planet";
import type { GameState } from "../types";
import { MOUSE_RADIUS } from "../constants.ts";

export default function Cursor({
  state,
  onPlanetClick,
}: {
  state: GameState;
  onPlanetClick?: (position: { x: number; y: number }) => void;
}) {
  const [pos, setPos] = useState([0, 0]);
  const [color, setColor] = useState<string>("grey");

  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const moveHandler = (e: MouseEvent) => setPos([e.clientX, e.clientY]);
    const clickHandler = (e: MouseEvent) => {
      const planet = getPlanetAtPosition({ x: e.clientX, y: e.clientY }, stateRef.current);
      if (planet) {
        setColor(planet.color);
        onPlanetClick?.({ x: e.clientX, y: e.clientY });
      }
    };
    window.addEventListener("mousemove", moveHandler);
    window.addEventListener("mousedown", clickHandler);
    return () => {
      window.removeEventListener("mousemove", moveHandler);
      window.removeEventListener("mousedown", clickHandler);
    };
  }, [onPlanetClick]);

  return (
    <div style={{
      zIndex: 10,
      position: "fixed",
      left: pos[0] - MOUSE_RADIUS,
      top: pos[1] - MOUSE_RADIUS,
      pointerEvents: "none",
    }}>
      <svg width={MOUSE_RADIUS * 2} height={MOUSE_RADIUS * 2}>
        <circle cx={MOUSE_RADIUS} cy={MOUSE_RADIUS} r={MOUSE_RADIUS} fill={color} />
      </svg>
    </div>
  );
}