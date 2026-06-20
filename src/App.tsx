import { useRef, useCallback, useState } from 'react'
import './App.css'
import GameCanvas from './components/GameCanvas'
import type { GameState } from './types'

const CX = window.innerWidth / 2
const CY = window.innerHeight / 2

const initialState: GameState = {
  planets: [
    {
      id: 'sun',
      name: 'Sun',
      color: '#fbbf24',
      radius: 40,
      health: -1,
      maxHealth: -1,
      orbitCenter: { x: CX, y: CY },
      orbitRadius: 0,
      orbitSpeed: 0,
      angle: 0,
    },
    {
      id: 'earth',
      name: 'Earth',
      color: '#60a5fa',
      radius: 16,
      health: 100,
      maxHealth: 100,
      orbitCenter: { x: CX, y: CY },
      orbitRadius: 180,
      orbitSpeed: 0.6,
      angle: 0,
    },
    {
      id: 'mars',
      name: 'Mars',
      color: '#f87171',
      radius: 12,
      health: 80,
      maxHealth: 80,
      orbitCenter: { x: CX, y: CY },
      orbitRadius: 290,
      orbitSpeed: 0.35,
      angle: 1.2,
    },
  ],
  debris: [],
}


export default function App() {
  const [gameState, setGameState] = useState<GameState>(initialState)

  const onTick = useCallback((deltaTime: number) => {
    // advance orbital angles
    for (const planet of gameState.planets) {
      planet.angle += planet.orbitSpeed * deltaTime
    }

  }, [])

  return <GameCanvas state={gameState} onTick={onTick} />
}
