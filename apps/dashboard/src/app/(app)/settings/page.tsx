import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspaceId } from '@/lib/workspace'
import { MembersTable } from './MembersTable'
import { SecretsTable } from './SecretsTable'

export default async function SettingsPage() {
  const supabase = await createClient()
  const workspaceId = await getCurrentWorkspaceId()

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', workspaceId ?? '')
    .single()

  const { data: members } = await supabase
    .from('workspace_members')
    .select('*, auth_users:user_id(email)')
    .eq('workspace_id', workspaceId ?? '')

  const { data: secrets } = await supabase
    .from('secrets')
    .select('id, key, created_at')
    .eq('workspace_id', workspaceId ?? '')
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Settings</h1>
        <p className="text-sm text-zinc-500">Workspace configuration</p>
      </div>

      {/* Workspace info */}
      <section className="card space-y-4">
        <h2 className="text-sm font-medium text-zinc-300">Workspace</h2>
        {workspace ? (
          <dl className="space-y-2 text-sm">
            <div className="flex gap-4">
              <dt className="w-24 shrink-0 text-zinc-500">Name</dt>
              <dd className="text-zinc-300">{workspace.name}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-24 shrink-0 text-zinc-500">Slug</dt>
              <dd className="font-mono text-xs text-zinc-400">{workspace.slug}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-24 shrink-0 text-zinc-500">ID</dt>
              <dd className="font-mono text-xs text-zinc-500">{workspace.id}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-zinc-500">No workspace selected</p>
        )}
      </section>

      {/* Team members */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-zinc-300">Team members</h2>
        <MembersTable members={members ?? []} />
      </section>

      {/* Secrets */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-zinc-300">API keys & secrets</h2>
        <p className="text-xs text-zinc-500">
          Secret values are encrypted and only readable by edge functions via the service role.
        </p>
        <SecretsTable secrets={secrets ?? []} workspaceId={workspaceId ?? ''} />
      </section>
    </div>
  )
}
