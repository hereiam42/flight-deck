import { useMemo } from 'react'
import type { AtlasEdge, AtlasNode, LensId, SegmentId } from '../types/atlas'
import { EDGE_OPACITY, EDGE_WIDTH } from '../config/theme'

interface EdgeRendererProps {
  edges: AtlasEdge[]
  nodeMap: Record<string, AtlasNode>
  positionOf: (node: AtlasNode) => { x: number; y: number }
  activeLens: LensId
  activeSegment: SegmentId | null
}

export function EdgeRenderer({
  edges,
  nodeMap,
  positionOf,
  activeLens,
  activeSegment,
}: EdgeRendererProps) {
  const edgeElements = useMemo(() => {
    return edges.map((edge, i) => {
      const fromNode = nodeMap[edge.from]
      const toNode = nodeMap[edge.to]
      if (!fromNode || !toNode) return null

      const from = positionOf(fromNode)
      const to = positionOf(toNode)
      const baseOpacity = EDGE_OPACITY[edge.type]

      let opacity = baseOpacity
      if (activeLens === 'segments' && activeSegment) {
        const fromHas = fromNode.segments.includes(activeSegment)
        const toHas = toNode.segments.includes(activeSegment)
        opacity = fromHas && toHas ? 0.25 : 0.02
      }

      return (
        <line
          key={`${edge.from}-${edge.to}`}
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
          stroke="#f4eed7"
          strokeWidth={EDGE_WIDTH[edge.type]}
          opacity={opacity}
          style={{
            transition: 'opacity 0.6s ease',
            animationDelay: `${600 + i * 60}ms`,
          }}
        />
      )
    })
  }, [edges, nodeMap, positionOf, activeLens, activeSegment])

  return <g>{edgeElements}</g>
}
