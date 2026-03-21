// Static legal configuration — sourced from Beyond Peaks legal research.
// This data doesn't come from Supabase; it changes only when laws change.

export type RiskLevel = 'base' | 'critical' | 'high' | 'moderate'
export type CorridorComplexity = 'low' | 'medium' | 'high'
export type BoardStatus = 'live' | 'building' | 'planned' | 'research'
export type AgentStatus = 'healthy' | 'warning' | 'error' | 'idle'
export type NodeRole = 'hub' | 'market'
export type LensId = 'jurisdiction' | 'board' | 'flow' | 'agent'

export interface BoardConfig {
  id: string
  name: string
  status: BoardStatus
  progress: number
  candidates: number
  jobs: number
  employers: number
  weeklyReg: number
  todoList: string[]
}

export interface JurisdictionNode {
  name: string
  sub: string
  flag: string
  x: number
  y: number
  role: NodeRole
  laws: string[]
  penalty: string
  risk: RiskLevel
  candidates: number
  employers: number
  jobs: number
  boards: BoardConfig[]
  legalSummary: string
  transferNote: string
}

export interface Corridor {
  from: string
  to: string
  label: string
  mech: string
  cx: CorridorComplexity
}

export interface AgentConfig {
  id: string
  name: string
  status: AgentStatus
  runs7d: number
  success: number
  tier: number
  lastRun: string
}

export interface LensConfig {
  id: LensId
  icon: string
  label: string
}

export const LENSES: LensConfig[] = [
  { id: 'jurisdiction', icon: '🌏', label: 'Jurisdiction' },
  { id: 'board', icon: '📍', label: 'Boards' },
  { id: 'flow', icon: '👥', label: 'Flow' },
  { id: 'agent', icon: '🤖', label: 'Agents' },
]

export const NODES: Record<string, JurisdictionNode> = {
  jp: {
    name: 'Japan', sub: 'Tokyo HQ', flag: '🇯🇵', x: 720, y: 195, role: 'hub',
    laws: ['APPI', 'Employment Security Act'], penalty: '¥100M', risk: 'base',
    candidates: 249, employers: 21, jobs: 66,
    boards: [
      { id: 'niseko', name: 'Niseko', status: 'live', progress: 100, candidates: 189, jobs: 42, employers: 14, weeklyReg: 23, todoList: ['Onboard 3 new ski resorts', 'Launch premium job tier', 'Employer outreach: Hilton Niseko'] },
      { id: 'hakuba', name: 'Hakuba', status: 'live', progress: 100, candidates: 47, jobs: 18, employers: 5, weeklyReg: 8, todoList: ['Content refresh for summer season', 'Employer: Hakuba Valley Lodge follow-up'] },
      { id: 'furano', name: 'Furano', status: 'building', progress: 65, candidates: 13, jobs: 6, employers: 2, weeklyReg: 3, todoList: ['Complete job board template', 'Photograph Furano resorts', 'First 5 employer sign-ups'] },
    ],
    legalSummary: 'Central controller. All data stored Tokyo (Supabase/AWS). APPI Art. 27: prior consent for every employer share. Art. 28: country disclosure for AU, NZ, CA. Rikunabi precedent applies.',
    transferNote: 'Only EU/EEA/UK adequate. AU, NZ, CA require consent or contractual safeguards.',
  },
  eu: {
    name: 'France', sub: 'French Alps', flag: '🇫🇷', x: 390, y: 150, role: 'market',
    laws: ['GDPR', 'EU AI Act', 'Labour Code'], penalty: '€20M / 4%', risk: 'critical',
    candidates: 0, employers: 0, jobs: 0,
    boards: [
      { id: 'alps', name: 'French Alps', status: 'planned', progress: 25, candidates: 0, jobs: 0, employers: 0, weeklyReg: 0, todoList: ['Appoint EU Representative', 'Complete DPIA', 'EU AI Act conformity assessment', 'Draft French privacy policy supplement', 'Identify first 10 employer targets'] },
    ],
    legalSummary: 'Highest compliance bar. AI = high-risk under EU AI Act (Aug 2 2026 deadline). DPIA mandatory. EU Rep required. CJEU SCHUFA: scoring = decision under Art. 22.',
    transferNote: 'EU-Japan adequacy (2019) — strongest asset. Data flows freely to Tokyo.',
  },
  au: {
    name: 'Australia', sub: 'Expansion', flag: '🇦🇺', x: 690, y: 390, role: 'market',
    laws: ['Privacy Act 1988'], penalty: 'A$50M+', risk: 'high',
    candidates: 0, employers: 0, jobs: 0,
    boards: [
      { id: 'thredbo', name: 'Thredbo/Perisher', status: 'research', progress: 15, candidates: 0, jobs: 0, employers: 0, weeklyReg: 0, todoList: ['Market research: AU ski employment volume', 'Evaluate APP 8 contractual safeguards', 'APEC CBPR certification assessment'] },
    ],
    legalSummary: 'Japan not whitelisted. Beyond Peaks accountable for overseas recipient breaches (APP 8). Nationality may be sensitive. ADM disclosure from Dec 2026.',
    transferNote: 'Contractual safeguards required. APEC CBPR available.',
  },
  nz: {
    name: 'New Zealand', sub: 'Queenstown', flag: '🇳🇿', x: 790, y: 430, role: 'market',
    laws: ['Privacy Act 2020'], penalty: 'NZD $10K', risk: 'moderate',
    candidates: 0, employers: 0, jobs: 0,
    boards: [
      { id: 'queenstown', name: 'Queenstown', status: 'building', progress: 80, candidates: 0, jobs: 0, employers: 0, weeklyReg: 0, todoList: ['Finalise employer partnerships', 'IPP 12 contractual clauses', 'Content: lifestyle + job guides', 'Soft launch target: May 2026'] },
    ],
    legalSummary: 'Principled framework, modest penalties. Not CBPR participant. Broad discrimination protections (nationality). OPC recommends human review for AI.',
    transferNote: 'IPP 12: comparable safeguards or individual auth. Cloud exemption may apply.',
  },
  ca: {
    name: 'Canada', sub: 'Whistler', flag: '🇨🇦', x: 150, y: 155, role: 'market',
    laws: ['PIPEDA', 'Quebec Law 25'], penalty: 'CAD $25M / 4%', risk: 'critical',
    candidates: 0, employers: 0, jobs: 0,
    boards: [
      { id: 'whistler', name: 'Whistler', status: 'planned', progress: 10, candidates: 0, jobs: 0, employers: 0, weeklyReg: 0, todoList: ['Quebec PIA before any data collection', 'Transfer Risk Assessment: Japan APPI evaluation', 'Market research: Whistler employer landscape', 'Canadian legal counsel engagement'] },
    ],
    legalSummary: 'Quebec Law 25 is binding constraint. Mandatory PIA before cross-border transfer AND AI deployment. s.12.1: ADM transparency + human review. Visa = likely sensitive.',
    transferNote: 'Transfer Risk Assessment required. Canada is CBPR participant.',
  },
}

export const CORRIDORS: Corridor[] = [
  { from: 'eu', to: 'jp', label: 'EU → JP', mech: 'Adequacy (2019)', cx: 'low' },
  { from: 'jp', to: 'eu', label: 'JP → EU', mech: 'Mutual adequacy', cx: 'low' },
  { from: 'au', to: 'jp', label: 'AU → JP', mech: 'APP 8 + contracts', cx: 'medium' },
  { from: 'jp', to: 'au', label: 'JP → AU', mech: 'APPI Art.28 + APP 8', cx: 'high' },
  { from: 'nz', to: 'jp', label: 'NZ → JP', mech: 'IPP 12 cloud exempt', cx: 'low' },
  { from: 'jp', to: 'nz', label: 'JP → NZ', mech: 'APPI Art.28 + IPP 12', cx: 'high' },
  { from: 'ca', to: 'jp', label: 'CA → JP', mech: 'PIPEDA + Quebec PIA', cx: 'medium' },
  { from: 'jp', to: 'ca', label: 'JP → CA', mech: 'APPI Art.28', cx: 'medium' },
  { from: 'eu', to: 'au', label: 'EU → AU (onward)', mech: 'SCCs required', cx: 'high' },
  { from: 'eu', to: 'nz', label: 'EU → NZ (onward)', mech: 'SCCs required', cx: 'high' },
  { from: 'eu', to: 'ca', label: 'EU → CA (onward)', mech: 'SCCs required', cx: 'high' },
]

// Mock agent data — will be replaced by useAgents hook with real Supabase data
export const AGENTS: AgentConfig[] = [
  { id: 'candidate_proc', name: 'Candidate processor', status: 'healthy', runs7d: 156, success: 98.7, tier: 1, lastRun: '2m ago' },
  { id: 'job_matcher', name: 'Job matcher', status: 'healthy', runs7d: 42, success: 95.2, tier: 1, lastRun: '6h ago' },
  { id: 'lead_scraper', name: 'Lead scraper', status: 'warning', runs7d: 21, success: 85.7, tier: 2, lastRun: '1d ago' },
  { id: 'market_scanner', name: 'Market scanner', status: 'healthy', runs7d: 7, success: 100, tier: 1, lastRun: '12h ago' },
  { id: 'board_scaffolder', name: 'Board scaffolder', status: 'idle', runs7d: 2, success: 100, tier: 2, lastRun: '3d ago' },
]
