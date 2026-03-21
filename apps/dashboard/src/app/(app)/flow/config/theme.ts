// Flow visualisation color system.
// Canvas has its own dark space (#070B14); dashboard chrome stays on existing palette.

import type { RiskLevel, CorridorComplexity, BoardStatus, AgentStatus } from './jurisdictions'

// Canvas background
export const CANVAS_BG = '#070B14'
export const SURFACE = '#0F172A'
export const BORDER = '#1E293B'
export const BORDER_HOVER = '#334155'

// Text
export const TEXT_PRIMARY = '#F8FAFC'
export const TEXT_SECONDARY = '#94A3B8'
export const TEXT_MUTED = '#64748B'

// Risk / complexity color maps
export const RISK_COLORS: Record<RiskLevel, string> = {
  base: '#3B82F6',
  critical: '#EF4444',
  high: '#F59E0B',
  moderate: '#22C55E',
}

export const COMPLEXITY_COLORS: Record<CorridorComplexity, string> = {
  low: '#22C55E',
  medium: '#F59E0B',
  high: '#EF4444',
}

export const STATUS_COLORS: Record<BoardStatus, string> = {
  live: '#22C55E',
  building: '#F59E0B',
  planned: '#8B5CF6',
  research: '#64748B',
}

export const AGENT_STATUS_COLORS: Record<AgentStatus, string> = {
  healthy: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  idle: '#64748B',
}

// Primary accent (hub/selected)
export const ACCENT_BLUE = '#3B82F6'
export const ACCENT_PURPLE = '#8B5CF6'

// Node sizing
export const NODE_RADIUS_MIN = 22
export const NODE_RADIUS_MAX = 38
export const HUB_RADIUS = 38
