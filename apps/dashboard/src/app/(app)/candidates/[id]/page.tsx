import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspaceId } from '@/lib/workspace'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader } from '@/components/refine/PageHeader'
import { StatusBadge } from '@/components/refine/StatusBadge'

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const workspaceId = await getCurrentWorkspaceId()

  const { data: candidate } = await supabase
    .from('candidates')
    .select('*, boards:source_board_id(name)')
    .eq('id', id)
    .eq('workspace_id', workspaceId ?? '')
    .single()

  if (!candidate) notFound()

  const board = candidate.boards as { name: string } | null

  const { data: applications } = await supabase
    .from('applications')
    .select('*, jobs(title, employers(company_name))')
    .eq('candidate_id', id)
    .order('created_at', { ascending: false })

  const languages = Array.isArray(candidate.languages) ? candidate.languages : []
  const skills = Array.isArray(candidate.skills) ? candidate.skills : []
  const preferredRegions = Array.isArray(candidate.preferred_regions) ? candidate.preferred_regions : []
  const completeness = candidate.profile_completeness ?? 0

  const fields: Array<{ label: string; value: React.ReactNode }> = [
    { label: 'Email', value: candidate.email },
    { label: 'Phone', value: candidate.phone },
    { label: 'Nationality', value: candidate.nationality },
    { label: 'Visa Status', value: candidate.visa_status ? <StatusBadge status={candidate.visa_status} /> : null },
    { label: 'Available From', value: candidate.available_from ? new Date(candidate.available_from).toLocaleDateString() : null },
    { label: 'Available To', value: candidate.available_to ? new Date(candidate.available_to).toLocaleDateString() : null },
    { label: 'Source', value: candidate.source_channel },
    { label: 'Board', value: board?.name },
    { label: 'Returning', value: candidate.returning_candidate ? 'Yes' : 'No' },
    { label: 'Seasons', value: candidate.seasons_completed?.toString() },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${candidate.first_name} ${candidate.last_name ?? ''}`}
        breadcrumbs={[
          { label: 'Candidates', href: '/candidates' },
          { label: `${candidate.first_name} ${candidate.last_name ?? ''}` },
        ]}
        action={<StatusBadge status={candidate.status} />}
      />

      {/* Profile */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {fields.map((f) => (
              <div key={f.label}>
                <p className="text-xs text-muted-foreground">{f.label}</p>
                <div className="mt-0.5 text-sm text-foreground">{f.value ?? '—'}</div>
              </div>
            ))}
          </div>

          {languages.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground">Languages</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {languages.map((l: string) => <Badge key={l} variant="outline">{l}</Badge>)}
              </div>
            </div>
          )}

          {skills.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground">Skills</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {skills.map((s: string) => <Badge key={s} variant="secondary">{s}</Badge>)}
              </div>
            </div>
          )}

          {preferredRegions.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground">Preferred Regions</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {preferredRegions.map((r: string) => <Badge key={r} variant="outline">{r}</Badge>)}
              </div>
            </div>
          )}

          {candidate.bio && (
            <div>
              <p className="text-xs text-muted-foreground">Bio</p>
              <p className="mt-0.5 text-sm text-foreground">{candidate.bio}</p>
            </div>
          )}

          {/* Completeness */}
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Profile completeness</span>
              <span className="font-mono text-muted-foreground">{completeness}%</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${completeness}%` }} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Applications ({(applications ?? []).length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Employer</TableHead>
                <TableHead>Match</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(applications ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                    No applications yet
                  </TableCell>
                </TableRow>
              ) : (
                (applications ?? []).map((app) => {
                  const job = app.jobs as { title: string; employers: { company_name: string } | null } | null
                  return (
                    <TableRow key={app.id}>
                      <TableCell className="text-foreground">{job?.title ?? '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{job?.employers?.company_name ?? '—'}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {app.match_score != null ? `${app.match_score}%` : '—'}
                      </TableCell>
                      <TableCell><StatusBadge status={app.status} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(app.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Link href="/candidates" className="inline-flex items-center rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted">
        ← Back to candidates
      </Link>
    </div>
  )
}
