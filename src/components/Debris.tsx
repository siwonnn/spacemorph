import type { Coordinate, Debris } from "../types";

export default function DebrisComponent({
  debris,
  position,
}: {
  debris: Debris;
  position: Coordinate;
}) {
  const diameter = debris.radius * 2;
  return (
    <div
      className="absolute"
      style={{
        left: position.x - debris.radius,
        top: position.y - debris.radius,
        width: diameter,
        height: diameter,
      }}
    >
      <svg width={diameter} height={diameter}>
        <circle
          cx={debris.radius}
          cy={debris.radius}
          r={debris.radius}
          fill={"gray"}
        />
      </svg>
    </div>
  );
}
