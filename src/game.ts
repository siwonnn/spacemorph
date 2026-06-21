import { SpawnDebris } from "./components/Debris"
import { getPlanetPosition, type BossPhase, type Coordinate, type Debris, type GameState, type Planet } from "./types"
import { getRandomInt, getRandomFloat } from "./utils"

const DEBRIS_MARGIN = 0
const DEBRIS_GRACE_PERIOD = 0.2

export function tickGame(state: GameState, deltaTime: number): GameState {
  const { debris, planets } = tickDebris(state, state.debris, state.planets, deltaTime)
  const allNonSunDestroyed = planets.filter(p => p.id !== 'sun').every(p => p.destroyed)

  return {
    ...state,
    planets: planets.map(p => ({
      ...p,
      angle: p.angle + p.orbitSpeed * deltaTime,
      rotation: (p.rotation + p.rotationSpeed * deltaTime) % (Math.PI * 2),
    })),
    debris,
    remainingTime: (allNonSunDestroyed || state.bossPhase === 'intro')
      ? state.remainingTime
      : Math.max(0, state.remainingTime - deltaTime * 1000),
    bombCooldown: Math.max(0, state.bombCooldown - deltaTime * 1000),
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

  const afterGravity = applyGravity(debris, planets, deltaTime, state.bossPhase)
  const moved = state.isAttracting
    ? afterGravity.map(d => debrisMoveTowards(d, state.cursorPos, deltaTime))
    : afterGravity
  const { survivors, planets: updatedPlanets } = resolveDebrisCollisions(state, moved, planets)

  const wrapped = survivors.map(d => {
    // During intro let gravity pull debris to sun without wrapping around edges
    if (state.bossPhase === 'intro') {
      return {
        ...d,
        rotation: (d.rotation + d.rotationSpeed * deltaTime) % (Math.PI * 2),
        age: d.age + deltaTime,
      }
    }
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
    remainingTime: 30000,
    timeLimit: 30000,
    debrisPerDeath: 3,
    clickDamage: 40,
    debrisDamageBonus: 0,
    hasBomb: false,
    bombCooldown: 0,
    bombCooldownTime: 30000,
    isAttracting: false,
    cursorPos: { x: 0, y: 0 },
    bossPhase: 'none',
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
  const maxHealth = getRandomInt(100 + round*15, 200 + round*15)
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
      radius: getRandomInt(15, 25),
      health: maxHealth,
      maxHealth: maxHealth,
      rotation: getRandomFloat(0, 360),
      rotationSpeed: 0,
      orbitCenter: { x: CX, y: CY },
      orbitRadius: getRandomInt(200, 400),
      orbitSpeed: getRandomFloat(0.4+0.04*round, 1.0+0.08*round),
      angle: getRandomFloat(0, 5),
      imageName: `planet${getRandomInt(1, 12)}.png`
    }
  }
}

export function constructBossPlanet(round: number): Planet {
  const health = 600 + round * 100
  return {
    id: 'boss',
    name: 'BOSS',
    destroyed: false,
    color: '#ff4444',
    radius: 75,
    health,
    maxHealth: health,
    rotation: 0,
    rotationSpeed: 0.06,
    orbitCenter: { x: CX, y: CY },
    orbitRadius: 230,
    orbitSpeed: 0.12 + round * 0.005,
    angle: 0,
    imageName: `planet${getRandomInt(1, 12)}.png`,
  }
}

function createIntroDebris(count: number = 30): Debris[] {
  const width = window.innerWidth
  const height = window.innerHeight
  return Array.from({ length: count }, (_, i) => {
    const x = Math.random() * width
    const y = Math.random() * height
    return {
      id: `intro-${i}-${Math.random().toString(36).slice(2)}`,
      position: { x, y },
      velocity: { x: (Math.random() - 0.5) * 80, y: (Math.random() - 0.5) * 80 },
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 3,
      radius: 8 + Math.random() * 10,
      damage: 0,
      sourcePlanetId: 'intro',
      imageName: `planet${getRandomInt(1, 12)}-${getRandomInt(1, 3)}.png`,
      age: 1,
    }
  })
}

export function proceedRound(state: GameState): GameState {
  const nextRound = state.round + 1
  const isBossRound = nextRound % 5 === 0

  if (isBossRound) {
    return {
      ...state,
      round: nextRound,
      planets: [{ ...constructRandomPlanet(true, nextRound), id: 'sun' }],
      debris: createIntroDebris(35),
      remainingTime: state.timeLimit,
      bossPhase: 'intro',
    }
  }

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
    remainingTime: state.timeLimit,
    bossPhase: 'none',
  }
}

export const upgrades = [
  {
    id: 0,
    title: "Extended Time",
    description: "+ 5 seconds per round"
  },
  {
    id: 1,
    title: "Extra Debris",
    description: "+ 1 debris on explosion"
  },
  {
    id: 2,
    title: "Click Power",
    description: "+ 10 damage per click"
  },
  {
    id: 3,
    title: "Debris Power",
    description: "+ 10 damage per debris hit"
  },
  {
    id: 4,
    title: "Decrease Bomb Cooldown",
    description: "- 1 sec bomb cooldown time"
  }
]

export function processUpgrade(state: GameState, id: number): GameState {
  switch (id) {
    case 0:
      return { ...state, timeLimit: state.timeLimit + 5000 }
    case 1:
      return { ...state, debrisPerDeath: state.debrisPerDeath + 1 }
    case 2:
      return { ...state, clickDamage: state.clickDamage + 10 }
    case 3:1
      return { ...state, debrisDamageBonus: state.debrisDamageBonus + 10 }
    case 4:
      return { ...state, bombCooldownTime: Math.max(5000, state.bombCooldownTime - 5000) }
    default:
      return state
  }
}

const ATTRACT_CONSTANT = 12000000
const ATTRACT_MIN_DIST_SQ = 2500  // ~50px, prevents singularity up close
const ATTRACT_SPEED_CAP = 10000

export function debrisMoveTowards(debris: Debris, target: Coordinate, deltaTime: number): Debris {
  const dx = target.x - debris.position.x;
  const dy = target.y - debris.position.y;
  const distSq = dx * dx + dy * dy;
  if (distSq === 0) return debris;
  const dist = Math.sqrt(distSq);

  const effectiveDistSq = Math.max(distSq, ATTRACT_MIN_DIST_SQ)
  const forceMag = ATTRACT_CONSTANT / effectiveDistSq
  const ax = (dx / dist) * forceMag
  const ay = (dy / dist) * forceMag

  let vx = debris.velocity.x + ax * deltaTime
  let vy = debris.velocity.y + ay * deltaTime

  const speed = Math.hypot(vx, vy)
  if (speed > ATTRACT_SPEED_CAP) {
    const scale = ATTRACT_SPEED_CAP / speed
    vx *= scale
    vy *= scale
  }

  return { ...debris, velocity: { x: vx, y: vy } }
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
  if (totalMaxHealth === 0) return 0
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
        const result = applyDamage(nextPlanets, planet.id, d.damage + state.debrisDamageBonus, state)
        nextPlanets = result.planets
        spawned.push(...result.newDebris)
        break
      }
    }

    if (!hit) survivors.push(d)
  }

  return { survivors: [...survivors, ...spawned], planets: nextPlanets }
}

const soundPool: Record<string, HTMLAudioElement[]> = {}
;([['break', 5], ['firework', 5], ['stone', 3]] as const).forEach(([type, count]) => {
  soundPool[type] = Array.from({ length: count }, (_, i) => {
    const a = new Audio(`assets/sounds/${type}${i + 1}.wav`)
    a.preload = 'auto'
    return a
  })
})

export function playSound(type: keyof typeof soundPool, rate = 1) {
  const pool = soundPool[type]
  const clone = pool[Math.floor(Math.random() * pool.length)].cloneNode() as HTMLAudioElement
  clone.playbackRate = rate
  clone.play().catch(() => {})
}

export function applyDamage(
  planets: Planet[],
  planetId: string,
  amount: number,
  state: GameState,
  click: boolean = false
): { planets: Planet[]; newDebris: Debris[]; state: GameState; } {
  const newDebris: Debris[] = []

  const updatedPlanets = planets.map(p => {
    if (p.id !== planetId || p.id === 'sun') return p

    const health = Math.max(0, p.health - amount)
    const destroyed = health <= 0
    const isBoss = p.id === 'boss'

    const soundType = click ? "stone" : "break"

    if (isBoss) {
      const healthPct = destroyed ? 0 : health / p.maxHealth
      playSound(soundType, 1.0 + (1 - healthPct) * 1.5)
    } else {
      playSound(soundType)
    }

    if (destroyed) {
      playSound("firework")
      if (isBoss) {
        for (let i = 1; i <= 5; i++) {
          setTimeout(() => playSound("break", 1.2 + i * 0.15), i * 80)
        }
      }
      newDebris.push(
        ...Array.from({ length: state.debrisPerDeath }, () => SpawnDebris(getPlanetPosition(p), p, 10))
      )
    }

    return { ...p, health, destroyed }
  })

  return { planets: updatedPlanets, newDebris, state }
}

const GRAVITY_CONSTANT = 3000; // tune to taste
const MIN_DISTANCE_SQ = 100;    // prevents singularity/explosion at r→0

const DEBRIS_SPEED_LIMIT = 1200;
const DEBRIS_DAMPING = 1.01;

const BOSS_SUN_GRAVITY_MULTIPLIER = 40;
const BOSS_INTRO_SPEED_LIMIT = 3500;

export function applyGravity(debris: Debris[], planets: Planet[], deltaTime: number, bossPhase: BossPhase = 'none'): Debris[] {
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

      const isSun = planet.id === 'sun';
      const gravMultiplier = (bossPhase === 'intro' && isSun) ? BOSS_SUN_GRAVITY_MULTIPLIER : 1;
      const mass = planet.radius * planet.radius;
      const invDistSq = 1 / distSq;
      const forceMag = GRAVITY_CONSTANT * mass * invDistSq * gravMultiplier;
      const invDist = Math.sqrt(invDistSq);
      ax += dx * invDist * forceMag;
      ay += dy * invDist * forceMag;
    }

    let vx = d.velocity.x + ax * deltaTime;
    let vy = d.velocity.y + ay * deltaTime;

    // damping
    const damp = Math.exp(-DEBRIS_DAMPING * deltaTime);
    vx *= damp;
    vy *= damp;

    // higher speed cap during boss intro so fragments slam into the sun
    const speedLimit = bossPhase === 'intro' ? BOSS_INTRO_SPEED_LIMIT : DEBRIS_SPEED_LIMIT;
    const speed = Math.hypot(vx, vy);
    if (speed > speedLimit) {
      const scale = speedLimit / speed;
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
