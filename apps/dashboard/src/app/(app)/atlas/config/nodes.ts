import type { AtlasNode } from '../types/atlas'

export const NODES: AtlasNode[] = [
  { id: 'japan', name: 'Japan', nameJa: '日本', x: 18, y: 78, type: 'hub', segments: ['wellness', 'estate', 'tourism', 'govai'] },
  { id: 'fiji', name: 'Fiji', nameJa: 'フィジー', x: 48, y: 44, type: 'core', segments: ['wellness', 'estate', 'investment', 'tourism', 'govai'] },
  { id: 'indonesia', name: 'Indonesia', x: 6, y: 48, type: 'regional', segments: [] },
  { id: 'png', name: 'Papua New Guinea', x: 16, y: 50, type: 'regional', segments: ['govai'] },
  { id: 'palau', name: 'Palau', x: 20, y: 68, type: 'micro', segments: ['govai'] },
  { id: 'micronesia', name: 'Micronesia', x: 30, y: 70, type: 'micro', segments: ['govai'] },
  { id: 'marshall', name: 'Marshall Islands', x: 42, y: 72, type: 'micro', segments: ['govai'] },
  { id: 'guam', name: 'Guam', x: 28, y: 82, type: 'micro', segments: [] },
  { id: 'solomon', name: 'Solomon Islands', x: 26, y: 46, type: 'regional', segments: [] },
  { id: 'vanuatu', name: 'Vanuatu', x: 34, y: 42, type: 'regional', segments: ['govai'] },
  { id: 'newcaledonia', name: 'New Caledonia', x: 32, y: 30, type: 'regional', segments: [] },
  { id: 'tonga', name: 'Tonga', x: 56, y: 36, type: 'regional', segments: ['tourism'] },
  { id: 'samoa', name: 'Samoa', x: 60, y: 48, type: 'regional', segments: [] },
  { id: 'cook', name: 'Cook Islands', x: 72, y: 46, type: 'regional', segments: [] },
  { id: 'frenchpoly', name: 'French Polynesia', x: 88, y: 48, type: 'regional', segments: [] },
  { id: 'australia', name: 'Australia', x: 16, y: 20, type: 'anchor', segments: [] },
  { id: 'newzealand', name: 'New Zealand', x: 36, y: 12, type: 'anchor', segments: [] },
]
