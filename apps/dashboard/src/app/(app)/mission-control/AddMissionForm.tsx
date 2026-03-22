'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Props {
  workspaceId: string
  ventures: Record<string, { label: string; short: string; badgeCls: string; badgeStackCls: string }>
}

export function AddMissionForm({ workspaceId, ventures }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [venture, setVenture] = useState('beyond_peaks')
  const [urgency, setUrgency] = useState(5)
  const [impact, setImpact] = useState(5)
  const [context, setContext] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim()) return
    setSaving(true)

    await supabase.from('missions').insert({
      workspace_id: workspaceId,
      title: title.trim(),
      venture,
      urgency_score: urgency,
      impact_score: impact,
      claude_context: context.trim() || null,
      status: 'queued',
    })

    await supabase.rpc('rerank_missions', { ws_id: workspaceId })

    setTitle('')
    setContext('')
    setUrgency(5)
    setImpact(5)
    setSaving(false)
    setOpen(false)
    router.refresh()
  }

  if (!open) {
    return (
      <div className="text-center">
        <button onClick={() => setOpen(true)} className="btn-secondary">
          + Add mission
        </button>
      </div>
    )
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-300">New mission</h3>
        <button onClick={() => setOpen(false)} className="btn-ghost !p-1 text-zinc-500">✕</button>
      </div>

      <div>
        <label className="label mb-1">What needs to get done?</label>
        <input
          className="input"
          placeholder="Write employer outreach sequence — Hakuba"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label mb-1">Venture</label>
          <select
            className="input"
            value={venture}
            onChange={(e) => setVenture(e.target.value)}
          >
            {Object.entries(ventures).map(([key, v]) => (
              <option key={key} value={key}>{v.short} — {v.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label mb-1">Impact (1-10)</label>
          <input
            type="number" min="1" max="10"
            className="input"
            value={impact}
            onChange={(e) => setImpact(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="label mb-1">Urgency (1-10)</label>
          <input
            type="number" min="1" max="10"
            className="input"
            value={urgency}
            onChange={(e) => setUrgency(Number(e.target.value))}
          />
        </div>
      </div>

      <div>
        <label className="label mb-1">Claude context <span className="text-zinc-600">(optional)</span></label>
        <textarea
          className="input min-h-[80px]"
          placeholder="Pre-loaded prompt so Claude has everything it needs to help execute this mission..."
          value={context}
          onChange={(e) => setContext(e.target.value)}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!title.trim() || saving}
        className="btn-primary w-full justify-center"
      >
        {saving ? 'Adding...' : 'Add to stack'}
      </button>
    </div>
  )
}
