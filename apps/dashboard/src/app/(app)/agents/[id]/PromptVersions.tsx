'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Version {
  id: string
  version_number: number
  system_prompt: string
  change_note: string | null
  status: string
  created_at: string
  created_by: string
}

export function PromptVersions({ agentId, versions }: { agentId: string; versions: Version[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  async function restore(version: Version) {
    if (!confirm(`Restore prompt version ${version.version_number}?`)) return
    setLoading(true)
    const supabase = createClient()

    // Archive all versions
    await supabase
      .from('prompt_versions')
      .update({ status: 'archived' })
      .eq('agent_id', agentId)

    // Mark the restored one as active
    await supabase
      .from('prompt_versions')
      .update({ status: 'active' })
      .eq('id', version.id)

    // Update the agent's system_prompt
    await supabase
      .from('agents')
      .update({ system_prompt: version.system_prompt })
      .eq('id', agentId)

    router.refresh()
    setLoading(false)
  }

  if (versions.length === 0) return null

  return (
    <div className="card space-y-2">
      <h3 className="text-sm font-medium text-zinc-300">Prompt versions</h3>
      <div className="divide-y divide-[#2e2e32]">
        {versions.map((v) => (
          <div key={v.id} className="py-2">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setExpanded(expanded === v.id ? null : v.id)}
                className="flex items-center gap-2 text-left text-xs"
              >
                <svg
                  className={`h-3 w-3 text-zinc-500 transition-transform ${expanded === v.id ? 'rotate-90' : ''}`}
                  viewBox="0 0 16 16" fill="currentColor"
                >
                  <path d="M6 4l4 4-4 4" />
                </svg>
                <span className="font-mono text-zinc-400">v{v.version_number}</span>
                <span className={`rounded px-1 py-0.5 text-[10px] ${
                  v.status === 'active' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
                }`}>
                  {v.status}
                </span>
                <span className="text-zinc-600">{new Date(v.created_at).toLocaleDateString()}</span>
              </button>
              {v.status !== 'active' && (
                <button
                  onClick={() => restore(v)}
                  disabled={loading}
                  className="text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
                >
                  Restore
                </button>
              )}
            </div>
            {v.change_note && (
              <p className="ml-5 mt-0.5 text-[10px] text-zinc-600">{v.change_note}</p>
            )}
            {expanded === v.id && (
              <pre className="mt-2 ml-5 max-h-40 overflow-auto rounded bg-[#0a0a0b] p-2 font-mono text-[10px] text-zinc-500">
                {v.system_prompt}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
