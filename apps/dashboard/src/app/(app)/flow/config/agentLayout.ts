// Dynamic agent node positioning — distributes N agents in two columns
// flanking the JP hub. Works for any number of agents from DB.

import type { AgentData } from '../hooks/useAgents'

const AGENT_LEFT_X = 580
const AGENT_RIGHT_X = 860
const Y_START = 120
const Y_STEP = 100

export function computeAgentPositions(agents: AgentData[]): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {}
  const half = Math.ceil(agents.length / 2)

  agents.forEach((agent, i) => {
    const col = i < half ? AGENT_LEFT_X : AGENT_RIGHT_X
    const row = i < half ? i : i - half
    positions[agent.id] = { x: col, y: Y_START + row * Y_STEP }
  })

  return positions
}
