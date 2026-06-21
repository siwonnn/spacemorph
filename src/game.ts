import { SpawnDebris } from "./components/Debris"
import { DEBRIS_PER_DEATH } from "./constants"
import { getPlanetPosition, type Coordinate, type Debris, type GameState, type Planet } from "./types"
import { getRandomInt, getRandomFloat } from "./utils"

const DEBRIS_MARGIN = 0
const DEBRIS_GRACE_PERIOD = 0.2

export function tickGame(state: GameState, deltaTime: number): GameState {
  const { debris, planets } = tickDebris(state, state.debris, state.planets, deltaTime)

  return {
    ...state,
    planets: planets.map(p => ({
      ...p,
      angle: p.angle + p.orbitSpeed * deltaTime,
      rotation: (p.rotation + p.rotationSpeed * deltaTime) % (Math.PI * 2),
    })),
    debris,
    remainingTime: state.planets.filter(p => p.id !== 'sun').every(p => p.destroyed)
      ? state.remainingTime
      : Math.max(0, state.remainingTime - deltaTime * 1000),
  }
}

function tickDebris(
  state: GameState,
  debris: Debris[],
  planets: Planet[],
  deltaTime: number
): { debris: Debris[]; planets: Planet[] } {
  const width = window.innerWidth
  const height = window.innerHeight

  const moved = applyGravity(debris, planets, deltaTime)
  const { survivors, planets: updatedPlanets } = resolveDebrisCollisions(state, moved, planets)

  const wrapped = survivors.map(d => {
    let { x, y } = d.position
    if (x < -DEBRIS_MARGIN) x = width + DEBRIS_MARGIN
    else if (x > width + DEBRIS_MARGIN) x = -DEBRIS_MARGIN
    if (y < -DEBRIS_MARGIN) y = height + DEBRIS_MARGIN
    else if (y > height + DEBRIS_MARGIN) y = -DEBRIS_MARGIN
    return {
      ...d,
      position: { x, y },
      rotation: (d.rotation + d.rotationSpeed * deltaTime) % (Math.PI * 2),
      age: d.age + deltaTime
    }
  })

  return { debris: wrapped, planets: updatedPlanets }
}

const CX = window.innerWidth / 2
const CY = window.innerHeight / 2

export function createGame(): GameState {
  return {
    round: 1,
    planets: [
      { ...constructRandomPlanet(true, 1), id: 'sun' },
      { ...constructRandomPlanet(false, 1), id: 'planet_1' },
      { ...constructRandomPlanet(false, 1), id: 'planet_2' },
      { ...constructRandomPlanet(false, 1), id: 'planet_3' },
    ],
    debris: [],
    remainingTime: 30000
  }
}

export function getPlanetDirection(planet: Planet): Coordinate {
  const dx = -Math.sin(planet.angle);
  const dy = Math.cos(planet.angle);
  const len = Math.hypot(dx, dy);
  return { x: dx / len, y: dy / len };
}

export function constructRandomPlanet(sun = false, round: number): Planet {
  round -= 1
  const maxHealth = getRandomInt(100 + round*10, 200 + round*10)
  const colors = ['#fbbf24', '#60a5fa', '#f87171']
  if (sun) {
    return {
      id: 'sun',
      name: 'Sun',
      destroyed: false,
      color: '#fbbf24',
      radius: 40,
      health: -1,
      maxHealth: -1,
      orbitCenter: { x: CX, y: CY },
      orbitRadius: 0,
      rotation: 0,
      rotationSpeed: 0.1,
      orbitSpeed: 0,
      angle: 0,
      imageName: `sun${getRandomInt(1, 4)}.png`
    }
  } else {
    return {
      id: '',
      name: '',
      destroyed: false,
      color: colors[getRandomInt(0, 2)],
      radius: getRandomInt(10, 25),
      health: maxHealth,
      maxHealth: maxHealth,
      rotation: getRandomFloat(0, 360),
      rotationSpeed: 0,
      orbitCenter: { x: CX, y: CY },
      orbitRadius: getRandomInt(200, 400),
      orbitSpeed: getRandomFloat(0.4+0.05*round, 1.0+0.08*round),
      angle: getRandomFloat(0, 5),
      imageName: `planet${getRandomInt(1, 12)}.png`
    }
  }
}

export function proceedRound(state: GameState) {
  const nextRound = state.round + 1
  const planetCount = Math.floor(3 + 0.4 * nextRound)

  const nonSunIds = Array.from({ length: planetCount }, (_, i) => `planet_${i + 1}`)
  const planets = [
    { ...constructRandomPlanet(true, nextRound), id: 'sun' },
    ...nonSunIds.map(id => ({ ...constructRandomPlanet(false, nextRound), id })),
  ]

  return {
    ...state,
    round: nextRound,
    planets,
    debris: [],
    remainingTime: 30000,
  }
}

export function debrisMoveTowards(debris: Debris, target: Coordinate, speed: number): Debris {
  const dx = target.x - debris.position.x;
  const dy = target.y - debris.position.y;
  const dist = Math.hypot(dx, dy);
  if (dist === 0) return debris;
  const vx = (dx / dist) * speed;
  const vy = (dy / dist) * speed;
  return {
    ...debris,
    velocity: { x: vx, y: vy },
  };
}

export function calculateProgress(state: GameState): number {
  let totalHealth = 0
  let totalMaxHealth = 0
  for (const planet of state.planets) {
    if (planet.id !== 'sun') {
      totalHealth += planet.health
      totalMaxHealth += planet.maxHealth
    }
  }
  return Math.round((totalMaxHealth - totalHealth) / totalMaxHealth * 100)
}

// collision
export function isColliding(d: Debris, p: Planet): boolean {
  const pPos = getPlanetPosition(p);
  const dx = d.position.x - pPos.x;
  const dy = d.position.y - pPos.y;
  const distSq = dx * dx + dy * dy;
  const radiusSum = d.radius + p.radius;
  return distSq <= radiusSum * radiusSum;
}

// Debris that just spawned from a planet gets a brief grace period so it
// doesn't immediately re-collide with its own source planet.

function resolveDebrisCollisions(
  state: GameState,
  debris: Debris[],
  planets: Planet[]
): { survivors: Debris[]; planets: Planet[] } {
  const survivors: Debris[] = []
  const spawned: Debris[] = []
  let nextPlanets = planets

  for (const d of debris) {
    let hit = false

    for (let i = 0; i < nextPlanets.length; i++) {
      const planet = nextPlanets[i]
      if (planet.destroyed) continue
      if (planet.id === d.sourcePlanetId) continue

      if (isColliding(d, planet) && (d.age >= DEBRIS_GRACE_PERIOD)) {
        hit = true
        const result = applyDamage(nextPlanets, planet.id, d.damage, state)
        nextPlanets = result.planets
        spawned.push(...result.newDebris)
        break
      }
    }

    if (!hit) survivors.push(d)
  }

  return { survivors: [...survivors, ...spawned], planets: nextPlanets }
}

function playBreakSound() {
  const n = Math.floor(Math.random() * 5) + 1
  const audio = new Audio(`assets/sounds/break${n}.wav`)
  audio.play().catch(() => {})
}

export function applyDamage(
  planets: Planet[],
  planetId: string,
  amount: number,
  state: GameState
): { planets: Planet[]; newDebris: Debris[]; state: GameState } {
  const newDebris: Debris[] = []

  const updatedPlanets = planets.map(p => {
    if (p.id !== planetId || p.id === 'sun') return p

    const health = Math.max(0, p.health - amount)
    const destroyed = health <= 0

    playBreakSound()

    if (destroyed) {
      newDebris.push(
        ...Array.from({ length: DEBRIS_PER_DEATH }, () => SpawnDebris(getPlanetPosition(p), p, 10))
      )
    }

    return { ...p, health, destroyed }
  })

  return { planets: updatedPlanets, newDebris, state }
}

const GRAVITY_CONSTANT = 1000; // tune to taste
const MIN_DISTANCE_SQ = 100;    // prevents singularity/explosion at r→0

const DEBRIS_SPEED_LIMIT = 1200;
const DEBRIS_DAMPING = 1.2;

export function applyGravity(debris: Debris[], planets: Planet[], deltaTime: number): Debris[] {
  return debris.map((d) => {
    let ax = 0;
    let ay = 0;

    for (let i = 0; i < planets.length; i++) {
      const planet = planets[i];
      if (planet.destroyed) continue;

      const planetPos = getPlanetPosition(planet);
      const dx = planetPos.x - d.position.x;
      const dy = planetPos.y - d.position.y;
      const distSq = dx * dx + dy * dy;

      if (distSq < MIN_DISTANCE_SQ) continue;

      const mass = planet.radius * planet.radius;
      const invDistSq = 1 / distSq;
      const forceMag = GRAVITY_CONSTANT * mass * invDistSq;
      const invDist = Math.sqrt(invDistSq);
      ax += dx * invDist * forceMag;
      ay += dy * invDist * forceMag;
    }

    let vx = d.velocity.x + ax * deltaTime;
    let vy = d.velocity.y + ay * deltaTime;

    // exponential damping (friction-like)
    const damp = Math.exp(-DEBRIS_DAMPING * deltaTime);
    vx *= damp;
    vy *= damp;

    // cap speed
    const speed = Math.hypot(vx, vy);
    if (speed > DEBRIS_SPEED_LIMIT) {
      const scale = DEBRIS_SPEED_LIMIT / speed;
      vx *= scale;
      vy *= scale;
    }

    return {
      ...d,
      velocity: { x: vx, y: vy },
      position: {
        x: d.position.x + vx * deltaTime,
        y: d.position.y + vy * deltaTime,
      },
    };
  });
}