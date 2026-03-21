'use client'

import { useState, useEffect } from 'react'
import { SURFACE, BORDER, TEXT_SECONDARY, TEXT_MUTED, ACCENT_BLUE } from '../config/theme'
import type { AgentData } from '../hooks/useAgents'

const DEADLINES = [
  { label: 'EU AI Act Art. 6', date: '2026-08-02', severity: 'critical' as const },
  { label: 'AU ADM disclosure', date: '2026-12-01', severity: 'high' as const },
  { label: 'NZ soft launch', date: '2026-05-01', severity: 'info' as const },
]

function daysUntil(dateStr: string): number {
  const now = new Date()
  const target = new Date(dateStr)
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

const severityColor = {
  critical: '#EF4444',
  high: '#F59E0B',
  info: '#3B82F6',
}

interface BottomBarProps {
  liveAgents: AgentData[]
}

export function BottomBar({ liveAgents }: BottomBarProps) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(i)
  }, [])

  const healthyCount = liveAgents.filter((a) => a.health === 'healthy').length
  const totalCount = liveAgents.length

  return (
    <div className="flex items-center gap-4 border-t px-4 py-2"
      style={{ background: SURFACE, borderColor: BORDER }}>
      <div className="flex items-center gap-3">
        {DEADLINES.map((d) => {
          const days = daysUntil(d.date)
          const color = severityColor[d.severity]
          return (
            <div key={d.label} className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
              <span className="text-[10px]" style={{ color: TEXT_SECONDARY, fontFamily: "'DM Sans', sans-serif" }}>{d.label}</span>
              <span className="text-[10px] font-semibold" style={{ color, fontFamily: "'JetBrains Mono', monospace" }}>
                {days > 0 ? `${days}d` : 'OVERDUE'}
              </span>
            </div>
          )
        })}
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-1.5">
        <div className="h-1.5 w-1.5 rounded-full"
          style={{ background: totalCount > 0 ? (healthyCount === totalCount ? '#22C55E' : '#F59E0B') : '#64748B' }} />
        <span className="text-[10px]" style={{ color: TEXT_SECONDARY, fontFamily: "'JetBrains Mono', monospace" }}>
          {totalCount > 0 ? `${healthyCount}/${totalCount} agents` : '— agents'}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="h-1.5 w-1.5 rounded-full" style={{ background: ACCENT_BLUE }} />
        <span className="text-[10px]" style={{ color: TEXT_MUTED, fontFamily: "'JetBrains Mono', monospace" }}>
          {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} JST
        </span>
      </div>
    </div>
  )
}
