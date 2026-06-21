import { MOUSE_RADIUS } from '../constants';
import { applyDamage } from '../game';
import { type Planet, type Coordinate, type GameState, getPlanetPosition } from '../types'

export default function PlanetComponent({ planet, position, rotation }: { planet: Planet; position: Coordinate; rotation: number }) {
  const diameter = planet.radius * 2
  const healthPct = planet.health / planet.maxHealth

  if (planet.destroyed){
    return null
  }
  return (
    <div
      className="absolute"
      style={{
        left: position.x - planet.radius,
        top: position.y - planet.radius,
        width: diameter,
        height: diameter,
      }}
    >
      <div
        style={{
          // excludes sun; crap solution dont hurt me
          display: planet.id == "sun" ? "none" : "",
          
          position: 'absolute',
          top: -10,
          left: 0,
          width: diameter,
          height: 4,
          backgroundColor: '#374151',
        }}
      >
        <div
          style={{
            width: `${healthPct * 100}%`,
            height: '100%',
            backgroundColor: '#4ade80',
          }}
        />
      </div>
      <svg
        width={diameter}
        height={diameter}
        style={{
          transform: `rotate(${rotation}rad)`,
          transformOrigin: '50% 50%',
          filter: planet.id === 'sun' ? 'drop-shadow(0 0 18px #fbbf24)' : undefined,
        }}
      >
        <image
          href={`assets/planets/${planet.imageName}`}
          x={0}
          y={0}
          width={diameter}
          height={diameter}
        />
      </svg>
    </div>
  )
}

export function getPlanetAtPosition(position: Coordinate, state : GameState): Planet | undefined {
  const planets = state.planets
  for (const planet of planets) {
    const planetPos = getPlanetPosition(planet)
    const dx = position.x - planetPos.x
    const dy = position.y - planetPos.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    if (distance <= planet.radius*1.5) {
      return planet
    }
  }
}

export function onPlanetClick(planet: Planet, state: GameState): GameState {
  if (planet.id === "sun" || planet.destroyed) {
    return state
  }

  
  const { planets: updatedPlanets, newDebris } = applyDamage(state.planets, planet.id, 40, state)

  return {
    ...state,
    planets: updatedPlanets,
    debris: [...state.debris, ...newDebris],
  }
}