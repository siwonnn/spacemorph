import { useEffect, useState, useRef, type CSSProperties } from "react"
import type { Coordinate } from "../types"

type Particle = {
  id: string
  dx: number
  dy: number
  size: number
  color: string
  delay: number
}

export default function Explosion({
  position,
  particles,
  onDone,
  gifDuration = 5000,
}: {
  position: Coordinate
  particles: Particle[]
  onDone: () => void
  gifDuration?: number
}) {
  const [showGif, setShowGif] = useState(true)
  const onDoneRef = useRef(onDone)
  const imgRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    onDoneRef.current = onDone
  }, [onDone])

  useEffect(() => {
    const hideTimer = window.setTimeout(() => {
      if (imgRef.current) {
        imgRef.current.style.display = "none"
        imgRef.current.src = ""
      }
      setShowGif(false)
    }, gifDuration)

    const doneTimer = window.setTimeout(() => {
      onDoneRef.current()
    }, 900)

    return () => {
      window.clearTimeout(hideTimer)
      window.clearTimeout(doneTimer)
    }
  }, [gifDuration])

  return (
    <div
      className="pointer-events-none"
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        width: 200,
        height: 200,
        transform: "translate(-50%, -50%)",
        zIndex: 9999,
        pointerEvents: "none",
      }}
    >
      {showGif && (
        <img
          ref={imgRef}
          src="/assets/explosion.gif"
          alt="explosion"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            userSelect: "none",
            display: "block",
          } as CSSProperties}
        />
      )}

      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            transform: `translate(-50%, -50%)`,
            animation: `explode 900ms ease-out forwards`,
            animationDelay: `${particle.delay}s`,
            "--dx": `${particle.dx}px`,
            "--dy": `${particle.dy}px`,
            pointerEvents: "none",
          } as CSSProperties} 
        />
      ))}
    </div>
  )
}