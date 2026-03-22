import { useRef, useEffect, useState, useMemo } from 'react'
import type { AtlasNode, LensId, SegmentId, AtlasData } from '../types/atlas'
import { NODE_RADIUS, ATLAS_THEME } from '../config/theme'

interface NodeRendererProps {
  nodes: AtlasNode[]
  positionOf: (node: AtlasNode) => { x: number; y: number }
  activeLens: LensId
  activeSegment: SegmentId | null
  selectedNode: AtlasNode | null
  hoveredNodeId: string | null
  onNodeClick: (node: AtlasNode) => void
  onNodeHover: (nodeId: string | null) => void
  data: AtlasData
}

function nodeRadius(type: string): number {
  return NODE_RADIUS[type] ?? 0.7
}

function nodeDotColor(type: string): string {
  if (type === 'core') return ATLAS_THEME.fiji.gold
  if (type === 'hub') return ATLAS_THEME.hub.color
  return ATLAS_THEME.node.color
}

function nodeGlowColor(type: string): string {
  if (type === 'core') return ATLAS_THEME.fiji.glow
  return ATLAS_THEME.star.glow
}

function nodeGlowFilter(type: string): string {
  if (type === 'core') return 'url(#fijiGlow)'
  return 'url(#starGlow)'
}

export function NodeRenderer({
  nodes,
  positionOf,
  activeLens,
  activeSegment,
  selectedNode,
  hoveredNodeId,
  onNodeClick,
  onNodeHover,
  data,
}: NodeRendererProps) {
  // Fiji pulse animation
  const [fijiPulse, setFijiPulse] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    function animate(time: number) {
      setFijiPulse(Math.sin(time * 0.0015) * 0.5 + 0.5)
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  // Precompute counts
  const programsByNode = useMemo(() => {
    const map: Record<string, number> = {}
    for (const p of data.programs) {
      map[p.nodeId] = (map[p.nodeId] || 0) + 1
    }
    return map
  }, [data.programs])

  const partnersByNode = useMemo(() => {
    const map: Record<string, number> = {}
    for (const p of data.partners) {
      map[p.nodeId] = (map[p.nodeId] || 0) + 1
    }
    return map
  }, [data.partners])

  return (
    <g>
      {nodes.map((node, i) => {
        const p = positionOf(node)
        const r = nodeRadius(node.type)
        const isSelected = selectedNode?.id === node.id
        const isHovered = hoveredNodeId === node.id
        const isDimmed =
          activeLens === 'segments' &&
          activeSegment !== null &&
          !node.segments.includes(activeSegment)

        // Label visibility
        let labelOpacity = 0
        if (activeLens === 'constellation') {
          labelOpacity = isHovered || isSelected ? 1 : 0
        } else if (!isDimmed) {
          if (isHovered || isSelected) {
            labelOpacity = 1
          } else if (node.type === 'core' || node.type === 'hub') {
            labelOpacity = 0.7
          } else {
            labelOpacity = 0.7
          }
        }

        // Status ring visibility
        const hasPrograms = (programsByNode[node.id] || 0) > 0
        const hasPartners = (partnersByNode[node.id] || 0) > 0
        const showStatusRing =
          (activeLens === 'pipeline' && hasPrograms) ||
          (activeLens === 'partners' && hasPartners)

        // Segment rings
        const showSegRings =
          activeLens === 'segments' &&
          activeSegment === null &&
          node.segments.length > 0

        // Count badge
        let badgeCount = 0
        let badgeColor = ''
        if (activeLens === 'pipeline' && hasPrograms) {
          badgeCount = programsByNode[node.id]
          badgeColor = ATLAS_THEME.status.active
        } else if (activeLens === 'partners' && hasPartners) {
          badgeCount = partnersByNode[node.id]
          badgeColor = ATLAS_THEME.segment.wellness
        }

        // Label font
        const isConstellation = activeLens === 'constellation'
        const labelFont = isConstellation
          ? "'Cormorant Garamond', Georgia, serif"
          : "'DM Sans', sans-serif"
        const labelSize = isConstellation ? 1 : 0.85

        return (
          <g
            key={node.id}
            style={{
              opacity: isDimmed ? 0.15 : 1,
              transition: 'opacity 0.5s ease',
              animationDelay: `${400 + i * 80}ms`,
            }}
          >
            {/* Fiji outer glow (core only) */}
            {node.type === 'core' && (
              <circle
                cx={p.x}
                cy={p.y}
                r={r * 4 + fijiPulse * 1.5}
                fill={`rgba(232, 216, 160, ${0.03 + fijiPulse * 0.025})`}
                filter="url(#fijiOuter)"
              />
            )}

            {/* Glow layer */}
            <circle
              cx={p.x}
              cy={p.y}
              r={r * 2.5}
              fill={nodeGlowColor(node.type)}
              filter={nodeGlowFilter(node.type)}
            />

            {/* Status ring */}
            <circle
              cx={p.x}
              cy={p.y}
              r={r * 2}
              fill="none"
              stroke={ATLAS_THEME.status.active}
              strokeWidth={0.06}
              strokeDasharray="0.3 0.2"
              style={{
                opacity: showStatusRing ? 0.4 : 0,
                transition: 'opacity 0.5s ease',
              }}
            />

            {/* Segment rings */}
            <g
              style={{
                opacity: showSegRings ? 1 : 0,
                transition: 'opacity 0.5s ease',
              }}
            >
              {node.segments.map((segId, si) => (
                <circle
                  key={segId}
                  cx={p.x}
                  cy={p.y}
                  r={r * 1.6 + si * 0.35}
                  fill="none"
                  stroke={ATLAS_THEME.segment[segId]}
                  strokeWidth={0.04}
                  opacity={0.35}
                />
              ))}
            </g>

            {/* Core dot */}
            <circle
              cx={p.x}
              cy={p.y}
              r={r * 0.55}
              fill={nodeDotColor(node.type)}
              style={{ transition: 'r 0.3s ease' }}
            />

            {/* Count badge */}
            {badgeCount > 0 && (
              <g
                style={{
                  opacity: badgeCount > 0 ? 1 : 0,
                  transition: 'opacity 0.4s ease',
                }}
              >
                <circle
                  cx={p.x + r * 0.5}
                  cy={p.y - r * 0.5}
                  r={0.5}
                  fill={badgeColor}
                />
                <text
                  x={p.x + r * 0.5}
                  y={p.y - r * 0.5}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#070B14"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 0.5,
                    fontWeight: 700,
                  }}
                >
                  {badgeCount}
                </text>
              </g>
            )}

            {/* Label */}
            <text
              x={p.x}
              y={p.y - r * 1.2 - 1}
              textAnchor="middle"
              fill="rgba(220, 216, 200, 0.85)"
              style={{
                fontFamily: labelFont,
                fontSize: labelSize,
                fontWeight: 300,
                letterSpacing: isConstellation ? '0.06em' : undefined,
                opacity: labelOpacity,
                transition: 'opacity 0.3s ease',
              }}
            >
              {node.name}
            </text>

            {/* Hit area */}
            <circle
              cx={p.x}
              cy={p.y}
              r={r * 4}
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => onNodeHover(node.id)}
              onMouseLeave={() => onNodeHover(null)}
              onClick={() => onNodeClick(node)}
            />
          </g>
        )
      })}
    </g>
  )
}
