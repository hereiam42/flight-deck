'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Database } from '@flight-deck/shared'

type Agent = Database['public']['Tables']['agents']['Row']

const MODELS = [
  'claude-sonnet-4-6',
  'claude-opus-4-6',
  'claude-haiku-4-5-20251001',
]

export function AgentEditForm({ agent }: { agent: Agent }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const [form, setForm] = useState({
    name: agent.name,
    description: agent.description ?? '',
    system_prompt: agent.system_prompt,
    model: agent.model,
    schedule: agent.schedule ?? '',
    status: agent.status,
  })

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
    setSaved(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const promptChanged = form.system_prompt !== agent.system_prompt

    // If prompt changed, archive current version before saving
    if (promptChanged) {
      // Get the latest version number
      const { data: latestVersion } = await supabase
        .from('prompt_versions')
        .select('version_number')
        .eq('agent_id', agent.id)
        .order('version_number', { ascending: false })
        .limit(1)
        .single()

      const nextVersion = (latestVersion?.version_number ?? 0) + 1

      // Archive the old prompt
      if (nextVersion === 1) {
        // First version change — save the original prompt as v1
        await supabase.from('prompt_versions').insert({
          agent_id: agent.id,
          workspace_id: agent.workspace_id,
          version_number: 1,
          system_prompt: agent.system_prompt,
          change_note: 'Original prompt',
          status: 'archived',
          created_by: 'manual',
        })
      }

      // Mark all existing versions as archived
      await supabase
        .from('prompt_versions')
        .update({ status: 'archived' })
        .eq('agent_id', agent.id)

      // Save the new prompt as the active version
      await supabase.from('prompt_versions').insert({
        agent_id: agent.id,
        workspace_id: agent.workspace_id,
        version_number: nextVersion === 1 ? 2 : nextVersion,
        system_prompt: form.system_prompt,
        change_note: 'Manual edit',
        status: 'active',
        created_by: 'manual',
      })
    }

    const { error: err } = await supabase
      .from('agents')
      .update({
        name: form.name,
        description: form.description || null,
        system_prompt: form.system_prompt,
        model: form.model,
        schedule: form.schedule || null,
        status: form.status as Agent['status'],
      })
      .eq('id', agent.id)

    if (err) {
      setError(err.message)
    } else {
      setSaved(true)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="card space-y-4">
        <h2 className="text-sm font-medium text-zinc-300">Edit agent</h2>

        <div>
          <label className="label mb-1.5">Name</label>
          <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </div>

        <div>
          <label className="label mb-1.5">Description</label>
          <input className="input" value={form.description} onChange={(e) => set('description', e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label mb-1.5">Model</label>
            <select className="input" value={form.model} onChange={(e) => set('model', e.target.value)}>
              {MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="label mb-1.5">Status</label>
            <select className="input" value={form.status} onChange={(e) => set('status', e.target.value)}>
              <option value="active">active</option>
              <option value="paused">paused</option>
              <option value="archived">archived</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label mb-1.5">Schedule (cron)</label>
          <input className="input font-mono" value={form.schedule} onChange={(e) => set('schedule', e.target.value)} placeholder="0 9 * * 1-5" />
        </div>

        <div>
          <label className="label mb-1.5">System prompt</label>
          <textarea
            className="input min-h-[160px] resize-y font-mono text-xs"
            value={form.system_prompt}
            onChange={(e) => set('system_prompt', e.target.value)}
            required
          />
        </div>
      </div>

      {error && <div className="rounded-md bg-red-900/20 px-3 py-2 text-sm text-red-400">{error}</div>}
      {saved && <div className="rounded-md bg-emerald-900/20 px-3 py-2 text-sm text-emerald-400">Saved.</div>}

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  )
}
