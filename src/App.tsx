import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import GameCanvas from './components/GameCanvas'
import TitleScreen from './components/TitleScreen'
import { getPlanetPosition, type GameState, type ExplosionEvent } from './types'
import { calculateProgress, constructBossPlanet, createGame, tickGame } from './game'

export default function App() {
  const [gameState, setGameState] = useState<GameState>(createGame())
  const [explosions, setExplosions] = useState<ExplosionEvent[]>([])
  const [gameStarted, setGameStarted] = useState(false)
  const explodedIds = useRef<Set<string>>(new Set())
  const bossIntroTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const progress = calculateProgress(gameState)

  // Planet destruction explosions (scaled up for boss)
  useEffect(() => {
    const newlyDestroyed = gameState.planets.filter(
      p => p.destroyed && !explodedIds.current.has(p.id) && p.id !== 'sun'
    )

    if (newlyDestroyed.length === 0) return

    newlyDestroyed.forEach(p => explodedIds.current.add(p.id))

    const colors = ['#f87171', '#fb923c', '#facc15', '#60a5fa', '#ffffff']
    const newExplosions = newlyDestroyed.map((planet): ExplosionEvent => {
      const isBoss = planet.id === 'boss'
      const particleCount = isBoss ? 60 : 25
      const particles = Array.from({ length: particleCount }, (_, i) => {
        const angle = Math.random() * Math.PI * 2
        const speed = (isBoss ? 80 : 40) + Math.random() * (isBoss ? 750 : 500)
        return {
          id: `${planet.id}-p-${i}-${Math.random().toString(36).slice(2)}`,
          dx: Math.cos(angle) * speed,
          dy: Math.sin(angle) * speed,
          size: (isBoss ? 12 : 6) + Math.random() * (isBoss ? 55 : 30),
          color: isBoss
            ? ['#ff4444', '#ff8800', '#ffff00', '#ffffff', '#ff66ff'][Math.floor(Math.random() * 5)]
            : colors[Math.floor(Math.random() * colors.length)],
          delay: Math.random() * (isBoss ? 0.25 : 0.15),
        }
      })
      return {
        dimensions: { width: 280, height: 280 },
        id: `${planet.id}-explosion-${Date.now()}`,
        position: getPlanetPosition(planet),
        color: planet.color,
        particles,
      }
    })

    setExplosions(prev => [...prev, ...newExplosions])
  }, [gameState])

  // Boss intro: wait for debris to slam into sun, then explode and reveal boss
  useEffect(() => {
    if (gameState.bossPhase !== 'intro') return

    bossIntroTimerRef.current = setTimeout(() => {
      const cx = window.innerWidth / 2
      const cy = window.innerHeight / 2
      const bossColors = ['#ff4444', '#ff8800', '#ffff00', '#ffffff', '#ff66ff']

      // Cluster of large explosions bursting from the sun's position
      const clusterExplosions: ExplosionEvent[] = Array.from({ length: 7 }, (_, i) => {
        const angle = (i / 7) * Math.PI * 2
        const offset = i === 0 ? 0 : 55 + Math.random() * 35
        const pos = { x: cx + Math.cos(angle) * offset, y: cy + Math.sin(angle) * offset }
        const particles = Array.from({ length: 35 }, (_, j) => {
          const pAngle = Math.random() * Math.PI * 2
          const speed = 90 + Math.random() * 700
          return {
            id: `boss-intro-${i}-${j}`,
            dx: Math.cos(pAngle) * speed,
            dy: Math.sin(pAngle) * speed,
            size: 10 + Math.random() * 45,
            color: bossColors[Math.floor(Math.random() * bossColors.length)],
            delay: Math.random() * 0.25,
          }
        })
        return {
          dimensions: { width: 600, height: 600 },
          id: `boss-intro-exp-${i}-${Date.now()}`,
          position: pos,
          color: '#ff4444',
          particles,
        }
      })

      setExplosions(prev => [...prev, ...clusterExplosions])

      setGameState(prev => {
        if (prev.bossPhase !== 'intro') return prev
        return {
          ...prev,
          bossPhase: 'fight',
          planets: [constructBossPlanet(prev.round)],
          debris: [],
          remainingTime: prev.timeLimit,
        }
      })
    }, 2500)

    return () => {
      if (bossIntroTimerRef.current) clearTimeout(bossIntroTimerRef.current)
    }
  }, [gameState.bossPhase])

  const onTick = useCallback((deltaTime: number) => {
    setGameState(prev => tickGame(prev, deltaTime))
  }, [])

  // Exclude intro phase from round-over checks (no targets exist yet)
  const isWin = progress === 100 && gameState.remainingTime > 0 && gameState.bossPhase !== 'intro'
  const isLose = gameState.remainingTime <= 0 && gameState.bossPhase !== 'intro'
  const isRoundOver = isWin || isLose

  useEffect(() => {
    explodedIds.current.clear()
    setExplosions([])
  }, [gameState.round])

  return (
    <>
      {!gameStarted ? (
        <TitleScreen onStart={() => setGameStarted(true)} />
      ) : (
        <GameCanvas
          state={gameState}
          setState={setGameState}
          onTick={onTick}
          progress={progress}
          explosions={explosions}
          removeExplosion={(id) => setExplosions(prev => prev.filter(e => e.id !== id))}
          addExplosion={(e) => setExplosions(prev => [...prev, e])}
          round={gameState.round}
          isRoundOver={isRoundOver}
          isWin={isWin}
          bossPhase={gameState.bossPhase}
        />
      )}
    </>
  )
}
