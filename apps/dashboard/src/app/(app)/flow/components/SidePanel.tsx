'use client'

import { JURISDICTIONS } from '../config/jurisdictions'
import {
  SURFACE, BORDER, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED,
  RISK_COLORS, STATUS_COLORS, AGENT_STATUS_COLORS, CANVAS_BG,
} from '../config/theme'
import { deriveBoardPhase } from '../lib/jurisdictionMapping'
import type { LensId, JurisdictionConfig } from '../config/jurisdictions'
import type { BoardData } from '../hooks/useBoards'
import type { AgentData } from '../hooks/useAgents'
import type { ReadinessData, ReadinessResult } from '../hooks/useReadiness'
import type { BoardTaskData } from '../hooks/useBoardTasks'

interface SidePanelProps {
  lens: LensId
  selectedNode: string | null
  onClose: () => void
  boardsByJurisdiction: Record<string, BoardData[]>
  readiness: ReadinessData
  tasksByBoardId: Record<string, BoardTaskData[]>
  liveAgents: AgentData[]
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider"
      style={{ color: TEXT_MUTED, fontFamily: "'DM Sans', sans-serif" }}>
      {children}
    </h4>
  )
}

function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px]" style={{ color: TEXT_MUTED, fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
      <span className="text-sm font-semibold" style={{ color: color || TEXT_PRIMARY, fontFamily: "'JetBrains Mono', monospace" }}>
        {value}
      </span>
    </div>
  )
}

const TASK_STATUS_ICON: Record<string, { icon: string; color: string }> = {
  done: { icon: '●', color: '#22C55E' },
  in_progress: { icon: '◐', color: '#F59E0B' },
  pending: { icon: '○', color: '#64748B' },
  blocked: { icon: '✕', color: '#EF4444' },
  proposed: { icon: '◌', color: '#475569' },
}

// --- Jurisdiction Detail ---

function JurisdictionDetail({ config, boards }: { config: JurisdictionConfig; boards: BoardData[] }) {
  const riskCol = RISK_COLORS[config.risk]
  const totalCandidates = boards.reduce((sum, b) => sum + b.candidateCount, 0)
  const totalEmployers = boards.reduce((sum, b) => sum + b.employerCount, 0)
  const totalJobs = boards.reduce((sum, b) => sum + b.jobCount, 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{config.flag}</span>
        <div>
          <h3 className="text-sm font-semibold" style={{ color: TEXT_PRIMARY, fontFamily: "'DM Sans', sans-serif" }}>{config.name}</h3>
          <p className="text-xs" style={{ color: TEXT_MUTED }}>{config.sub}</p>
        </div>
        <div className="ml-auto rounded px-2 py-0.5 text-[10px] font-semibold"
          style={{ background: riskCol + '20', color: riskCol, fontFamily: "'JetBrains Mono', monospace" }}>
          {config.risk.toUpperCase()} RISK
        </div>
      </div>

      <div>
        <SectionTitle>Live Data</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Candidates" value={boards.length > 0 ? totalCandidates : '—'} />
          <Stat label="Employers" value={boards.length > 0 ? totalEmployers : '—'} />
          <Stat label="Jobs" value={boards.length > 0 ? totalJobs : '—'} />
        </div>
      </div>

      <div>
        <SectionTitle>Governing Laws</SectionTitle>
        <div className="flex flex-wrap gap-1.5">
          {config.laws.map((law) => (
            <span key={law} className="rounded px-2 py-0.5 text-[10px] font-medium"
              style={{ background: BORDER, color: TEXT_SECONDARY, fontFamily: "'JetBrains Mono', monospace" }}>
              {law}
            </span>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[10px]" style={{ color: TEXT_MUTED }}>Max Penalty</span>
          <span className="text-xs font-semibold" style={{ color: riskCol, fontFamily: "'JetBrains Mono', monospace" }}>
            {config.penalty}
          </span>
        </div>
      </div>

      <div>
        <SectionTitle>Legal Summary</SectionTitle>
        <p className="text-xs leading-relaxed" style={{ color: TEXT_SECONDARY, fontFamily: "'DM Sans', sans-serif" }}>
          {config.legalSummary}
        </p>
      </div>

      <div>
        <SectionTitle>Cross-Border Transfers</SectionTitle>
        <p className="text-xs leading-relaxed" style={{ color: TEXT_SECONDARY, fontFamily: "'DM Sans', sans-serif" }}>
          {config.transferNote}
        </p>
      </div>

      {boards.length > 0 && (
        <div>
          <SectionTitle>Boards ({boards.length})</SectionTitle>
          <div className="flex flex-col gap-1.5">
            {boards.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded px-2 py-1.5"
                style={{ background: CANVAS_BG, border: `1px solid ${BORDER}` }}>
                <span className="text-xs font-medium" style={{ color: TEXT_PRIMARY }}>{b.name}</span>
                <span className="text-[10px]" style={{ color: TEXT_MUTED, fontFamily: "'JetBrains Mono', monospace" }}>
                  {b.candidateCount}c · {b.jobCount}j · {b.employerCount}e
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// --- Board Detail ---

function BoardDetail({
  config, boards, readiness, tasksByBoardId,
}: {
  config: JurisdictionConfig
  boards: BoardData[]
  readiness: ReadinessData
  tasksByBoardId: Record<string, BoardTaskData[]>
}) {
  const totalCandidates = boards.reduce((sum, b) => sum + b.candidateCount, 0)
  const totalEmployers = boards.reduce((sum, b) => sum + b.employerCount, 0)
  const totalJobs = boards.reduce((sum, b) => sum + b.jobCount, 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{config.flag}</span>
        <div>
          <h3 className="text-sm font-semibold" style={{ color: TEXT_PRIMARY, fontFamily: "'DM Sans', sans-serif" }}>
            {config.name} Boards
          </h3>
          <p className="text-xs" style={{ color: TEXT_MUTED }}>{boards.length} board{boards.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div>
        <SectionTitle>Totals</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Candidates" value={boards.length > 0 ? totalCandidates : '—'} />
          <Stat label="Employers" value={boards.length > 0 ? totalEmployers : '—'} />
          <Stat label="Jobs" value={boards.length > 0 ? totalJobs : '—'} />
        </div>
      </div>

      <div>
        <SectionTitle>Boards</SectionTitle>
        <div className="flex flex-col gap-2">
          {boards.map((board) => {
            const r = readiness.byBoardId[board.id]
            const tasks = tasksByBoardId[board.id] || []
            const phase = deriveBoardPhase(r?.overall_score ?? null, board.status)
            return <LiveBoardCard key={board.id} board={board} readiness={r} tasks={tasks} phase={phase} />
          })}
          {boards.length === 0 && (
            <p className="text-xs" style={{ color: TEXT_MUTED }}>No boards in database for this jurisdiction.</p>
          )}
        </div>
      </div>
    </div>
  )
}

// --- Board Card with real tasks ---

function LiveBoardCard({
  board, readiness, tasks, phase,
}: {
  board: BoardData
  readiness?: ReadinessResult
  tasks: BoardTaskData[]
  phase: string
}) {
  const statusCol = STATUS_COLORS[phase as keyof typeof STATUS_COLORS] || TEXT_MUTED
  const score = readiness?.overall_score ?? 0
  const doneCount = tasks.filter((t) => t.status === 'done').length
  const totalCount = tasks.length

  return (
    <div className="rounded-md p-3" style={{ background: CANVAS_BG, border: `1px solid ${BORDER}` }}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold" style={{ color: TEXT_PRIMARY, fontFamily: "'DM Sans', sans-serif" }}>
          {board.name}
        </span>
        <span className="rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase"
          style={{ background: statusCol + '20', color: statusCol, fontFamily: "'JetBrains Mono', monospace" }}>
          {phase}
        </span>
      </div>

      {/* Progress bar — from readiness assessor, not hardcoded */}
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[10px]" style={{ color: TEXT_MUTED }}>Readiness</span>
        <span className="text-[10px] font-semibold" style={{ color: statusCol, fontFamily: "'JetBrains Mono', monospace" }}>
          {score}%
        </span>
      </div>
      <div className="mb-2 h-1 w-full overflow-hidden rounded-full" style={{ background: BORDER }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, background: statusCol }} />
      </div>

      {/* KPIs */}
      <div className="mb-2 grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-[10px]" style={{ color: TEXT_MUTED }}>Cand.</div>
          <div className="text-xs font-medium" style={{ color: TEXT_PRIMARY, fontFamily: "'JetBrains Mono', monospace" }}>{board.candidateCount}</div>
        </div>
        <div>
          <div className="text-[10px]" style={{ color: TEXT_MUTED }}>Jobs</div>
          <div className="text-xs font-medium" style={{ color: TEXT_PRIMARY, fontFamily: "'JetBrains Mono', monospace" }}>{board.jobCount}</div>
        </div>
        <div>
          <div className="text-[10px]" style={{ color: TEXT_MUTED }}>Emp.</div>
          <div className="text-xs font-medium" style={{ color: TEXT_PRIMARY, fontFamily: "'JetBrains Mono', monospace" }}>{board.employerCount}</div>
        </div>
      </div>

      {/* Task list — from board_tasks table, not hardcoded */}
      {totalCount > 0 && (
        <div className="border-t pt-2" style={{ borderColor: BORDER }}>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[10px]" style={{ color: TEXT_MUTED }}>Tasks</span>
            <span className="text-[10px]" style={{ color: TEXT_MUTED, fontFamily: "'JetBrains Mono', monospace" }}>
              {doneCount}/{totalCount}
            </span>
          </div>
          {tasks.filter((t) => t.status !== 'done').slice(0, 6).map((task) => {
            const si = TASK_STATUS_ICON[task.status] || TASK_STATUS_ICON.pending
            return (
              <div key={task.id} className="flex items-start gap-1.5 py-0.5">
                <span className="mt-0.5 text-[10px]" style={{ color: si.color }}>{si.icon}</span>
                <span className="text-[10px] leading-tight" style={{ color: TEXT_SECONDARY }}>{task.title}</span>
              </div>
            )
          })}
          {tasks.filter((t) => t.status !== 'done').length > 6 && (
            <span className="text-[9px]" style={{ color: TEXT_MUTED }}>
              +{tasks.filter((t) => t.status !== 'done').length - 6} more
            </span>
          )}
        </div>
      )}
      {totalCount === 0 && (
        <p className="text-[10px]" style={{ color: TEXT_MUTED }}>No tasks seeded yet.</p>
      )}
    </div>
  )
}

// --- Agent Detail ---

function AgentDetail({ agent }: { agent: AgentData }) {
  const color = AGENT_STATUS_COLORS[agent.health]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: color + '20' }}>
          <div className="h-3 w-3 rounded-full" style={{ background: color }} />
        </div>
        <div>
          <h3 className="text-sm font-semibold" style={{ color: TEXT_PRIMARY, fontFamily: "'DM Sans', sans-serif" }}>
            {agent.name}
          </h3>
          <p className="text-xs" style={{ color: color }}>
            {agent.health.charAt(0).toUpperCase() + agent.health.slice(1)} · Tier {agent.tier}
          </p>
        </div>
      </div>

      <div>
        <SectionTitle>7-Day Performance</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Runs" value={agent.runs7d} />
          <Stat label="Success" value={`${agent.successRate}%`}
            color={agent.successRate >= 95 ? '#22C55E' : agent.successRate >= 85 ? '#F59E0B' : '#EF4444'} />
          <Stat label="Last Run" value={agent.lastRun ?? 'never'} />
        </div>
      </div>

      {agent.recentErrors.length > 0 && (
        <div>
          <SectionTitle>Recent Errors</SectionTitle>
          <div className="flex flex-col gap-1.5">
            {agent.recentErrors.map((err, i) => (
              <div key={i} className="rounded-md p-2" style={{ background: '#EF444410', border: '1px solid #EF444430' }}>
                <span className="text-[10px] leading-tight" style={{ color: '#FCA5A5', fontFamily: "'JetBrains Mono', monospace" }}>
                  {err.slice(0, 120)}{err.length > 120 ? '...' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <SectionTitle>Autonomy Tier</SectionTitle>
        <div className="rounded-md p-2.5" style={{ background: CANVAS_BG, border: `1px solid ${BORDER}` }}>
          <span className="text-xs" style={{ color: TEXT_SECONDARY, fontFamily: "'DM Sans', sans-serif" }}>
            {agent.tier === 1
              ? 'Fully autonomous — runs without approval'
              : agent.tier === 2
              ? 'Approval required — human review before execution'
              : 'Double confirmation — requires two approvals'}
          </span>
        </div>
      </div>
    </div>
  )
}

// --- Main SidePanel ---

export function SidePanel({
  lens, selectedNode, onClose,
  boardsByJurisdiction, readiness, tasksByBoardId, liveAgents,
}: SidePanelProps) {
  if (!selectedNode) return null

  const config = JURISDICTIONS[selectedNode]
  const boards = boardsByJurisdiction[selectedNode] || []

  let content: React.ReactNode = null

  if (lens === 'jurisdiction' && config) {
    content = <JurisdictionDetail config={config} boards={boards} />
  } else if (lens === 'board' && config) {
    content = <BoardDetail config={config} boards={boards} readiness={readiness} tasksByBoardId={tasksByBoardId} />
  } else if (lens === 'agent') {
    const agent = liveAgents.find((a) => a.id === selectedNode)
    if (agent) {
      content = <AgentDetail agent={agent} />
    } else {
      content = <p className="text-xs" style={{ color: TEXT_MUTED }}>Agent data unavailable.</p>
    }
  } else if (lens === 'flow' && config) {
    content = <JurisdictionDetail config={config} boards={boards} />
  }

  if (!content) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-10 flex max-h-[70vh] flex-col overflow-hidden rounded-t-xl border-t md:absolute md:inset-x-auto md:bottom-auto md:right-0 md:top-0 md:h-full md:max-h-none md:w-80 md:rounded-none md:border-l md:border-t-0"
      style={{ background: SURFACE, borderColor: BORDER, animation: 'slideInRight 0.2s ease-out' }}>
      <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: BORDER }}>
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: TEXT_MUTED }}>
          {lens} detail
        </span>
        <button onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded transition-colors"
          style={{ color: TEXT_MUTED }}
          onMouseEnter={(e) => (e.currentTarget.style.background = BORDER)}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 2l8 8M10 2l-8 8" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">{content}</div>
    </div>
  )
}
