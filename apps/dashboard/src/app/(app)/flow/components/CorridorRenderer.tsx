'use client'

import { useState, useEffect } from 'react'
import { NODES, CORRIDORS } from '../config/jurisdictions'
import { COMPLEXITY_COLORS } from '../config/theme'
import type { Corridor, LensId } from '../config/jurisdictions'

function useTick(ms: number) {
  const [t, setT] = useState(0)
  useEffect(() => {
    const i = setInterval(() => setT((p) => p + 1), ms)
    return () => clearInterval(i)
  }, [ms])
  return t
}

interface CorridorLineProps {
  from: { x: number; y: number }
  to: { x: number; y: number }
  color: string
  thickness?: number
  hovered: boolean
}

function CorridorLine({ from, to, color, thickness = 1.5, hovered }: CorridorLineProps) {
  const t = useTick(30)
  const mx = (from.x + to.x) / 2
  const my = (from.y + to.y) / 2
  const dx = to.x - from.x
  const dy = to.y - from.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  const curve = Math.min(dist * 0.22, 35)
  const nx = -dy / dist
  const ny = dx / dist
  const cx = mx + nx * curve
  const cy = my + ny * curve
  const d = `M${from.x},${from.y} Q${cx},${cy} ${to.x},${to.y}`
  const w = hovered ? thickness + 1.5 : thickness

  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={w}
        opacity={hovered ? 0.5 : 0.12}
        strokeLinecap="round"
      />
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={w}
        opacity={hovered ? 0.9 : 0.4}
        strokeLinecap="round"
        strokeDasharray="6 18"
        strokeDashoffset={-(t * 0.8) % 24}
      />
    </g>
  )
}

interface CorridorRendererProps {
  lens: LensId
  hoveredCorridor: string | null
  onCorridorHover: (label: string | null) => void
}

export function CorridorRenderer({ lens, hoveredCorridor, onCorridorHover }: CorridorRendererProps) {
  if (lens !== 'jurisdiction') return null

  return (
    <g>
      {CORRIDORS.map((c) => {
        const fromNode = NODES[c.from]
        const toNode = NODES[c.to]
        if (!fromNode || !toNode) return null
        const color = COMPLEXITY_COLORS[c.cx]
        const isHovered = hoveredCorridor === c.label

        return (
          <g key={c.label}>
            <CorridorLine
              from={{ x: fromNode.x, y: fromNode.y }}
              to={{ x: toNode.x, y: toNode.y }}
              color={color}
              hovered={isHovered}
            />
            {/* Invisible wider hit area for hover */}
            <line
              x1={fromNode.x}
              y1={fromNode.y}
              x2={toNode.x}
              y2={toNode.y}
              stroke="transparent"
              strokeWidth={16}
              onMouseEnter={() => onCorridorHover(c.label)}
              onMouseLeave={() => onCorridorHover(null)}
              style={{ cursor: 'pointer' }}
            />
          </g>
        )
      })}

      {/* Corridor tooltip */}
      {hoveredCorridor && (() => {
        const c = CORRIDORS.find((co) => co.label === hoveredCorridor)
        if (!c) return null
        const fromNode = NODES[c.from]
        const toNode = NODES[c.to]
        if (!fromNode || !toNode) return null
        const tx = (fromNode.x + toNode.x) / 2
        const ty = (fromNode.y + toNode.y) / 2 - 18

        return (
          <g>
            <rect
              x={tx - 80}
              y={ty - 14}
              width={160}
              height={32}
              rx={6}
              fill="#0F172A"
              stroke="#1E293B"
              strokeWidth={1}
            />
            <text x={tx} y={ty + 1} textAnchor="middle" fill="#F8FAFC" fontSize={10} fontFamily="'DM Sans', sans-serif">
              {c.label}
            </text>
            <text x={tx} y={ty + 13} textAnchor="middle" fill="#94A3B8" fontSize={9} fontFamily="'DM Sans', sans-serif">
              {c.mech}
            </text>
          </g>
        )
      })()}
    </g>
  )
}
