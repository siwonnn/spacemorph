export interface Coordinate {
  x: number
  y: number
}

export interface Planet {
  id: string
  name: string
  destroyed: boolean
  color: string
  radius: number      // visual size in pixels
  health: number
  maxHealth: number
  // orbital mechanics — position is derived, never stored directly
  rotation: number
  rotationSpeed: number // radians per second
  orbitCenter: Coordinate
  orbitRadius: number // distance from orbitCenter in pixels
  orbitSpeed: number  // radians per second
  angle: number       // current angle in radians
  imageName: string
}

export interface Debris {
  id: string
  position: Coordinate
  velocity: Coordinate // pixels per second
  rotation: number
  rotationSpeed: number
  radius: number
  damage: number
  sourcePlanetId: string
  imageName: string
  age: number
  isBossDebris: boolean
  isFormedPlanet?: boolean
}

export type BossPhase = 'none' | 'intro' | 'fight'

export interface GameState {
  round: number
  planets: Planet[]
  debris: Debris[]
  remainingTime: number // milliseconds
  timeLimit: number
  debrisPerDeath: number
  clickDamage: number
  debrisDamageBonus: number
  hasBomb: boolean
  bombCooldown: number
  bombCooldownTime: number
  isAttracting: boolean
  cursorPos: Coordinate
  bossPhase: BossPhase
}

export interface ExplosionEvent {
  dimensions: {width: number, height: number}
  id: string
  position: Coordinate
  color: string
  particles: ExplosionParticle[]
  gifSrc?: string
}

export interface ExplosionParticle {
  id: string
  dx: number
  dy: number
  size: number
  color: string
  delay: number
}

export function getPlanetPosition(planet: Planet): Coordinate {
  return {
    x: planet.orbitCenter.x + Math.cos(planet.angle) * planet.orbitRadius,
    y: planet.orbitCenter.y + Math.sin(planet.angle) * planet.orbitRadius,
  }
}