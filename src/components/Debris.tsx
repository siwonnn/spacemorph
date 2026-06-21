import { getPlanetDirection } from "../game";
import { getRandomInt } from "../utils";
import type { Coordinate, Debris, Planet } from "../types";

export default function DebrisComponent({
  debris,
  position,
  rotation,
}: {
  debris: Debris;
  position: Coordinate;
  rotation: number;
}) {
  const diameter = debris.radius * 2;

  return (
    <div
      className="absolute"
      style={{
        left: position.x - debris.radius,
        top: position.y - debris.radius,
        width: diameter,
        height: diameter,
        cursor: 'grab',
      }}
    >
      <svg width={diameter} height={diameter} style={{
          transform: `rotate(${rotation}rad)`,
          transformOrigin: '50% 50%',
          imageRendering : 'pixelated',
        }}>
        <image
          href={`assets/planets/fragments/${debris.imageName}`}
          x={0}
          y={0}
          width={diameter}
          height={diameter}  
        />
      </svg>
    </div>
  );
}

const DEBRIS_SPEED = 500

function getFragmentImage(sourcePlanet: Planet) {
  const baseName = sourcePlanet.imageName.replace(/\.png$/, "");
  const variant = getRandomInt(1, 3);
  return `${baseName}-${variant}.png`;
}

export function SpawnDebris(coordinate: Coordinate, sourcePlanet: Planet, radius: number): Debris {
  const speed = DEBRIS_SPEED * (0.5 + Math.random())
  const direction = getPlanetDirection(sourcePlanet)
  const velocity = {
    x: direction.x * speed + (Math.random() - 0.5)*10,
    y: direction.y * speed + (Math.random() - 0.5)*10,
  };

  const MAX = 1200;
  const s = Math.hypot(velocity.x, velocity.y);
  if (s > MAX) {
    const k = MAX / s;
    velocity.x *= k;
    velocity.y *= k;
  }

  return {
    id: Math.random().toString(36).substr(2, 11),
    position: coordinate,
    velocity,
    sourcePlanetId: sourcePlanet.id,
    radius: radius *  2,
    damage: radius * 10,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5)*2,
    imageName: getFragmentImage(sourcePlanet),
    age: 0
  };
}