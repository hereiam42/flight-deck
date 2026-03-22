import { useMemo } from 'react'
import type { AtlasData } from '../types/atlas'
import { ATLAS_THEME } from '../config/theme'

interface BottomBarProps {
  data: AtlasData
  isLive: boolean
}

export function BottomBar({ data, isLive }: BottomBarProps) {
  const stats = useMemo(() => {
    const counts = { active: 0, planning: 0, pipeline: 0 }
    for (const p of data.programs) {
      if (p.status in counts) counts[p.status as keyof typeof counts]++
    }
    return {
      ...counts,
      nations: data.nodes.length,
      partners: data.partners.length,
    }
  }, [data])

  const items: { label: string; value: number; color: string }[] = [
    { label: 'Active', value: stats.active, color: ATLAS_THEME.status.active },
    { label: 'Planning', value: stats.planning, color: ATLAS_THEME.status.planning },
    { label: 'Pipeline', value: stats.pipeline, color: ATLAS_THEME.status.pipeline },
    { label: 'Nations', value: stats.nations, color: ATLAS_THEME.text.secondary },
    { label: 'Partners', value: stats.partners, color: ATLAS_THEME.text.secondary },
  ]

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        background: 'linear-gradient(to top, rgba(7, 11, 20, 0.95) 0%, transparent 100%)',
        padding: '40px 24px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
      }}
    >
      <div style={{ display: 'flex', gap: 24 }}>
        {items.map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 18,
                fontWeight: 600,
                color: item.color,
              }}
            >
              {item.value}
            </span>
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: ATLAS_THEME.text.muted,
              }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>

      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9,
          letterSpacing: '0.1em',
          color: ATLAS_THEME.text.muted,
        }}
      >
        {isLive ? 'SUPABASE · LIVE' : 'MOCK DATA · SUPABASE PENDING'}
      </span>
    </div>
  )
}
