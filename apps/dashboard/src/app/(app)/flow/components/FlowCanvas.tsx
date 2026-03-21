'use client'

import { useState } from 'react'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../config/positions'
import { CANVAS_BG } from '../config/theme'
import { CorridorRenderer } from './CorridorRenderer'
import { NodeRenderer } from './NodeRenderer'
import type { LensId } from '../config/jurisdictions'

interface FlowCanvasProps {
  lens: LensId
  selectedNode: string | null
  onNodeClick: (nodeId: string) => void
}

export function FlowCanvas({ lens, selectedNode, onNodeClick }: FlowCanvasProps) {
  const [hoveredCorridor, setHoveredCorridor] = useState<string | null>(null)

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: CANVAS_BG }}>
      <svg
        viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid dots for depth */}
        <defs>
          <pattern id="grid-dots" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="0.5" fill="#1E293B" opacity="0.5" />
          </pattern>
        </defs>
        <rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="url(#grid-dots)" />

        {/* Corridors (transfer lines) */}
        <CorridorRenderer
          lens={lens}
          hoveredCorridor={hoveredCorridor}
          onCorridorHover={setHoveredCorridor}
        />

        {/* Nodes */}
        <NodeRenderer
          lens={lens}
          selectedNode={selectedNode}
          onNodeClick={onNodeClick}
        />
      </svg>
    </div>
  )
}
