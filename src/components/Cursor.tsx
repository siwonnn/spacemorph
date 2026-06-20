import { useState, useEffect } from "react";

export default function Cursor() {
  const RADIUS = 5;
  const [pos, setPos] = useState([0, 0]);
  const [color, setColor] = useState<string>("grey")

  useEffect(() => {
    const moveHandler = (e: MouseEvent) => setPos([e.clientX, e.clientY]);
    const clickHandler = (e: MouseEvent) => { console.error("clicked")};
    window.addEventListener("mousemove", moveHandler);
    window.addEventListener("mousedown", clickHandler)
    return () => { window.removeEventListener("mousemove", moveHandler); window.removeEventListener("mousedown", clickHandler)};
  }, []);

  return (
    <div style={{
      zIndex: 10,
      position: "fixed",
      left: pos[0] - RADIUS,
      top: pos[1] - RADIUS,
      pointerEvents: "none",
    }}>
      <svg width={RADIUS * 2} height={RADIUS * 2}>
        <circle cx={RADIUS} cy={RADIUS} r={RADIUS} fill="grey" />
      </svg>
    </div>
  );
}