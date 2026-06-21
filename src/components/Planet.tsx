import { applyDamage, playSound } from '../game';
import { SpawnDebris } from './Debris';
import { type Planet, type Coordinate, type GameState, getPlanetPosition } from '../types'

export default function PlanetComponent({ planet, position, rotation }: { planet: Planet; position: Coordinate; rotation: number }) {
  const diameter = planet.radius * 2
  const healthPct = planet.health / planet.maxHealth

  if (planet.destroyed) {
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
          display: planet.id == "sun" ? "none" : "",
          position: 'absolute',
          top: planet.id === 'boss' ? -14 : -10,
          left: 0,
          width: diameter,
          height: planet.id === 'boss' ? 6 : 4,
          backgroundColor: '#374151',
        }}
      >
        <div
          style={{
            width: `${healthPct * 100}%`,
            height: '100%',
            backgroundColor: planet.id === 'boss' ? '#ef4444' : '#4ade80',
          }}
        />
      </div>
      <svg
        width={diameter}
        height={diameter}
        style={{
          transform: `rotate(${rotation}rad)`,
          transformOrigin: '50% 50%',
          filter: planet.id === 'boss'
            ? 'drop-shadow(0 0 20px #ef4444) drop-shadow(0 0 45px #ff0000)'
            : planet.id === 'sun'
            ? 'drop-shadow(0 0 18px #fbbf24)'
            : undefined,
        }}
      >
        <image
          href={`assets/planets/${planet.imageName}`}
          x={0}
          y={0}
          width={diameter}
          height={diameter}
          style={{ imageRendering: "pixelated" }}
        /> 
      </svg>
    </div>
  )
}

export function getPlanetAtPosition(position: Coordinate, state : GameState, radius: number = 0): Planet | undefined {
  const planets = state.planets
  for (const planet of planets) {
    const planetPos = getPlanetPosition(planet)
    const dx = position.x - planetPos.x
    const dy = position.y - planetPos.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    if (distance <= planet.radius*1.5 + radius) {
      return planet
    }
  }
}

export function getPlanetsInRadius(position: Coordinate, state: GameState, radius: number): Planet[] {
  const planets = state.planets
  const planetsInRadius: Planet[] = []
  for (const planet of planets) {
    const planetPos = getPlanetPosition(planet)
    const dx = position.x - planetPos.x
    const dy = position.y - planetPos.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    if (distance <= planet.radius*1.5 + radius) {
      planetsInRadius.push(planet)
    }
  }
  return planetsInRadius
}

export function onPlanetClick(planet: Planet, state: GameState): GameState {
  if (planet.id === "sun" || planet.destroyed) {
    return state
  }
  if (planet.id === "boss") {
    playSound("stone")
    const bossPos = getPlanetPosition(planet)
    const bossDebris = Array.from({ length: 1 }, () => SpawnDebris(bossPos, planet, 20, true))
    return {
      ...state,
      debris: [...state.debris, ...bossDebris],
    }
  }

  const { planets: updatedPlanets, newDebris } = applyDamage(state.planets, planet.id, state.clickDamage, state, true)

  return {
    ...state,
    planets: updatedPlanets,
    debris: [...state.debris, ...newDebris],
  }
}