'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAtlasData } from './hooks'
import { StarField } from './components/StarField'
import { ConstellationSVG } from './components/ConstellationSVG'
import { LensSwitcher } from './components/LensSwitcher'
import { SegmentFilter } from './components/SegmentFilter'
import { SidePanel } from './components/SidePanel'
import { BottomBar } from './components/BottomBar'
import type { LensId, SegmentId, AtlasNode } from './types/atlas'

export default function AtlasView() {
  const data = useAtlasData()
  const [activeLens, setActiveLens] = useState<LensId>('constellation')
  const [activeSegment, setActiveSegment] = useState<SegmentId | null>(null)
  const [selectedNode, setSelectedNode] = useState<AtlasNode | null>(null)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLensChange = useCallback((lens: LensId) => {
    setActiveLens(lens)
    setActiveSegment(null)
    setSelectedNode(null)
  }, [])

  const handleNodeClick = useCallback((node: AtlasNode) => {
    setSelectedNode((prev) => (prev?.id === node.id ? null : node))
  }, [])

  const handleNodeHover = useCallback((nodeId: string | null) => {
    setHoveredNodeId(nodeId)
  }, [])

  const handleClosePanel = useCallback(() => {
    setSelectedNode(null)
  }, [])

  return (
    <div
      className="-m-6 relative w-full overflow-hidden"
      style={{
        height: 'calc(100vh - 3.5rem)',
        background: '#070B14',
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        opacity: mounted ? 1 : 0,
        transition: 'opacity 1.5s ease',
      }}
    >
      <StarField />
      <ConstellationSVG
        data={data}
        activeLens={activeLens}
        activeSegment={activeSegment}
        selectedNode={selectedNode}
        hoveredNodeId={hoveredNodeId}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
      />
      <LensSwitcher
        activeLens={activeLens}
        onLensChange={handleLensChange}
        isLive={data.isLive}
      />
      {activeLens === 'segments' && (
        <SegmentFilter
          segments={data.segments}
          activeSegment={activeSegment}
          onSegmentChange={setActiveSegment}
        />
      )}
      <SidePanel
        node={selectedNode}
        lens={activeLens}
        data={data}
        onClose={handleClosePanel}
      />
      <BottomBar data={data} isLive={data.isLive} />
    </div>
  )
}
