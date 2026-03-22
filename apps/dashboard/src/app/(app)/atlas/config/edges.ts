import type { AtlasEdge } from '../types/atlas'

export const EDGES: AtlasEdge[] = [
  // Primary corridor
  { from: 'japan', to: 'fiji', type: 'primary' },
  // Secondary constellation lines
  { from: 'indonesia', to: 'png', type: 'secondary' },
  { from: 'png', to: 'solomon', type: 'secondary' },
  { from: 'solomon', to: 'vanuatu', type: 'secondary' },
  { from: 'vanuatu', to: 'fiji', type: 'secondary' },
  { from: 'fiji', to: 'samoa', type: 'secondary' },
  { from: 'samoa', to: 'cook', type: 'secondary' },
  { from: 'cook', to: 'frenchpoly', type: 'secondary' },
  { from: 'palau', to: 'micronesia', type: 'secondary' },
  { from: 'micronesia', to: 'marshall', type: 'secondary' },
  { from: 'marshall', to: 'guam', type: 'secondary' },
  { from: 'png', to: 'australia', type: 'secondary' },
  { from: 'vanuatu', to: 'newcaledonia', type: 'secondary' },
  { from: 'fiji', to: 'tonga', type: 'secondary' },
  { from: 'newcaledonia', to: 'newzealand', type: 'secondary' },
  // Tertiary connections
  { from: 'japan', to: 'palau', type: 'tertiary' },
  { from: 'japan', to: 'guam', type: 'tertiary' },
]
