export const ATLAS_THEME = {
  bg: '#070B14',
  surface: '#0F172A',
  border: '#1E293B',
  borderHover: '#334155',
  text: {
    primary: 'rgba(220, 216, 200, 0.88)',
    secondary: 'rgba(180, 178, 165, 0.55)',
    muted: 'rgba(140, 138, 128, 0.4)',
  },
  star: { core: '#f4eed7', glow: 'rgba(200, 195, 170, 0.12)' },
  fiji: { gold: '#e8d8a0', glow: 'rgba(232, 216, 160, 0.18)' },
  hub: { color: '#c4b5a0' },
  node: { color: '#e0dcc8' },
  status: {
    active: '#4ade80',
    planning: '#facc15',
    pipeline: '#60a5fa',
    blocked: '#f87171',
    idle: 'rgba(140, 138, 128, 0.3)',
  },
  segment: {
    wellness: '#a78bfa',
    estate: '#e8d8a0',
    investment: '#34d399',
    tourism: '#fb923c',
    govai: '#60a5fa',
  },
} as const

export const NODE_RADIUS: Record<string, number> = {
  core: 1.8,
  hub: 1.5,
  anchor: 1.0,
  regional: 0.7,
  micro: 0.5,
}

export const EDGE_OPACITY: Record<string, number> = {
  primary: 0.18,
  secondary: 0.08,
  tertiary: 0.04,
}

export const EDGE_WIDTH: Record<string, number> = {
  primary: 0.12,
  secondary: 0.06,
  tertiary: 0.06,
}
