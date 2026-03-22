import { useRef, useEffect, useState } from 'react'
import type { AtlasNode, LensId } from '../types/atlas'

interface CorridorParticlesProps {
  japanNode: AtlasNode
  fijiNode: AtlasNode
  positionOf: (node: AtlasNode) => { x: number; y: number }
  activeLens: LensId
}

interface ParticleState {
  cx: number
  cy: number
  opacity: number
}

export function CorridorParticles({
  japanNode,
  fijiNode,
  positionOf,
  activeLens,
}: CorridorParticlesProps) {
  const rafRef = useRef<number>(0)
  const [particles, setParticles] = useState<ParticleState[]>([
    { cx: 0, cy: 0, opacity: 0 },
    { cx: 0, cy: 0, opacity: 0 },
    { cx: 0, cy: 0, opacity: 0 },
  ])

  const visible = activeLens !== 'constellation'
  const from = positionOf(japanNode)
  const to = positionOf(fijiNode)
  const fromRef = useRef(from)
  const toRef = useRef(to)
  fromRef.current = from
  toRef.current = to

  useEffect(() => {
    if (!visible) return

    const offsets = [0, 0.33, 0.67]

    function animate(time: number) {
      const f = fromRef.current
      const t = toRef.current
      const next = offsets.map((offset) => {
        const progress = ((time * 0.00008 + offset) % 1)
        return {
          cx: f.x + (t.x - f.x) * progress,
          cy: f.y + (t.y - f.y) * progress,
          opacity: 0.4 * Math.sin(progress * Math.PI),
        }
      })
      setParticles(next)
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [visible])

  if (!visible) return null

  return (
    <g>
      {particles.map((p, i) => (
        <circle
          key={i}
          cx={p.cx}
          cy={p.cy}
          r={0.2}
          fill="#e8d8a0"
          opacity={p.opacity}
        />
      ))}
    </g>
  )
}
