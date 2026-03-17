'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const MODELS = [
  'claude-sonnet-4-6',
  'claude-opus-4-6',
  'claude-haiku-4-5-20251001',
]

export default function NewAgentPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    description: '',
    system_prompt: '',
    model: 'claude-sonnet-4-6',
    schedule: '',
  })

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Get current workspace from cookie
    const workspaceId = document.cookie
      .split('; ')
      .find((r) => r.startsWith('workspace_id='))
      ?.split('=')[1]

    if (!workspaceId) {
      setError('No workspace selected')
      setLoading(false)
      return
    }

    const { data, error: err } = await supabase
      .from('agents')
      .insert({
        workspace_id: workspaceId,
        name: form.name,
        description: form.description || null,
        system_prompt: form.system_prompt,
        model: form.model,
        schedule: form.schedule || null,
      })
      .select()
      .single()

    if (err) {
      setError(err.message)
      setLoading(false)
    } else {
      router.push(`/agents/${data.id}`)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">New agent</h1>
        <p className="text-sm text-zinc-500">Define what this agent does and how it runs</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card space-y-4">
          <h2 className="text-sm font-medium text-zinc-300">Basic info</h2>

          <div>
            <label className="label mb-1.5" htmlFor="name">Name *</label>
            <input
              id="name"
              className="input"
              placeholder="e.g. Job Board Scraper"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label mb-1.5" htmlFor="description">Description</label>
            <input
              id="description"
              className="input"
              placeholder="What does this agent do?"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>

          <div>
            <label className="label mb-1.5" htmlFor="model">Model</label>
            <select
              id="model"
              className="input"
              value={form.model}
              onChange={(e) => set('model', e.target.value)}
            >
              {MODELS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="text-sm font-medium text-zinc-300">System prompt</h2>
          <div>
            <label className="label mb-1.5" htmlFor="system_prompt">
              Instructions *
            </label>
            <textarea
              id="system_prompt"
              className="input min-h-[180px] resize-y font-mono text-xs"
              placeholder="You are an agent that..."
              value={form.system_prompt}
              onChange={(e) => set('system_prompt', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="text-sm font-medium text-zinc-300">Schedule</h2>
          <div>
            <label className="label mb-1.5" htmlFor="schedule">
              Cron expression <span className="text-zinc-500">(optional — leave blank for manual only)</span>
            </label>
            <input
              id="schedule"
              className="input font-mono"
              placeholder="0 9 * * 1-5"
              value={form.schedule}
              onChange={(e) => set('schedule', e.target.value)}
            />
            <p className="mt-1.5 text-xs text-zinc-500">
              Standard cron format: minute hour day-of-month month day-of-week
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-900/20 px-3 py-2 text-sm text-red-400">{error}</div>
        )}

        <div className="flex gap-3">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating…' : 'Create agent'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => router.back()}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
