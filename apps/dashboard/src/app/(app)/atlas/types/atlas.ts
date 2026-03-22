export type NodeType = 'core' | 'hub' | 'anchor' | 'regional' | 'micro'
export type SegmentId = 'wellness' | 'estate' | 'investment' | 'tourism' | 'govai'
export type StatusType = 'active' | 'planning' | 'pipeline' | 'blocked'
export type LensId = 'constellation' | 'segments' | 'pipeline' | 'partners'

export interface AtlasNode {
  id: string
  name: string
  nameJa?: string
  x: number
  y: number
  type: NodeType
  segments: SegmentId[]
}

export interface AtlasEdge {
  from: string
  to: string
  type: 'primary' | 'secondary' | 'tertiary'
}

export interface Segment {
  id: SegmentId
  label: string
  labelJa: string
  icon: string
  color: string
}

export interface Partner {
  id: string
  name: string
  nameJa?: string
  nodeId: string
  status: StatusType
  segment: SegmentId
}

export interface Program {
  id: string
  name: string
  date: string
  nodeId: string
  segment: SegmentId
  status: StatusType
  detail: string
}

export interface AtlasLens {
  id: LensId
  label: string
  icon: string
}

export interface AtlasData {
  nodes: AtlasNode[]
  edges: AtlasEdge[]
  segments: Record<SegmentId, Segment>
  partners: Partner[]
  programs: Program[]
}
