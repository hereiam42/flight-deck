'use client'

import { NODES, AGENTS } from '../config/jurisdictions'
import { AGENT_POSITIONS } from '../config/positions'
import {
  RISK_COLORS,
  STATUS_COLORS,
  AGENT_STATUS_COLORS,
  SURFACE,
  BORDER,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_MUTED,
  ACCENT_BLUE,
  HUB_RADIUS,
  NODE_RADIUS_MIN,
} from '../config/theme'
import type { LensId, JurisdictionNode } from '../config/jurisdictions'

interface ProgressRingProps {
  cx: number
  cy: number
  r: number
  progress: number
  color: string
}

function ProgressRing({ cx, cy, r, progress, color }: ProgressRingProps) {
  const circ = 2 * Math.PI * r
  const offset = circ - (progress / 100) * circ
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1E293B" strokeWidth={3} />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dashoffset .8s ease' }}
      />
    </g>
  )
}

interface JurisdictionNodeProps {
  id: string
  node: JurisdictionNode
  selected: boolean
  onClick: () => void
}

function JurisdictionNodeView({ id, node, selected, onClick }: JurisdictionNodeProps) {
  const r = node.role === 'hub' ? HUB_RADIUS : NODE_RADIUS_MIN + 4
  const color = RISK_COLORS[node.risk]

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      {/* Selection pulse */}
      {selected && (
        <circle cx={node.x} cy={node.y} r={r + 8} fill="none" stroke={color} strokeWidth={1.5} opacity={0.3}>
          <animate attributeName="r" from={r + 4} to={r + 14} dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" from={0.4} to={0} dur="1.5s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Outer ring — risk color */}
      <circle cx={node.x} cy={node.y} r={r} fill={SURFACE} stroke={color} strokeWidth={selected ? 2.5 : 1.5} />

      {/* Flag */}
      <text x={node.x} y={node.y - 2} textAnchor="middle" fontSize={node.role === 'hub' ? 20 : 16} dominantBaseline="central">
        {node.flag}
      </text>

      {/* Label below */}
      <text x={node.x} y={node.y + r + 14} textAnchor="middle" fill={TEXT_PRIMARY} fontSize={11} fontFamily="'DM Sans', sans-serif" fontWeight={600}>
        {node.name}
      </text>
      <text x={node.x} y={node.y + r + 26} textAnchor="middle" fill={TEXT_MUTED} fontSize={9} fontFamily="'DM Sans', sans-serif">
        {node.sub}
      </text>

      {/* Risk badge */}
      <rect x={node.x + r - 4} y={node.y - r - 2} width={32} height={14} rx={4} fill={color} opacity={0.2} />
      <text x={node.x + r + 12} y={node.y - r + 8} textAnchor="middle" fill={color} fontSize={8} fontFamily="'JetBrains Mono', monospace" fontWeight={500}>
        {node.risk.toUpperCase()}
      </text>

      {/* Hub: candidate count badge */}
      {node.role === 'hub' && node.candidates > 0 && (
        <>
          <rect x={node.x - r - 20} y={node.y - 8} width={24} height={16} rx={4} fill={ACCENT_BLUE} opacity={0.15} />
          <text x={node.x - r - 8} y={node.y + 3} textAnchor="middle" fill={ACCENT_BLUE} fontSize={9} fontFamily="'JetBrains Mono', monospace" fontWeight={600}>
            {node.candidates}
          </text>
        </>
      )}
    </g>
  )
}

interface BoardNodeProps {
  id: string
  node: JurisdictionNode
  selected: boolean
  onClick: () => void
}

function BoardNodeView({ id, node, selected, onClick }: BoardNodeProps) {
  const r = node.role === 'hub' ? HUB_RADIUS : NODE_RADIUS_MIN + 4
  const mainBoard = node.boards[0]
  const statusCol = mainBoard ? STATUS_COLORS[mainBoard.status] : TEXT_MUTED
  const avgProgress = node.boards.length > 0
    ? Math.round(node.boards.reduce((sum, b) => sum + b.progress, 0) / node.boards.length)
    : 0

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      {selected && (
        <circle cx={node.x} cy={node.y} r={r + 8} fill="none" stroke={statusCol} strokeWidth={1.5} opacity={0.3}>
          <animate attributeName="r" from={r + 4} to={r + 14} dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" from={0.4} to={0} dur="1.5s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Progress ring */}
      <ProgressRing cx={node.x} cy={node.y} r={r} progress={avgProgress} color={statusCol} />

      {/* Inner circle */}
      <circle cx={node.x} cy={node.y} r={r - 4} fill={SURFACE} />

      {/* Flag */}
      <text x={node.x} y={node.y - 2} textAnchor="middle" fontSize={node.role === 'hub' ? 18 : 14} dominantBaseline="central">
        {node.flag}
      </text>

      {/* Label */}
      <text x={node.x} y={node.y + r + 14} textAnchor="middle" fill={TEXT_PRIMARY} fontSize={11} fontFamily="'DM Sans', sans-serif" fontWeight={600}>
        {node.name}
      </text>
      <text x={node.x} y={node.y + r + 26} textAnchor="middle" fill={TEXT_MUTED} fontSize={9} fontFamily="'DM Sans', sans-serif">
        {node.boards.length} board{node.boards.length !== 1 ? 's' : ''}
      </text>

      {/* Status badge */}
      {mainBoard && (
        <>
          <rect x={node.x + r - 4} y={node.y - r - 2} width={42} height={14} rx={4} fill={statusCol} opacity={0.2} />
          <text x={node.x + r + 17} y={node.y - r + 8} textAnchor="middle" fill={statusCol} fontSize={8} fontFamily="'JetBrains Mono', monospace" fontWeight={500}>
            {mainBoard.status.toUpperCase()}
          </text>
        </>
      )}
    </g>
  )
}

interface AgentNodeProps {
  agent: typeof AGENTS[number]
  pos: { x: number; y: number }
  selected: boolean
  onClick: () => void
}

function AgentNodeView({ agent, pos, selected, onClick }: AgentNodeProps) {
  const r = 20
  const color = AGENT_STATUS_COLORS[agent.status]

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      {selected && (
        <circle cx={pos.x} cy={pos.y} r={r + 8} fill="none" stroke={color} strokeWidth={1.5} opacity={0.3}>
          <animate attributeName="r" from={r + 4} to={r + 14} dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" from={0.4} to={0} dur="1.5s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Node circle */}
      <circle cx={pos.x} cy={pos.y} r={r} fill={SURFACE} stroke={color} strokeWidth={selected ? 2.5 : 1.5} />

      {/* Status dot */}
      <circle cx={pos.x} cy={pos.y} r={4} fill={color} />

      {/* Label */}
      <text x={pos.x} y={pos.y + r + 14} textAnchor="middle" fill={TEXT_PRIMARY} fontSize={10} fontFamily="'DM Sans', sans-serif" fontWeight={500}>
        {agent.name}
      </text>

      {/* Tier badge */}
      <rect x={pos.x + r - 2} y={pos.y - r - 2} width={20} height={14} rx={4} fill={SURFACE} stroke={BORDER} strokeWidth={1} />
      <text x={pos.x + r + 8} y={pos.y - r + 8} textAnchor="middle" fill={TEXT_SECONDARY} fontSize={8} fontFamily="'JetBrains Mono', monospace">
        T{agent.tier}
      </text>

      {/* Run count */}
      <text x={pos.x} y={pos.y + r + 26} textAnchor="middle" fill={TEXT_MUTED} fontSize={8} fontFamily="'JetBrains Mono', monospace">
        {agent.runs7d} runs · {agent.success}%
      </text>
    </g>
  )
}

interface NodeRendererProps {
  lens: LensId
  selectedNode: string | null
  onNodeClick: (nodeId: string) => void
}

export function NodeRenderer({ lens, selectedNode, onNodeClick }: NodeRendererProps) {
  const entries = Object.entries(NODES)

  if (lens === 'agent') {
    return (
      <g>
        {AGENTS.map((agent) => {
          const pos = AGENT_POSITIONS[agent.id]
          if (!pos) return null
          return (
            <AgentNodeView
              key={agent.id}
              agent={agent}
              pos={pos}
              selected={selectedNode === agent.id}
              onClick={() => onNodeClick(agent.id)}
            />
          )
        })}
      </g>
    )
  }

  return (
    <g>
      {entries.map(([id, node]) => {
        const selected = selectedNode === id

        if (lens === 'board') {
          return (
            <BoardNodeView
              key={id}
              id={id}
              node={node}
              selected={selected}
              onClick={() => onNodeClick(id)}
            />
          )
        }

        // jurisdiction + flow lenses use the same node rendering
        return (
          <JurisdictionNodeView
            key={id}
            id={id}
            node={node}
            selected={selected}
            onClick={() => onNodeClick(id)}
          />
        )
      })}
    </g>
  )
}
