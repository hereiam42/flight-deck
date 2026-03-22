'use client'

import { LENSES } from '../config/jurisdictions'
import { SURFACE, BORDER, TEXT_PRIMARY, TEXT_MUTED, ACCENT_BLUE } from '../config/theme'
import type { LensId } from '../config/jurisdictions'

interface LensSwitcherProps {
  activeLens: LensId
  onLensChange: (lens: LensId) => void
}

export function LensSwitcher({ activeLens, onLensChange }: LensSwitcherProps) {
  return (
    <>
      {/* Mobile: select dropdown */}
      <select
        className="rounded-md px-2.5 py-1.5 text-xs font-medium md:hidden"
        style={{
          background: SURFACE,
          border: `1px solid ${BORDER}`,
          color: TEXT_PRIMARY,
          fontFamily: "'DM Sans', sans-serif",
        }}
        value={activeLens}
        onChange={(e) => onLensChange(e.target.value as LensId)}
      >
        {LENSES.map((lens) => (
          <option key={lens.id} value={lens.id}>
            {lens.icon} {lens.label}
          </option>
        ))}
      </select>

      {/* Desktop: button group */}
      <div
        className="hidden items-center gap-1 rounded-lg p-1 md:flex"
        style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
      >
        {LENSES.map((lens) => {
          const active = activeLens === lens.id
          return (
            <button
              key={lens.id}
              onClick={() => onLensChange(lens.id)}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all"
              style={{
                background: active ? ACCENT_BLUE + '20' : 'transparent',
                color: active ? TEXT_PRIMARY : TEXT_MUTED,
                border: active ? `1px solid ${ACCENT_BLUE}40` : '1px solid transparent',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <span className="text-sm">{lens.icon}</span>
              {lens.label}
            </button>
          )
        })}
      </div>
    </>
  )
}
