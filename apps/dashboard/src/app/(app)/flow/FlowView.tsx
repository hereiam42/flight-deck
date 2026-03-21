'use client'

import { useState, useCallback } from 'react'
import { FlowCanvas } from './components/FlowCanvas'
import { LensSwitcher } from './components/LensSwitcher'
import { SidePanel } from './components/SidePanel'
import { BottomBar } from './components/BottomBar'
import { useBoards } from './hooks/useBoards'
import { useCandidates } from './hooks/useCandidates'
import { useAgents } from './hooks/useAgents'
import { useRealtime } from './hooks/useRealtime'
import { SURFACE, BORDER } from './config/theme'
import type { LensId } from './config/jurisdictions'

interface FlowViewProps {
  workspaceId: string | null
}

export function FlowView({ workspaceId }: FlowViewProps) {
  const [lens, setLens] = useState<LensId>('jurisdiction')
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  // Live data hooks — fall back to mock config data when no workspace
  const { boards, loading: boardsLoading } = useBoards(workspaceId)
  const { stats: candidateStats, loading: candidatesLoading } = useCandidates(workspaceId)
  const { agents: liveAgents, loading: agentsLoading } = useAgents(workspaceId)

  // Realtime subscriptions — trigger refetch on inserts
  // For now these just log; we'll wire up refetch callbacks once we confirm data flows
  useRealtime({
    workspaceId,
    onCandidateInsert: () => {
      // Will trigger useCandidates refetch in next iteration
    },
    onRunInsert: () => {
      // Will trigger useAgents refetch in next iteration
    },
  })

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
    // Negative margin cancels the parent layout's p-6 so canvas is edge-to-edge
    <div className="-m-6 flex h-[calc(100%+3rem)] flex-col">
      {/* Top bar: lens switcher */}
      <div
        className="flex items-center justify-between border-b px-4 py-2"
        style={{ background: SURFACE, borderColor: BORDER }}
      >
        <LensSwitcher activeLens={lens} onLensChange={handleLensChange} />
        <div className="flex items-center gap-3">
          {(boardsLoading || candidatesLoading || agentsLoading) && (
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
        <FlowCanvas lens={lens} selectedNode={selectedNode} onNodeClick={handleNodeClick} />
        <SidePanel
          lens={lens}
          selectedNode={selectedNode}
          onClose={handleClosePanel}
          liveBoards={boards}
          candidateStats={candidateStats}
          liveAgents={liveAgents}
        />
      </div>

      {/* Bottom bar */}
      <BottomBar liveAgents={liveAgents} />
    </div>
  )
}
