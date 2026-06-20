import { useCallback, useMemo } from "react"
import Particles from "react-tsparticles"
import { loadFireworksPreset } from "tsparticles-preset-fireworks"
import type { Engine, ISourceOptions } from "tsparticles-engine"

export default function FireworksParticles({
  emitterPosition,
}: {
  emitterPosition: { x: number; y: number } | null;
}) {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadFireworksPreset(engine);
  }, []);

  const options = useMemo<ISourceOptions>(() => {
    const emitters = emitterPosition
      ? [
          {
            position: {
              x: (emitterPosition.x / window.innerWidth) * 100,
              y: (emitterPosition.y / window.innerHeight) * 100,
            },
            life: { count: 1, duration: 0.1 },
            rate: { quantity: 0, delay: 0 },
            size: { width: 0, height: 0 },
          },
        ]
      : [];

    return {
      preset: "fireworks",
      fullScreen: { enable: false },
      detectRetina: true,
      background: { color: { value: "transparent" } },
      emitters,
    } as ISourceOptions;
  }, [emitterPosition]);

  return (
    <Particles
      id="fireworks"
      init={particlesInit}
      options={options}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  )
}