import { type GameState, type Planet } from "./types"
import { getRandomInt, getRandomFloat } from "./utils"

export function tickGame(state: GameState, deltaTime: number): GameState {
  return {
    ...state,
    planets: state.planets.map(p => ({
      ...p,
      angle: p.angle + p.orbitSpeed * deltaTime,
      rotation: (p.rotation + p.rotationSpeed * deltaTime) % (Math.PI * 2),
    })),
  }
}

const CX = window.innerWidth / 2
const CY = window.innerHeight / 2

export function createGame(): GameState {
  const sun: Planet = {
    id: 'sun',
    name: 'Sun',
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
    imageName: 'sun1.png'
  }
  return {
    planets: [
      sun,
      { ...constructRandomPlanet(), id: 'planet_1' },
      { ...constructRandomPlanet(), id: 'planet_2' },
      { ...constructRandomPlanet(), id: 'planet_3' },
      { ...constructRandomPlanet(), id: 'planet_4' },
    ],
    debris: []
  }
}

export function constructRandomPlanet(): Planet {
  const maxHealth = getRandomInt(100, 200)
  const colors = ['#fbbf24', '#60a5fa', '#f87171']
  return {
    id: '',
    name: '',
    color: colors[getRandomInt(0, 2)],
    radius: getRandomInt(10, 20),
    health: maxHealth,
    maxHealth: maxHealth,
    rotation: getRandomFloat(0, 360),
    rotationSpeed: 0,
    orbitCenter: { x: CX, y: CY },
    orbitRadius: getRandomInt(100, 400),
    orbitSpeed: getRandomFloat(0.4, 1.0),
    angle: getRandomFloat(0, 5),
    imageName: `planet${getRandomInt(1, 12)}.png`
  }
}

export function shufflePlanets(state: GameState): GameState {
  return {
    ...state,
    planets: state.planets.map(p => {
      if (p.id === 'sun') return p
      return { ...constructRandomPlanet(), id: p.id }
    }),
  }
}