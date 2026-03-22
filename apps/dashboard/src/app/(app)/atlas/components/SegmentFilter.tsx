import type { Segment, SegmentId } from '../types/atlas'
import { ATLAS_THEME } from '../config/theme'

interface SegmentFilterProps {
  segments: Record<SegmentId, Segment>
  activeSegment: SegmentId | null
  onSegmentChange: (segment: SegmentId | null) => void
}

const SEGMENT_ORDER: SegmentId[] = ['wellness', 'estate', 'investment', 'tourism', 'govai']

export function SegmentFilter({
  segments,
  activeSegment,
  onSegmentChange,
}: SegmentFilterProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 64,
        left: 24,
        zIndex: 10,
        display: 'flex',
        gap: 6,
      }}
    >
      {SEGMENT_ORDER.map((segId) => {
        const seg = segments[segId]
        const isActive = activeSegment === segId
        return (
          <button
            key={segId}
            onClick={() => onSegmentChange(isActive ? null : segId)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 14px',
              borderRadius: 20,
              border: `1px solid ${isActive ? seg.color + '40' : ATLAS_THEME.border}`,
              background: isActive
                ? seg.color + '12'
                : 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(8px)',
              color: isActive ? seg.color : ATLAS_THEME.text.secondary,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            <span>{seg.icon}</span>
            {seg.label}
          </button>
        )
      })}
    </div>
  )
}
