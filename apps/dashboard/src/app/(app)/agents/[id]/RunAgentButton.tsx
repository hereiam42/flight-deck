'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function RunAgentButton({ agentId }: { agentId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleRun() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/agent-runtime`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            agent_id: agentId,
            input: {},
            triggered_by: 'manual',
          }),
        },
      )

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Run failed')
      }

      const { run_id } = await res.json()
      router.push(`/runs/${run_id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button onClick={handleRun} disabled={loading} className="btn-primary">
        {loading ? (
          <>
            <span className="h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white" />
            Running…
          </>
        ) : (
          <>
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
              <path d="M6.271 3.748a.5.5 0 00-.771.42v7.664a.5.5 0 00.771.42l6.5-3.832a.5.5 0 000-.84L6.271 3.748z" />
            </svg>
            Run now
          </>
        )}
      </button>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  )
}
