import type { Planet, Coordinate } from '../types'

export default function PlanetComponent({ planet, position }: { planet: Planet; position: Coordinate }) {
  const diameter = planet.radius * 2
  const healthPct = planet.health / planet.maxHealth

  return (
    <div
      className="absolute"
      style={{
        left: position.x - planet.radius,
        top: position.y - planet.radius,
        width: diameter,
        height: diameter,
      }}
    >
      <div
        style={{
          // excludes sun; crap solution dont hurt me
          display: planet.id == "sun" ? "none" : "",
          
          position: 'absolute',
          top: -10,
          left: 0,
          width: diameter,
          height: 4,
          backgroundColor: '#374151',
        }}
      >
        <div
          style={{
            width: `${healthPct * 100}%`,
            height: '100%',
            backgroundColor: '#4ade80',
          }}
        />
      </div>
      <svg width={diameter} height={diameter}>
        <circle cx={planet.radius} cy={planet.radius} r={planet.radius} fill={planet.color} />
      </svg>
    </div>
  )
}
