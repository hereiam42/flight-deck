import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspaceId } from '@/lib/workspace'
import Link from 'next/link'

const OUTREACH_STATUSES = [
  'new',
  'contacted',
  'follow_up_1',
  'follow_up_2',
  'responded',
  'converted',
  'rejected',
  'stale',
] as const

function formatStatus(status: string): string {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export default async function LeadsPage() {
  const supabase = await createClient()
  const workspaceId = await getCurrentWorkspaceId()

  const { data: leads } = await supabase
    .from('employer_leads')
    .select('*, boards(name)')
    .eq('workspace_id', workspaceId ?? '')
    .order('created_at', { ascending: false })

  const allLeads = leads ?? []

  // Group by outreach_status
  const grouped: Record<string, typeof allLeads> = {}
  for (const status of OUTREACH_STATUSES) {
    grouped[status] = []
  }
  for (const lead of allLeads) {
    const status = lead.outreach_status as string
    if (grouped[status]) {
      grouped[status].push(lead)
    } else {
      grouped[status] = [lead]
    }
  }

  // Stats
  const totalLeads = allLeads.length
  const newCount = grouped['new'].length
  const inOutreachCount =
    grouped['contacted'].length +
    grouped['follow_up_1'].length +
    grouped['follow_up_2'].length
  const convertedCount = grouped['converted'].length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Employer Leads</h1>
        <p className="text-sm text-zinc-500">{totalLeads} total leads in pipeline</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="stat-card">
          <p className="text-xs text-zinc-500">Total leads</p>
          <p className="text-2xl font-semibold text-zinc-100">{totalLeads}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-zinc-500">New</p>
          <p className="text-2xl font-semibold text-zinc-100">{newCount}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-zinc-500">In outreach</p>
          <p className="text-2xl font-semibold text-zinc-100">{inOutreachCount}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-zinc-500">Converted</p>
          <p className="text-2xl font-semibold text-zinc-100">{convertedCount}</p>
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {OUTREACH_STATUSES.map((status) => {
          const items = grouped[status]
          return (
            <div key={status} className="flex-shrink-0 w-72">
              {/* Column header */}
              <div className="bg-[#111113] rounded-t-lg border border-b-0 border-[#2e2e32] px-3 py-2.5 flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-300">
                  {formatStatus(status)}
                </span>
                <span className="text-xs font-medium text-zinc-500 bg-[#18181b] rounded-full px-2 py-0.5">
                  {items.length}
                </span>
              </div>

              {/* Column body */}
              <div className="bg-[#111113] border border-t-0 border-[#2e2e32] rounded-b-lg p-2 max-h-[calc(100vh-16rem)] overflow-y-auto">
                {items.length === 0 ? (
                  <p className="py-6 text-center text-xs text-zinc-600">No leads</p>
                ) : (
                  items.map((lead) => (
                    <div
                      key={lead.id}
                      className="bg-[#18181b] border border-[#2e2e32] rounded-lg p-3 mb-2"
                    >
                      <p className="text-sm font-medium text-zinc-200">
                        {lead.company_name}
                      </p>
                      {lead.location && (
                        <p className="text-xs text-zinc-400 mt-1">{lead.location}</p>
                      )}
                      {lead.source && (
                        <span className="inline-block mt-1.5 text-xs font-medium text-zinc-400 bg-[#111113] border border-[#2e2e32] rounded px-1.5 py-0.5">
                          {lead.source}
                        </span>
                      )}
                      {lead.contact_name && (
                        <p className="text-xs text-zinc-500 mt-1.5">
                          Contact: {lead.contact_name}
                        </p>
                      )}
                      <p className="text-xs text-zinc-500 mt-1">
                        {(lead.boards as { name: string } | null)?.name ?? '—'}
                      </p>
                      {(lead.last_contacted_at || lead.next_follow_up_at) && (
                        <p className="text-xs text-zinc-600 mt-1.5">
                          {lead.next_follow_up_at
                            ? `Follow-up: ${new Date(lead.next_follow_up_at).toLocaleDateString()}`
                            : `Last contact: ${new Date(lead.last_contacted_at!).toLocaleDateString()}`}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
