// Static legal configuration — sourced from Beyond Peaks legal research.
// This data doesn't come from Supabase; it changes only when laws change.
//
// IMPORTANT: No operational data here. No candidate counts, no progress
// values, no todo lists, no agent data. All of that comes from Supabase.

export type RiskLevel = 'base' | 'critical' | 'high' | 'moderate'
export type CorridorComplexity = 'low' | 'medium' | 'high'
export type BoardStatus = 'live' | 'building' | 'planned' | 'research'
export type AgentStatus = 'healthy' | 'warning' | 'error' | 'idle'
export type NodeRole = 'hub' | 'market'
export type LensId = 'jurisdiction' | 'board' | 'flow' | 'agent'

export interface JurisdictionConfig {
  name: string
  sub: string
  flag: string
  role: NodeRole
  laws: string[]
  penalty: string
  risk: RiskLevel
  legalSummary: string
  transferNote: string
  boardSlugs: string[] // bridge to DB boards via boards.slug
}

export interface Corridor {
  from: string
  to: string
  label: string
  mech: string
  cx: CorridorComplexity
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

export const JURISDICTIONS: Record<string, JurisdictionConfig> = {
  jp: {
    name: 'Japan', sub: 'Tokyo HQ', flag: '🇯🇵', role: 'hub',
    laws: ['APPI', 'Employment Security Act'], penalty: '¥100M', risk: 'base',
    legalSummary: 'Central controller. All data stored Tokyo (Supabase/AWS). APPI Art. 27: prior consent for every employer share. Art. 28: country disclosure for AU, NZ, CA. Rikunabi precedent applies.',
    transferNote: 'Only EU/EEA/UK adequate. AU, NZ, CA require consent or contractual safeguards.',
    boardSlugs: ['niseko-winter', 'niseko', 'hakuba', 'furano'],
  },
  eu: {
    name: 'France', sub: 'French Alps', flag: '🇫🇷', role: 'market',
    laws: ['GDPR', 'EU AI Act', 'Labour Code'], penalty: '€20M / 4%', risk: 'critical',
    legalSummary: 'Highest compliance bar. AI = high-risk under EU AI Act (Aug 2 2026 deadline). DPIA mandatory. EU Rep required. CJEU SCHUFA: scoring = decision under Art. 22.',
    transferNote: 'EU-Japan adequacy (2019) — strongest asset. Data flows freely to Tokyo.',
    boardSlugs: ['french-alps'],
  },
  au: {
    name: 'Australia', sub: 'Expansion', flag: '🇦🇺', role: 'market',
    laws: ['Privacy Act 1988'], penalty: 'A$50M+', risk: 'high',
    legalSummary: 'Japan not whitelisted. Beyond Peaks accountable for overseas recipient breaches (APP 8). Nationality may be sensitive. ADM disclosure from Dec 2026.',
    transferNote: 'Contractual safeguards required. APEC CBPR available.',
    boardSlugs: ['thredbo'],
  },
  nz: {
    name: 'New Zealand', sub: 'Queenstown', flag: '🇳🇿', role: 'market',
    laws: ['Privacy Act 2020'], penalty: 'NZD $10K', risk: 'moderate',
    legalSummary: 'Principled framework, modest penalties. Not CBPR participant. Broad discrimination protections (nationality). OPC recommends human review for AI.',
    transferNote: 'IPP 12: comparable safeguards or individual auth. Cloud exemption may apply.',
    boardSlugs: ['queenstown'],
  },
  ca: {
    name: 'Canada', sub: 'Whistler', flag: '🇨🇦', role: 'market',
    laws: ['PIPEDA', 'Quebec Law 25'], penalty: 'CAD $25M / 4%', risk: 'critical',
    legalSummary: 'Quebec Law 25 is binding constraint. Mandatory PIA before cross-border transfer AND AI deployment. s.12.1: ADM transparency + human review. Visa = likely sensitive.',
    transferNote: 'Transfer Risk Assessment required. Canada is CBPR participant.',
    boardSlugs: ['whistler'],
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
