// Geographic node positions for the SVG map canvas.
// Coordinates are in the 960x540 viewBox space.
// Japan hub center-right, EU center-left, AU bottom-right, NZ far bottom-right, CA far left.

export const NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  jp: { x: 720, y: 195 },
  eu: { x: 390, y: 150 },
  au: { x: 690, y: 390 },
  nz: { x: 790, y: 430 },
  ca: { x: 150, y: 155 },
}

// Agent node positions — arranged around the JP hub
export const AGENT_POSITIONS: Record<string, { x: number; y: number }> = {
  candidate_proc: { x: 580, y: 120 },
  job_matcher:    { x: 580, y: 220 },
  lead_scraper:   { x: 580, y: 320 },
  market_scanner: { x: 850, y: 140 },
  board_scaffolder: { x: 850, y: 260 },
}

// Agent workflow chains — animated lines showing data flow between agents
export const AGENT_CHAINS: Array<{ from: string; to: string }> = [
  { from: 'candidate_proc', to: 'job_matcher' },
  { from: 'lead_scraper', to: 'board_scaffolder' },
  { from: 'market_scanner', to: 'board_scaffolder' },
]

// SVG viewBox dimensions
export const CANVAS_WIDTH = 960
export const CANVAS_HEIGHT = 540
