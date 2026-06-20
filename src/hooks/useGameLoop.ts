import { useEffect, useRef } from 'react'

export function useGameLoop(tick: (deltaTime: number) => void) {
  const tickRef = useRef(tick)
  tickRef.current = tick

  useEffect(() => {
    let lastTime = performance.now()
    let rafId: number

    const loop = (now: number) => {
      const deltaTime = Math.min((now - lastTime) / 1000, 0.1) // seconds, capped to avoid spiral of death
      lastTime = now
      tickRef.current(deltaTime)
      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [])
}
