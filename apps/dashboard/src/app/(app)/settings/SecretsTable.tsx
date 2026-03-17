'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Secret {
  id: string
  key: string
  created_at: string
}

export function SecretsTable({
  secrets,
  workspaceId,
}: {
  secrets: Secret[]
  workspaceId: string
}) {
  const supabase = createClient()
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [key, setKey] = useState('')
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // NOTE: In production, this should go through an edge function
    // that calls vault.create_secret() on the server side.
    // Sending the raw value from the browser is a placeholder.
    const { error: err } = await supabase.from('secrets').insert({
      workspace_id: workspaceId,
      key,
      encrypted_value: `[encrypted:${value.substring(0, 4)}...]`,
    })

    if (err) {
      setError(err.message)
    } else {
      setKey('')
      setValue('')
      setAdding(false)
      router.refresh()
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    await supabase.from('secrets').delete().eq('id', id)
    router.refresh()
  }

  return (
    <div className="space-y-3">
      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2e2e32]">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Key</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Added</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2e2e32]">
            {secrets.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-zinc-500">No secrets yet</td>
              </tr>
            ) : (
              secrets.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-2.5 font-mono text-xs text-zinc-300">{s.key}</td>
                  <td className="px-4 py-2.5 text-xs text-zinc-500">
                    {new Date(s.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="btn-danger text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {adding ? (
        <form onSubmit={handleAdd} className="card space-y-3">
          <h3 className="text-sm font-medium text-zinc-300">Add secret</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label mb-1.5">Key name</label>
              <input
                className="input font-mono"
                placeholder="gmail_api_key"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label mb-1.5">Value</label>
              <input
                type="password"
                className="input font-mono"
                placeholder="••••••••"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
              />
            </div>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="btn-primary text-xs" disabled={loading}>
              {loading ? 'Saving…' : 'Save secret'}
            </button>
            <button type="button" className="btn-ghost text-xs" onClick={() => setAdding(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button onClick={() => setAdding(true)} className="btn-secondary text-xs">
          + Add secret
        </button>
      )}
    </div>
  )
}
