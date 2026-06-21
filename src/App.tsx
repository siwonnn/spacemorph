import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import GameCanvas from './components/GameCanvas'
import { getPlanetPosition, type GameState, type ExplosionEvent } from './types'
import { calculateProgress, createGame, tickGame } from './game'

export default function App() {
  const [gameState, setGameState] = useState<GameState>(createGame())
  const [explosions, setExplosions] = useState<ExplosionEvent[]>([])
  const explodedIds = useRef<Set<string>>(new Set())
  const progress = calculateProgress(gameState)

  useEffect(() => {
    const newlyDestroyed = gameState.planets.filter(
      p => p.destroyed && !explodedIds.current.has(p.id) && p.id !== 'sun'
    )

    if (newlyDestroyed.length === 0) return

    newlyDestroyed.forEach(p => explodedIds.current.add(p.id))

    const colors = ['#f87171', '#fb923c', '#facc15', '#60a5fa', '#ffffff']
    const newExplosions = newlyDestroyed.map((planet): ExplosionEvent => {
      const particles = Array.from({ length: 25 }, (_, i) => {
        const angle = Math.random() * Math.PI * 2
        const speed = 40 + Math.random() * 500
        return {
          id: `${planet.id}-p-${i}-${Math.random().toString(36).slice(2)}`,
          dx: Math.cos(angle) * speed,
          dy: Math.sin(angle) * speed,
          size: 6 + Math.random() * 30,
          color: colors[Math.floor(Math.random() * colors.length)],
          delay: Math.random() * 0.15,
        }
      })
      return {
        id: `${planet.id}-explosion-${Date.now()}`,
        position: getPlanetPosition(planet),
        color: planet.color,
        particles,
      }
    })

    setExplosions(prev => [...prev, ...newExplosions])

    // setGameState(prev => ({
    //   ...prev,
    //   debris: [
    //     ...prev.debris,
    //     ...newlyDestroyed.flatMap(p =>
    //       Array.from({ length: DEBRIS_PER_DEATH }, () => SpawnDebris(getPlanetPosition(p), p, 6))
    //     ),
    //   ],
    // }))
  }, [gameState])
 
  const onTick = useCallback((deltaTime: number) => {
    setGameState(prev => tickGame(prev, deltaTime))
  }, [])

  // round win or lose
  const isWin = progress === 100 && gameState.remainingTime > 0
  const isLose = gameState.remainingTime <= 0
  const isRoundOver = isWin || isLose

  useEffect(() => {
  explodedIds.current.clear()
  setExplosions([])
}, [gameState.round])

  return (
    <GameCanvas
      state={gameState}
      setState={setGameState}
      onTick={onTick}
      progress={progress}
      explosions={explosions}
      removeExplosion={(id) => setExplosions(prev => prev.filter(e => e.id !== id))}
      round={gameState.round}
      isRoundOver={isRoundOver}
      isWin={isWin}
    />
  )
}
