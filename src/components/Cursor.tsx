import { useState, useEffect, useRef } from "react";
import { getPlanetAtPosition, getPlanetsInRadius, onPlanetClick } from "./Planet";
import type { ExplosionEvent, GameState } from "../types";
import { BOMB_DAMAGE, BOMB_RADIUS, MOUSE_RADIUS } from "../constants";
import { applyDamage } from "../game";

export default function Cursor({
  state,
  setState,
  addExplosion,
}: {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  addExplosion: (e: ExplosionEvent) => void;
}) {
  const [pos, setPos] = useState([0, 0]);

  const stateRef = useRef(state);
  stateRef.current = state;

  const setStateRef = useRef(setState);
  setStateRef.current = setState;

  // Grab state
  const grabbedIdRef = useRef<string | null>(null);
  const grabOffsetRef = useRef({ x: 0, y: 0 });
  const samplesRef = useRef<{ x: number; y: number; t: number }[]>([]);

  useEffect(() => {
    const moveHandler = (e: MouseEvent) => {
      const mx = e.clientX;
      const my = e.clientY;
      setPos([mx, my]);
      setStateRef.current(s => ({ ...s, cursorPos: { x: mx, y: my } }));

      // If dragging a debris piece, move it to cursor position + offset
      const grabbedId = grabbedIdRef.current;
      if (grabbedId) {
        const off = grabOffsetRef.current;
        setStateRef.current((prev) => {
          const debris = prev.debris.map((d) =>
            d.id === grabbedId
              ? { ...d, position: { x: mx - off.x, y: my - off.y }, velocity: { x: 0, y: 0 } }
              : d
          );
          return { ...prev, debris };
        });

        // record sample for velocity calc
        const now = performance.now();
        const samples = samplesRef.current;
        samples.push({ x: mx, y: my, t: now });
        if (samples.length > 6) samples.shift();
      }
    };

    const downHandler = (e: MouseEvent) => {
      const mx = e.clientX;
      const my = e.clientY;

    if (stateRef.current.hasBomb) {
      setStateRef.current(s => ({ ...s, hasBomb: false, bombCooldown: stateRef.current.bombCooldownTime }));
      addExplosion({
        dimensions: { width: 350, height: 350 },
        id: `bomb-${Date.now()}`,
        position: { x: mx, y: my },
        color: '#fb923c',
        gifSrc: '/assets/explosion2.gif',
        particles: [],
      })

      const hitPlanets = getPlanetsInRadius({ x: mx, y: my }, stateRef.current, BOMB_RADIUS);

      if (hitPlanets.length > 0) {
        setStateRef.current(prev => {
          let planets = prev.planets;
          let allNewDebris: typeof prev.debris = [];

          for (const p of hitPlanets) {
            const result = applyDamage(planets, p.id, BOMB_DAMAGE, prev);
            planets = result.planets;
            allNewDebris = [...allNewDebris, ...result.newDebris];
          }

          return { ...prev, planets, debris: [...prev.debris, ...allNewDebris] };
        });
      }

      return;
    }

      // try to grab debris first
      const debrisList = stateRef.current.debris;
      let found: typeof debrisList[0] | null = null;
      let foundDist = Infinity;
      for (const d of debrisList) {
        const dx = d.position.x - mx;
        const dy = d.position.y - my;
        const dist = Math.hypot(dx, dy);
        if (dist <= d.radius + 12 && dist < foundDist && !d.isBossDebris) {
          found = d;
          foundDist = dist;
        }
      }

      if (found) {
        grabbedIdRef.current = found.id;
        grabOffsetRef.current = { x: mx - found.position.x, y: my - found.position.y };
        samplesRef.current = [{ x: mx, y: my, t: performance.now() }];
        e.preventDefault();
        return; // don't trigger planet click when starting a grab
      }

      // fallback: planet click behavior remains
      const planet = getPlanetAtPosition({ x: mx, y: my }, stateRef.current);
      if (planet) {
        setStateRef.current(onPlanetClick(planet, stateRef.current));
      }
    };

    const upHandler = (_e: MouseEvent) => {
      const grabbedId = grabbedIdRef.current;
      if (!grabbedId) return;

      const samples = samplesRef.current;
      if (samples.length >= 2) {
        const last = samples[samples.length - 1];
        let earlier = samples[0];
        for (let i = samples.length - 2; i >= 0; i--) {
          if (last.t - samples[i].t >= 40) {
            earlier = samples[i];
            break;
          }
        }
        const dt = (last.t - earlier.t) / 1000; // seconds
        let vx = 0;
        let vy = 0;
        if (dt > 0) {
          vx = (last.x - earlier.x) / dt;
          vy = (last.y - earlier.y) / dt;
        }

        const MAX = 1200;
        const s = Math.hypot(vx, vy);
        if (s > MAX) {
          const k = MAX / s;
          vx *= k;
          vy *= k;
        }

        setStateRef.current((prev) => {
          const debris = prev.debris.map((d) =>
            d.id === grabbedId ? { ...d, velocity: { x: vx, y: vy } } : d
          );
          return { ...prev, debris };
        });
      }

      // clear grab state
      grabbedIdRef.current = null;
      samplesRef.current = [];
    };

    const keydownHandler = (e: KeyboardEvent) => {
      if (e.key === 'z') setStateRef.current(s => ({ ...s, isAttracting: true }))
      
      if (e.key === 'x' && stateRef.current.bombCooldown <= 0) setStateRef.current(s => ({ ...s, hasBomb: true }))
    }
    const keyupHandler = (e: KeyboardEvent) => {
      if (e.key === 'z') setStateRef.current(s => ({ ...s, isAttracting: false }))
    }

    window.addEventListener("mousemove", moveHandler);
    window.addEventListener("mousedown", downHandler);
    window.addEventListener("mouseup", upHandler);
    window.addEventListener('keydown', keydownHandler);
    window.addEventListener('keyup', keyupHandler);
    return () => {
      window.removeEventListener("mousemove", moveHandler);
      window.removeEventListener("mousedown", downHandler);
      window.removeEventListener("mouseup", upHandler);
      window.removeEventListener('keydown', keydownHandler);
      window.removeEventListener('keyup', keyupHandler);
    };
  }, []);

  return (
    <div
      style={{
        zIndex: 10,
        position: "fixed",
        left: pos[0] - MOUSE_RADIUS,
        top: pos[1] - MOUSE_RADIUS,
        pointerEvents: "none",
      }}
    />
  );
}