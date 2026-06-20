import { useCallback, useEffect, useState } from 'react'
import './App.css'
import GameCanvas from './components/GameCanvas'
import type { GameState } from './types'

import { createGame, shufflePlanets, tickGame } from './game'


export default function App() {
  const [gameState, setGameState] = useState<GameState>(createGame)

  useEffect(() => {
    setGameState(gameState => shufflePlanets(gameState))
  }, [])

  // const onTick = useCallback((deltaTime: number) => {
  //   // advance orbital angles
  //   for (const planet of gameState.planets) {
  //     planet.angle += planet.orbitSpeed * deltaTime
  //   }

  // }, [])
  const onTick = useCallback((deltaTime: number) => {
    setGameState(prev => tickGame(prev, deltaTime))
  }, [])

  return <GameCanvas state={gameState} setState={setGameState} onTick={onTick} />
}
