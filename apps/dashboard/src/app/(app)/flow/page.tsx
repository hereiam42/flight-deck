import { getCurrentWorkspaceId } from '@/lib/workspace'
import { FlowView } from './FlowView'

export const metadata = {
  title: 'Flow Visualisation | Flight Deck',
}

export default async function FlowPage() {
  const workspaceId = await getCurrentWorkspaceId()
  return <FlowView workspaceId={workspaceId} />
}
