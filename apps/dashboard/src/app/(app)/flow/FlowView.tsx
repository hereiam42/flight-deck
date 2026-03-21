'use client'

import { useState, useCallback, useMemo } from 'react'
import { FlowCanvas } from './components/FlowCanvas'
import { LensSwitcher } from './components/LensSwitcher'
import { SidePanel } from './components/SidePanel'
import { BottomBar } from './components/BottomBar'
import { useBoards } from './hooks/useBoards'
import { useCandidates } from './hooks/useCandidates'
import { useAgents } from './hooks/useAgents'
import { useReadiness } from './hooks/useReadiness'
import { useBoardTasks } from './hooks/useBoardTasks'
import { useRealtime } from './hooks/useRealtime'
import { JURISDICTIONS } from './config/jurisdictions'
import { computeAgentPositions } from './config/agentLayout'
import { groupBoardsByJurisdiction } from './lib/jurisdictionMapping'
import { SURFACE, BORDER } from './config/theme'
import type { LensId } from './config/jurisdictions'

interface FlowViewProps {
  workspaceId: string | null
}

export function FlowView({ workspaceId }: FlowViewProps) {
  const [lens, setLens] = useState<LensId>('jurisdiction')
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  // Live data hooks
  const { boards, loading: boardsLoading } = useBoards(workspaceId)
  const { stats: candidateStats, loading: candidatesLoading } = useCandidates(workspaceId)
  const { agents: liveAgents, loading: agentsLoading } = useAgents(workspaceId)
  const { readiness, loading: readinessLoading, refetch: refetchReadiness } = useReadiness(workspaceId)
  const { tasksByBoardId, loading: tasksLoading, refetch: refetchTasks } = useBoardTasks(workspaceId)

  // Realtime subscriptions — trigger refetch on inserts
  useRealtime({
    workspaceId,
    onCandidateInsert: () => {},
    onRunInsert: () => {},
    onBoardTaskChange: () => {
      refetchReadiness()
      refetchTasks()
    },
  })

  // Computed derived data
  const boardsByJurisdiction = useMemo(
    () => groupBoardsByJurisdiction(boards, JURISDICTIONS),
    [boards],
  )

  const agentPositions = useMemo(
    () => computeAgentPositions(liveAgents),
    [liveAgents],
  )

  const isLoading = boardsLoading || agentsLoading || readinessLoading || tasksLoading

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNode((prev) => (prev === nodeId ? null : nodeId))
  }, [])

  const handleLensChange = useCallback((newLens: LensId) => {
    setLens(newLens)
    setSelectedNode(null)
  }, [])

  const handleClosePanel = useCallback(() => {
    setSelectedNode(null)
  }, [])

  return (
    <div className="-m-6 flex h-[calc(100%+3rem)] flex-col">
      {/* Top bar: lens switcher */}
      <div
        className="flex items-center justify-between border-b px-4 py-2"
        style={{ background: SURFACE, borderColor: BORDER }}
      >
        <LensSwitcher activeLens={lens} onLensChange={handleLensChange} />
        <div className="flex items-center gap-3">
          {isLoading && (
            <span className="text-[10px]" style={{ color: '#64748B', fontFamily: "'JetBrains Mono', monospace" }}>
              syncing...
            </span>
          )}
          <span
            className="text-[10px] font-medium uppercase tracking-widest"
            style={{ color: '#64748B', fontFamily: "'DM Sans', sans-serif" }}
          >
            Flow Visualisation
          </span>
        </div>
      </div>

      {/* Canvas + side panel */}
      <div className="relative flex-1 overflow-hidden">
        <FlowCanvas
          lens={lens}
          selectedNode={selectedNode}
          onNodeClick={handleNodeClick}
          liveAgents={liveAgents}
          agentPositions={agentPositions}
          boardsByJurisdiction={boardsByJurisdiction}
          readiness={readiness}
        />
        <SidePanel
          lens={lens}
          selectedNode={selectedNode}
          onClose={handleClosePanel}
          boardsByJurisdiction={boardsByJurisdiction}
          readiness={readiness}
          tasksByBoardId={tasksByBoardId}
          liveAgents={liveAgents}
        />
      </div>

      {/* Bottom bar */}
      <BottomBar liveAgents={liveAgents} />
    </div>
  )
}
