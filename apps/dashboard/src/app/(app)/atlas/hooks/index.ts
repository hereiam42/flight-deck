import { NODES } from '../config/nodes'
import { EDGES } from '../config/edges'
import { SEGMENTS } from '../config/segments'
import { PARTNERS } from '../config/partners'
import { PROGRAMS } from '../config/programs'
import type { AtlasData } from '../types/atlas'

/**
 * Foundation hook: returns static mock data.
 *
 * FUTURE: Replace internals with Supabase queries.
 * The return shape (AtlasData) is the contract —
 * components never know if data is mock or live.
 */
export function useAtlasData(): AtlasData & { isLive: boolean } {
  return {
    nodes: NODES,
    edges: EDGES,
    segments: SEGMENTS,
    partners: PARTNERS,
    programs: PROGRAMS,
    isLive: false,
  }
}
