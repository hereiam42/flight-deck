import type { Segment, SegmentId } from '../types/atlas'

export const SEGMENTS: Record<SegmentId, Segment> = {
  wellness: { id: 'wellness', label: 'Pacific Wellness', labelJa: 'パシフィック・ウェルネス', icon: '🌺', color: '#a78bfa' },
  estate: { id: 'estate', label: 'Pacific Estate', labelJa: 'パシフィック・エステート', icon: '📸', color: '#e8d8a0' },
  investment: { id: 'investment', label: 'Yasawa Investment', labelJa: 'ヤサワ投資', icon: '🏕️', color: '#34d399' },
  tourism: { id: 'tourism', label: 'NAMA Nurture', labelJa: 'NAMAナーチャー', icon: '🇫🇯', color: '#fb923c' },
  govai: { id: 'govai', label: 'Government AI', labelJa: '政府AI', icon: '🤖', color: '#60a5fa' },
}
