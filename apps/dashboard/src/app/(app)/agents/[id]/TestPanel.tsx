'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface ToolCallLog {
  tool_name: string
  tool_type: string
  input: unknown
  output: unknown
  duration_ms: number
}

interface RunResult {
  run_id: string
  output: string | null
  tool_calls: ToolCallLog[]
  token_count: number
  cost_usd: number
  duration_ms: number
}

export function TestPanel({ agentId }: { agentId: string }) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<RunResult | null>(null)
  const [expandedTools, setExpandedTools] = useState<Set<number>>(new Set())
  const outputRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  function toggleTool(index: number) {
    setExpandedTools((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  async function handleRun() {
    setLoading(true)
    setError(null)
    setResult(null)

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
            input: input || 'Hello, are you working?',
            triggered_by: 'test_panel',
          }),
        },
      )

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      setResult(data)
      router.refresh()
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <h2 className="text-sm font-medium text-zinc-300">Test panel</h2>
        <textarea
          className="input min-h-[100px] resize-y font-mono text-xs"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste test input here... (text or JSON)"
        />
        <div className="flex items-center gap-3">
          <button
            onClick={handleRun}
            disabled={loading}
            className="btn-primary"
          >
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
                Run test
              </>
            )}
          </button>
          {result && (
            <span className="text-xs text-zinc-500">
              {(result.duration_ms / 1000).toFixed(1)}s · {result.token_count} tokens · ${result.cost_usd.toFixed(4)}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-900/20 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      {result && (
        <div ref={outputRef} className="space-y-4">
          {/* Tool calls */}
          {result.tool_calls.length > 0 && (
            <div className="card space-y-2 p-0">
              <h3 className="px-4 pt-3 text-xs font-medium text-zinc-400">
                Tool calls ({result.tool_calls.length})
              </h3>
              <div className="divide-y divide-[#2e2e32]">
                {result.tool_calls.map((tc, i) => (
                  <div key={i}>
                    <button
                      onClick={() => toggleTool(i)}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs hover:bg-[#18181b]"
                    >
                      <svg
                        className={`h-3 w-3 text-zinc-500 transition-transform ${expandedTools.has(i) ? 'rotate-90' : ''}`}
                        viewBox="0 0 16 16"
                        fill="currentColor"
                      >
                        <path d="M6 4l4 4-4 4" />
                      </svg>
                      <span className="font-mono text-indigo-400">{tc.tool_name}</span>
                      <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">
                        {tc.tool_type}
                      </span>
                      <span className="ml-auto text-zinc-600">{tc.duration_ms}ms</span>
                    </button>
                    {expandedTools.has(i) && (
                      <div className="space-y-2 bg-[#0a0a0b] px-4 py-3">
                        <div>
                          <p className="mb-1 text-[10px] font-medium uppercase text-zinc-600">Input</p>
                          <pre className="overflow-auto text-xs text-zinc-400">
                            {JSON.stringify(tc.input, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <p className="mb-1 text-[10px] font-medium uppercase text-zinc-600">Output</p>
                          <pre className="max-h-48 overflow-auto text-xs text-zinc-400">
                            {JSON.stringify(tc.output, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Output */}
          <div className="card space-y-2">
            <h3 className="text-xs font-medium text-zinc-400">Output</h3>
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md bg-[#0a0a0b] p-3 font-mono text-xs text-zinc-300">
              {result.output ?? 'null'}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
