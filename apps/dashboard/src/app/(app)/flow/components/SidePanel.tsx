'use client'

import { NODES, AGENTS } from '../config/jurisdictions'
import {
  SURFACE,
  BORDER,
  BORDER_HOVER,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_MUTED,
  RISK_COLORS,
  STATUS_COLORS,
  AGENT_STATUS_COLORS,
  CANVAS_BG,
} from '../config/theme'
import type { LensId, JurisdictionNode, BoardConfig, AgentConfig } from '../config/jurisdictions'
import type { BoardData } from '../hooks/useBoards'
import type { CandidateStats } from '../hooks/useCandidates'
import type { AgentData } from '../hooks/useAgents'

interface SidePanelProps {
  lens: LensId
  selectedNode: string | null
  onClose: () => void
  liveBoards?: BoardData[]
  candidateStats?: CandidateStats
  liveAgents?: AgentData[]
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4
      className="mb-2 text-[10px] font-semibold uppercase tracking-wider"
      style={{ color: TEXT_MUTED, fontFamily: "'DM Sans', sans-serif" }}
    >
      {children}
    </h4>
  )
}

function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px]" style={{ color: TEXT_MUTED, fontFamily: "'DM Sans', sans-serif" }}>
        {label}
      </span>
      <span
        className="text-sm font-semibold"
        style={{ color: color || TEXT_PRIMARY, fontFamily: "'JetBrains Mono', monospace" }}
      >
        {value}
      </span>
    </div>
  )
}

function JurisdictionDetail({ nodeId, node }: { nodeId: string; node: JurisdictionNode }) {
  const riskCol = RISK_COLORS[node.risk]

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-2xl">{node.flag}</span>
        <div>
          <h3 className="text-sm font-semibold" style={{ color: TEXT_PRIMARY, fontFamily: "'DM Sans', sans-serif" }}>
            {node.name}
          </h3>
          <p className="text-xs" style={{ color: TEXT_MUTED }}>{node.sub}</p>
        </div>
        <div
          className="ml-auto rounded px-2 py-0.5 text-[10px] font-semibold"
          style={{ background: riskCol + '20', color: riskCol, fontFamily: "'JetBrains Mono', monospace" }}
        >
          {node.risk.toUpperCase()} RISK
        </div>
      </div>

      {/* KPIs */}
      <div>
        <SectionTitle>Live Data</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Candidates" value={node.candidates} />
          <Stat label="Employers" value={node.employers} />
          <Stat label="Jobs" value={node.jobs} />
        </div>
      </div>

      {/* Laws */}
      <div>
        <SectionTitle>Governing Laws</SectionTitle>
        <div className="flex flex-wrap gap-1.5">
          {node.laws.map((law) => (
            <span
              key={law}
              className="rounded px-2 py-0.5 text-[10px] font-medium"
              style={{ background: BORDER, color: TEXT_SECONDARY, fontFamily: "'JetBrains Mono', monospace" }}
            >
              {law}
            </span>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[10px]" style={{ color: TEXT_MUTED }}>Max Penalty</span>
          <span
            className="text-xs font-semibold"
            style={{ color: riskCol, fontFamily: "'JetBrains Mono', monospace" }}
          >
            {node.penalty}
          </span>
        </div>
      </div>

      {/* Legal Summary */}
      <div>
        <SectionTitle>Legal Summary</SectionTitle>
        <p className="text-xs leading-relaxed" style={{ color: TEXT_SECONDARY, fontFamily: "'DM Sans', sans-serif" }}>
          {node.legalSummary}
        </p>
      </div>

      {/* Transfer Note */}
      <div>
        <SectionTitle>Cross-Border Transfers</SectionTitle>
        <p className="text-xs leading-relaxed" style={{ color: TEXT_SECONDARY, fontFamily: "'DM Sans', sans-serif" }}>
          {node.transferNote}
        </p>
      </div>

      {/* Boards */}
      <div>
        <SectionTitle>Boards ({node.boards.length})</SectionTitle>
        <div className="flex flex-col gap-2">
          {node.boards.map((board) => (
            <BoardCard key={board.id} board={board} />
          ))}
        </div>
      </div>
    </div>
  )
}

function BoardCard({ board }: { board: BoardConfig }) {
  const statusCol = STATUS_COLORS[board.status]

  return (
    <div className="rounded-md p-3" style={{ background: CANVAS_BG, border: `1px solid ${BORDER}` }}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold" style={{ color: TEXT_PRIMARY, fontFamily: "'DM Sans', sans-serif" }}>
          {board.name}
        </span>
        <span
          className="rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase"
          style={{ background: statusCol + '20', color: statusCol, fontFamily: "'JetBrains Mono', monospace" }}
        >
          {board.status}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-2 h-1 w-full overflow-hidden rounded-full" style={{ background: BORDER }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${board.progress}%`, background: statusCol }}
        />
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        <div>
          <div className="text-[10px]" style={{ color: TEXT_MUTED }}>Cand.</div>
          <div className="text-xs font-medium" style={{ color: TEXT_PRIMARY, fontFamily: "'JetBrains Mono', monospace" }}>{board.candidates}</div>
        </div>
        <div>
          <div className="text-[10px]" style={{ color: TEXT_MUTED }}>Jobs</div>
          <div className="text-xs font-medium" style={{ color: TEXT_PRIMARY, fontFamily: "'JetBrains Mono', monospace" }}>{board.jobs}</div>
        </div>
        <div>
          <div className="text-[10px]" style={{ color: TEXT_MUTED }}>Emp.</div>
          <div className="text-xs font-medium" style={{ color: TEXT_PRIMARY, fontFamily: "'JetBrains Mono', monospace" }}>{board.employers}</div>
        </div>
        <div>
          <div className="text-[10px]" style={{ color: TEXT_MUTED }}>Wk Reg</div>
          <div className="text-xs font-medium" style={{ color: TEXT_PRIMARY, fontFamily: "'JetBrains Mono', monospace" }}>{board.weeklyReg}</div>
        </div>
      </div>

      {/* Todo list */}
      {board.todoList.length > 0 && (
        <div className="mt-2 border-t pt-2" style={{ borderColor: BORDER }}>
          {board.todoList.map((item, i) => (
            <div key={i} className="flex items-start gap-1.5 py-0.5">
              <span className="mt-0.5 text-[10px]" style={{ color: TEXT_MUTED }}>{'○'}</span>
              <span className="text-[10px] leading-tight" style={{ color: TEXT_SECONDARY }}>{item}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function BoardDetail({ nodeId, node, liveBoards }: { nodeId: string; node: JurisdictionNode; liveBoards?: BoardData[] }) {
  // Overlay live counts onto config board data
  const enrichedBoards = node.boards.map((configBoard) => {
    const live = liveBoards?.find((lb) => lb.slug === configBoard.id || lb.name.toLowerCase().includes(configBoard.name.toLowerCase()))
    if (live) {
      return { ...configBoard, candidates: live.candidateCount, jobs: live.jobCount, employers: live.employerCount }
    }
    return configBoard
  })

  const totalCandidates = enrichedBoards.reduce((sum, b) => sum + b.candidates, 0) || node.candidates
  const totalEmployers = enrichedBoards.reduce((sum, b) => sum + b.employers, 0) || node.employers
  const totalJobs = enrichedBoards.reduce((sum, b) => sum + b.jobs, 0) || node.jobs
  const hasLive = liveBoards && liveBoards.length > 0

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-2xl">{node.flag}</span>
        <div>
          <h3 className="text-sm font-semibold" style={{ color: TEXT_PRIMARY, fontFamily: "'DM Sans', sans-serif" }}>
            {node.name} Boards
          </h3>
          <p className="text-xs" style={{ color: TEXT_MUTED }}>{node.boards.length} board{node.boards.length !== 1 ? 's' : ''}</p>
        </div>
        {hasLive && (
          <span className="ml-auto text-[9px]" style={{ color: '#22C55E', fontFamily: "'JetBrains Mono', monospace" }}>LIVE</span>
        )}
      </div>

      {/* Aggregate KPIs */}
      <div>
        <SectionTitle>Totals</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Candidates" value={totalCandidates} />
          <Stat label="Employers" value={totalEmployers} />
          <Stat label="Jobs" value={totalJobs} />
        </div>
      </div>

      {/* Board cards */}
      <div>
        <SectionTitle>Boards</SectionTitle>
        <div className="flex flex-col gap-2">
          {enrichedBoards.map((board) => (
            <BoardCard key={board.id} board={board} />
          ))}
        </div>
      </div>
    </div>
  )
}

function AgentDetail({ agentId, liveAgents }: { agentId: string; liveAgents?: AgentData[] }) {
  // Try live data first, fall back to mock config
  const liveAgent = liveAgents?.find((a) => a.id === agentId)
  const mockAgent = AGENTS.find((a) => a.id === agentId)

  if (!liveAgent && !mockAgent) return null

  const name = liveAgent?.name ?? mockAgent!.name
  const status = liveAgent?.health ?? mockAgent!.status
  const runs7d = liveAgent?.runs7d ?? mockAgent!.runs7d
  const success = liveAgent?.successRate ?? mockAgent!.success
  const lastRun = liveAgent?.lastRun ?? mockAgent!.lastRun
  const tier = mockAgent?.tier ?? 1 // tier not in DB, always from config
  const color = AGENT_STATUS_COLORS[status]
  const recentErrors = liveAgent?.recentErrors ?? []

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: color + '20' }}>
          <div className="h-3 w-3 rounded-full" style={{ background: color }} />
        </div>
        <div>
          <h3 className="text-sm font-semibold" style={{ color: TEXT_PRIMARY, fontFamily: "'DM Sans', sans-serif" }}>
            {name}
          </h3>
          <p className="text-xs" style={{ color: color }}>
            {status.charAt(0).toUpperCase() + status.slice(1)} · Tier {tier}
          </p>
        </div>
        {liveAgent && (
          <span className="ml-auto text-[9px]" style={{ color: '#22C55E', fontFamily: "'JetBrains Mono', monospace" }}>LIVE</span>
        )}
      </div>

      {/* Stats */}
      <div>
        <SectionTitle>7-Day Performance</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Runs" value={runs7d} />
          <Stat label="Success" value={`${success}%`} color={success >= 95 ? '#22C55E' : success >= 85 ? '#F59E0B' : '#EF4444'} />
          <Stat label="Last Run" value={lastRun ?? 'never'} />
        </div>
      </div>

      {/* Recent errors */}
      {recentErrors.length > 0 && (
        <div>
          <SectionTitle>Recent Errors</SectionTitle>
          <div className="flex flex-col gap-1.5">
            {recentErrors.map((err, i) => (
              <div key={i} className="rounded-md p-2" style={{ background: '#EF444410', border: '1px solid #EF444430' }}>
                <span className="text-[10px] leading-tight" style={{ color: '#FCA5A5', fontFamily: "'JetBrains Mono', monospace" }}>
                  {err.slice(0, 120)}{err.length > 120 ? '...' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tier info */}
      <div>
        <SectionTitle>Autonomy Tier</SectionTitle>
        <div className="rounded-md p-2.5" style={{ background: CANVAS_BG, border: `1px solid ${BORDER}` }}>
          <span className="text-xs" style={{ color: TEXT_SECONDARY, fontFamily: "'DM Sans', sans-serif" }}>
            {tier === 1
              ? 'Fully autonomous — runs without approval'
              : tier === 2
              ? 'Approval required — human review before execution'
              : 'Double confirmation — requires two approvals'}
          </span>
        </div>
      </div>
    </div>
  )
}

export function SidePanel({ lens, selectedNode, onClose, liveBoards, candidateStats, liveAgents }: SidePanelProps) {
  if (!selectedNode) return null

  const node = NODES[selectedNode]

  let content: React.ReactNode = null
  if (lens === 'jurisdiction' && node) {
    content = <JurisdictionDetail nodeId={selectedNode} node={node} />
  } else if (lens === 'board' && node) {
    content = <BoardDetail nodeId={selectedNode} node={node} liveBoards={liveBoards} />
  } else if (lens === 'agent') {
    content = <AgentDetail agentId={selectedNode} liveAgents={liveAgents} />
  } else if (lens === 'flow' && node) {
    content = <JurisdictionDetail nodeId={selectedNode} node={node} />
  }

  if (!content) return null

  return (
    <div
      className="absolute right-0 top-0 z-10 flex h-full w-80 flex-col overflow-hidden border-l"
      style={{
        background: SURFACE,
        borderColor: BORDER,
        animation: 'slideInRight 0.2s ease-out',
      }}
    >
      {/* Close button */}
      <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: BORDER }}>
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: TEXT_MUTED }}>
          {lens} detail
        </span>
        <button
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded transition-colors"
          style={{ color: TEXT_MUTED }}
          onMouseEnter={(e) => (e.currentTarget.style.background = BORDER)}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 2l8 8M10 2l-8 8" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {content}
      </div>
    </div>
  )
}
