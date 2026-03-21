'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AgentStatus } from '../config/jurisdictions'

export interface AgentData {
  id: string
  name: string
  description: string | null
  dbStatus: string // raw status from agents table (active/paused/archived)
  health: AgentStatus // derived: healthy/warning/error/idle
  tier: number // 1=autonomous, 2=approval required, 3=double confirmation
  runs7d: number
  successRate: number
  lastRun: string | null
  recentErrors: string[]
}

function deriveHealth(dbStatus: string, runs7d: number, successRate: number): AgentStatus {
  if (dbStatus === 'paused' || dbStatus === 'archived') return 'idle'
  if (runs7d === 0) return 'idle'
  if (successRate < 80) return 'error'
  if (successRate < 95) return 'warning'
  return 'healthy'
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function useAgents(workspaceId: string | null) {
  const [agents, setAgents] = useState<AgentData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workspaceId) return

    const supabase = createClient()

    async function fetch() {
      setLoading(true)

      // Fetch agents
      const { data: agentRows } = await supabase
        .from('agents')
        .select('id, name, description, status, tier')
        .eq('workspace_id', workspaceId!)

      if (!agentRows || agentRows.length === 0) {
        setAgents([])
        setLoading(false)
        return
      }

      // Fetch runs from last 7 days
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)

      const { data: runs } = await supabase
        .from('runs')
        .select('id, agent_id, status, error, created_at')
        .eq('workspace_id', workspaceId!)
        .gte('created_at', weekAgo.toISOString())
        .not('agent_id', 'is', null)
        .order('created_at', { ascending: false })

      // Group runs by agent
      const runsByAgent: Record<string, typeof runs> = {}
      runs?.forEach((r) => {
        if (r.agent_id) {
          if (!runsByAgent[r.agent_id]) runsByAgent[r.agent_id] = []
          runsByAgent[r.agent_id]!.push(r)
        }
      })

      const result: AgentData[] = agentRows.map((a) => {
        const agentRuns = runsByAgent[a.id] || []
        const total = agentRuns.length
        const completed = agentRuns.filter((r) => r.status === 'completed').length
        const successRate = total > 0 ? Math.round((completed / total) * 1000) / 10 : 0
        const lastRunDate = agentRuns[0]?.created_at || null
        const recentErrors = agentRuns
          .filter((r) => r.status === 'failed' && r.error)
          .slice(0, 3)
          .map((r) => r.error as string)

        return {
          id: a.id,
          name: a.name,
          description: a.description,
          dbStatus: a.status,
          health: deriveHealth(a.status, total, successRate),
          tier: a.tier ?? 1,
          runs7d: total,
          successRate,
          lastRun: lastRunDate ? timeAgo(lastRunDate) : null,
          recentErrors,
        }
      })

      setAgents(result)
      setLoading(false)
    }

    fetch()
  }, [workspaceId])

  return { agents, loading }
}
