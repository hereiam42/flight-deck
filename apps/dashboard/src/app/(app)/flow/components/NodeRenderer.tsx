'use client'

import { JURISDICTIONS } from '../config/jurisdictions'
import { NODE_POSITIONS } from '../config/positions'
import { deriveBoardPhase } from '../lib/jurisdictionMapping'
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
import type { LensId, JurisdictionConfig } from '../config/jurisdictions'
import type { AgentData } from '../hooks/useAgents'
import type { BoardData } from '../hooks/useBoards'
import type { ReadinessData } from '../hooks/useReadiness'

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
        cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={3}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dashoffset .8s ease' }}
      />
    </g>
  )
}

// --- Jurisdiction Lens Node ---

interface JurisdictionNodeProps {
  id: string
  config: JurisdictionConfig
  pos: { x: number; y: number }
  boards: BoardData[]
  selected: boolean
  onClick: () => void
}

function JurisdictionNodeView({ id, config, pos, boards, selected, onClick }: JurisdictionNodeProps) {
  const r = config.role === 'hub' ? HUB_RADIUS : NODE_RADIUS_MIN + 4
  const color = RISK_COLORS[config.risk]
  const totalCandidates = boards.reduce((sum, b) => sum + b.candidateCount, 0)

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      {selected && (
        <circle cx={pos.x} cy={pos.y} r={r + 8} fill="none" stroke={color} strokeWidth={1.5} opacity={0.3}>
          <animate attributeName="r" from={r + 4} to={r + 14} dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" from={0.4} to={0} dur="1.5s" repeatCount="indefinite" />
        </circle>
      )}
      <circle cx={pos.x} cy={pos.y} r={r} fill={SURFACE} stroke={color} strokeWidth={selected ? 2.5 : 1.5} />
      <text x={pos.x} y={pos.y - 2} textAnchor="middle" fontSize={config.role === 'hub' ? 20 : 16} dominantBaseline="central">
        {config.flag}
      </text>
      <text x={pos.x} y={pos.y + r + 14} textAnchor="middle" fill={TEXT_PRIMARY} fontSize={11} fontFamily="'DM Sans', sans-serif" fontWeight={600}>
        {config.name}
      </text>
      <text x={pos.x} y={pos.y + r + 26} textAnchor="middle" fill={TEXT_MUTED} fontSize={9} fontFamily="'DM Sans', sans-serif">
        {config.sub}
      </text>
      {/* Risk badge */}
      <rect x={pos.x + r - 4} y={pos.y - r - 2} width={32} height={14} rx={4} fill={color} opacity={0.2} />
      <text x={pos.x + r + 12} y={pos.y - r + 8} textAnchor="middle" fill={color} fontSize={8} fontFamily="'JetBrains Mono', monospace" fontWeight={500}>
        {config.risk.toUpperCase()}
      </text>
      {/* Candidate count — live from Supabase, or "—" */}
      {config.role === 'hub' && (
        <>
          <rect x={pos.x - r - 24} y={pos.y - 8} width={28} height={16} rx={4} fill={ACCENT_BLUE} opacity={0.15} />
          <text x={pos.x - r - 10} y={pos.y + 3} textAnchor="middle" fill={ACCENT_BLUE} fontSize={9} fontFamily="'JetBrains Mono', monospace" fontWeight={600}>
            {totalCandidates > 0 ? totalCandidates : '—'}
          </text>
        </>
      )}
    </g>
  )
}

// --- Board Lens Node ---

interface BoardNodeProps {
  id: string
  config: JurisdictionConfig
  pos: { x: number; y: number }
  boards: BoardData[]
  readiness: ReadinessData
  selected: boolean
  onClick: () => void
}

function BoardNodeView({ id, config, pos, boards, readiness, selected, onClick }: BoardNodeProps) {
  const r = config.role === 'hub' ? HUB_RADIUS : NODE_RADIUS_MIN + 4

  // Average readiness across all boards in this jurisdiction — from deterministic assessor
  const boardScores = boards.map((b) => readiness.byBoardId[b.id]?.overall_score ?? 0)
  const avgReadiness = boards.length > 0
    ? Math.round(boardScores.reduce((sum, s) => sum + s, 0) / boards.length)
    : 0

  // Derive phase from readiness score — deterministic, no guessing
  const mainBoard = boards[0]
  const phase = mainBoard ? deriveBoardPhase(avgReadiness, mainBoard.status) : 'research'
  const statusCol = STATUS_COLORS[phase]

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      {selected && (
        <circle cx={pos.x} cy={pos.y} r={r + 8} fill="none" stroke={statusCol} strokeWidth={1.5} opacity={0.3}>
          <animate attributeName="r" from={r + 4} to={r + 14} dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" from={0.4} to={0} dur="1.5s" repeatCount="indefinite" />
        </circle>
      )}
      <ProgressRing cx={pos.x} cy={pos.y} r={r} progress={avgReadiness} color={statusCol} />
      <circle cx={pos.x} cy={pos.y} r={r - 4} fill={SURFACE} />
      <text x={pos.x} y={pos.y - 2} textAnchor="middle" fontSize={config.role === 'hub' ? 18 : 14} dominantBaseline="central">
        {config.flag}
      </text>
      <text x={pos.x} y={pos.y + r + 14} textAnchor="middle" fill={TEXT_PRIMARY} fontSize={11} fontFamily="'DM Sans', sans-serif" fontWeight={600}>
        {config.name}
      </text>
      <text x={pos.x} y={pos.y + r + 26} textAnchor="middle" fill={TEXT_MUTED} fontSize={9} fontFamily="'DM Sans', sans-serif">
        {boards.length} board{boards.length !== 1 ? 's' : ''} · {avgReadiness}%
      </text>
      {/* Phase badge */}
      <rect x={pos.x + r - 4} y={pos.y - r - 2} width={42} height={14} rx={4} fill={statusCol} opacity={0.2} />
      <text x={pos.x + r + 17} y={pos.y - r + 8} textAnchor="middle" fill={statusCol} fontSize={8} fontFamily="'JetBrains Mono', monospace" fontWeight={500}>
        {phase.toUpperCase()}
      </text>
    </g>
  )
}

// --- Agent Lens Node ---

interface AgentNodeProps {
  agent: AgentData
  pos: { x: number; y: number }
  selected: boolean
  onClick: () => void
}

function AgentNodeView({ agent, pos, selected, onClick }: AgentNodeProps) {
  const r = 20
  const color = AGENT_STATUS_COLORS[agent.health]

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      {selected && (
        <circle cx={pos.x} cy={pos.y} r={r + 8} fill="none" stroke={color} strokeWidth={1.5} opacity={0.3}>
          <animate attributeName="r" from={r + 4} to={r + 14} dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" from={0.4} to={0} dur="1.5s" repeatCount="indefinite" />
        </circle>
      )}
      <circle cx={pos.x} cy={pos.y} r={r} fill={SURFACE} stroke={color} strokeWidth={selected ? 2.5 : 1.5} />
      <circle cx={pos.x} cy={pos.y} r={4} fill={color} />
      <text x={pos.x} y={pos.y + r + 14} textAnchor="middle" fill={TEXT_PRIMARY} fontSize={10} fontFamily="'DM Sans', sans-serif" fontWeight={500}>
        {agent.name}
      </text>
      {/* Tier badge */}
      <rect x={pos.x + r - 2} y={pos.y - r - 2} width={20} height={14} rx={4} fill={SURFACE} stroke={BORDER} strokeWidth={1} />
      <text x={pos.x + r + 8} y={pos.y - r + 8} textAnchor="middle" fill={TEXT_SECONDARY} fontSize={8} fontFamily="'JetBrains Mono', monospace">
        T{agent.tier}
      </text>
      {/* Run count — real from DB */}
      <text x={pos.x} y={pos.y + r + 26} textAnchor="middle" fill={TEXT_MUTED} fontSize={8} fontFamily="'JetBrains Mono', monospace">
        {agent.runs7d} runs · {agent.successRate}%
      </text>
    </g>
  )
}

// --- Main Renderer ---

interface NodeRendererProps {
  lens: LensId
  selectedNode: string | null
  onNodeClick: (nodeId: string) => void
  liveAgents: AgentData[]
  agentPositions: Record<string, { x: number; y: number }>
  boardsByJurisdiction: Record<string, BoardData[]>
  readiness: ReadinessData
}

export function NodeRenderer({
  lens, selectedNode, onNodeClick,
  liveAgents, agentPositions, boardsByJurisdiction, readiness,
}: NodeRendererProps) {
  const jurisdictionEntries = Object.entries(JURISDICTIONS)

  if (lens === 'agent') {
    if (liveAgents.length === 0) {
      return (
        <g>
          <text x={480} y={270} textAnchor="middle" fill={TEXT_MUTED} fontSize={12} fontFamily="'DM Sans', sans-serif">
            No agents configured
          </text>
        </g>
      )
    }
    return (
      <g>
        {liveAgents.map((agent) => {
          const pos = agentPositions[agent.id]
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
      {jurisdictionEntries.map(([id, config]) => {
        const pos = NODE_POSITIONS[id]
        if (!pos) return null
        const boards = boardsByJurisdiction[id] || []
        const selected = selectedNode === id

        if (lens === 'board') {
          return (
            <BoardNodeView
              key={id} id={id} config={config} pos={pos}
              boards={boards} readiness={readiness}
              selected={selected} onClick={() => onNodeClick(id)}
            />
          )
        }

        return (
          <JurisdictionNodeView
            key={id} id={id} config={config} pos={pos}
            boards={boards}
            selected={selected} onClick={() => onNodeClick(id)}
          />
        )
      })}
    </g>
  )
}
