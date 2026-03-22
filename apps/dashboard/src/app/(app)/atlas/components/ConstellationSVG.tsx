import { useMemo, useCallback } from 'react'
import { EdgeRenderer } from './EdgeRenderer'
import { NodeRenderer } from './NodeRenderer'
import { CorridorParticles } from './CorridorParticles'
import type { AtlasNode, AtlasData, LensId, SegmentId } from '../types/atlas'

interface ConstellationSVGProps {
  data: AtlasData & { isLive: boolean }
  activeLens: LensId
  activeSegment: SegmentId | null
  selectedNode: AtlasNode | null
  hoveredNodeId: string | null
  onNodeClick: (node: AtlasNode) => void
  onNodeHover: (nodeId: string | null) => void
}

export function ConstellationSVG({
  data,
  activeLens,
  activeSegment,
  selectedNode,
  hoveredNodeId,
  onNodeClick,
  onNodeHover,
}: ConstellationSVGProps) {
  const nodeMap = useMemo(() => {
    const map: Record<string, AtlasNode> = {}
    for (const n of data.nodes) map[n.id] = n
    return map
  }, [data.nodes])

  const positionOf = useCallback(
    (node: AtlasNode) => ({
      x: 5 + node.x * 0.9,
      y: 100 - 8 - node.y * 0.84,
    }),
    [],
  )

  const japanNode = nodeMap['japan']
  const fijiNode = nodeMap['fiji']

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
      }}
    >
      <defs>
        <filter id="starGlow">
          <feGaussianBlur stdDeviation="0.3" />
        </filter>
        <filter id="fijiGlow">
          <feGaussianBlur stdDeviation="0.7" />
        </filter>
        <filter id="fijiOuter">
          <feGaussianBlur stdDeviation="1.8" />
        </filter>
      </defs>

      <EdgeRenderer
        edges={data.edges}
        nodeMap={nodeMap}
        positionOf={positionOf}
        activeLens={activeLens}
        activeSegment={activeSegment}
      />

      {japanNode && fijiNode && (
        <CorridorParticles
          japanNode={japanNode}
          fijiNode={fijiNode}
          positionOf={positionOf}
          activeLens={activeLens}
        />
      )}

      <NodeRenderer
        nodes={data.nodes}
        positionOf={positionOf}
        activeLens={activeLens}
        activeSegment={activeSegment}
        selectedNode={selectedNode}
        hoveredNodeId={hoveredNodeId}
        onNodeClick={onNodeClick}
        onNodeHover={onNodeHover}
        data={data}
      />
    </svg>
  )
}
