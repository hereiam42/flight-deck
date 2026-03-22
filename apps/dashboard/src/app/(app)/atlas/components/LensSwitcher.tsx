import type { LensId } from '../types/atlas'
import { ATLAS_THEME } from '../config/theme'

interface LensSwitcherProps {
  activeLens: LensId
  onLensChange: (lens: LensId) => void
  isLive: boolean
}

const LENSES: { id: LensId; icon: string; label: string }[] = [
  { id: 'constellation', icon: '✦', label: 'Constellation' },
  { id: 'segments', icon: '◈', label: 'Segments' },
  { id: 'pipeline', icon: '▸', label: 'Pipeline' },
  { id: 'partners', icon: '◎', label: 'Partners' },
]

export function LensSwitcher({ activeLens, onLensChange, isLive }: LensSwitcherProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        left: 24,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(12px)',
        borderRadius: 12,
        border: `1px solid ${ATLAS_THEME.border}`,
        padding: 3,
      }}
    >
      {LENSES.map((lens) => {
        const isActive = activeLens === lens.id
        return (
          <button
            key={lens.id}
            onClick={() => onLensChange(lens.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 9,
              border: 'none',
              background: isActive ? ATLAS_THEME.surface : 'transparent',
              color: isActive
                ? ATLAS_THEME.text.primary
                : ATLAS_THEME.text.secondary,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              fontWeight: isActive ? 500 : 400,
              letterSpacing: '0.08em',
              textTransform: 'uppercase' as const,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              ...(isActive
                ? { boxShadow: `inset 0 0 0 1px ${ATLAS_THEME.border}` }
                : {}),
            }}
          >
            <span style={{ fontSize: 12 }}>{lens.icon}</span>
            {lens.label}
          </button>
        )
      })}

      <div
        style={{
          marginLeft: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '0 8px',
        }}
      >
        <div
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: isLive ? ATLAS_THEME.status.active : ATLAS_THEME.text.muted,
          }}
        />
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 8,
            letterSpacing: '0.1em',
            color: ATLAS_THEME.text.muted,
            textTransform: 'uppercase',
          }}
        >
          {isLive ? 'LIVE' : 'MOCK'}
        </span>
      </div>
    </div>
  )
}
