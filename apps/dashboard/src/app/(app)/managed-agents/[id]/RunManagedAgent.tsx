'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface ProgressStep {
  step: string
  status: 'running' | 'completed' | 'error'
  detail: string
  ts: string
}

interface StreamEvent {
  status: 'running' | 'completed' | 'failed'
  progress_steps: ProgressStep[]
  current_step: string | null
  progress_pct: number
  output_summary: string | null
  error: string | null
}

export function RunManagedAgent({ agentId, agentName }: { agentId: string; agentName: string }) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Progress state
  const [steps, setSteps] = useState<ProgressStep[]>([])
  const [currentStep, setCurrentStep] = useState<string | null>(null)
  const [progressPct, setProgressPct] = useState(0)
  const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle')
  const [summary, setSummary] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  // Clean up SSE on unmount
  useEffect(() => {
    return () => { eventSourceRef.current?.close() }
  }, [])

  async function handleRun(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setStarting(true)
    setError(null)
    setSteps([])
    setCurrentStep(null)
    setProgressPct(0)
    setStatus('idle')
    setSummary(null)

    try {
      const res = await fetch(`/api/agents/${agentId}/start`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: message.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to start')
        setStarting(false)
        return
      }

      setSessionId(data.session_id)
      setStatus('running')
      setStarting(false)

      // Open SSE stream
      const es = new EventSource(`/api/agents/${agentId}/sessions/${data.session_id}/stream`)
      eventSourceRef.current = es

      es.onmessage = (event) => {
        const d: StreamEvent = JSON.parse(event.data)
        setSteps(d.progress_steps ?? [])
        setCurrentStep(d.current_step)
        setProgressPct(d.progress_pct)
        setSummary(d.output_summary)

        if (d.status === 'completed') {
          setStatus('completed')
          es.close()
          router.refresh()
        } else if (d.status === 'failed') {
          setStatus('failed')
          setError(d.error ?? 'Agent failed')
          es.close()
        }
      }

      es.onerror = () => {
        es.close()
        // Don't error out — may just be the stream ending
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
      setStarting(false)
    }
  }

  const isRunning = status === 'running' || starting

  return (
    <div className="card space-y-4">
      <h2 className="text-sm font-medium text-zinc-300">Run {agentName}</h2>

      <form onSubmit={handleRun} className="space-y-3">
        <textarea
          className="input min-h-[80px] resize-y text-sm"
          placeholder="e.g. Find 5 seasonal employers hiring in Niseko for winter 2026-27"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isRunning}
          required
        />
        <button type="submit" className="btn-primary" disabled={isRunning || !message.trim()}>
          {starting ? 'Starting…' : 'Run now'}
        </button>
      </form>

      {/* Progress timeline */}
      {status !== 'idle' && (
        <div className="space-y-3">
          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">{currentStep ?? 'Starting…'}</span>
              <span className="font-mono text-zinc-500">{progressPct}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  status === 'failed' ? 'bg-red-500' :
                  status === 'completed' ? 'bg-emerald-500' :
                  'bg-indigo-500'
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Step timeline */}
          <div className="space-y-1.5">
            {steps.map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="mt-0.5 flex-shrink-0">
                  {s.status === 'completed' ? (
                    <svg className="h-3.5 w-3.5 text-emerald-400" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 15A7 7 0 118 1a7 7 0 010 14zm3.354-8.646a.5.5 0 00-.708-.708L7 9.293 5.354 7.646a.5.5 0 10-.708.708l2 2a.5.5 0 00.708 0l4-4z" />
                    </svg>
                  ) : s.status === 'error' ? (
                    <svg className="h-3.5 w-3.5 text-red-400" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 15A7 7 0 118 1a7 7 0 010 14zM5.354 5.354a.5.5 0 00-.708.708L7.293 8l-2.647 2.646a.5.5 0 00.708.708L8 8.707l2.646 2.647a.5.5 0 00.708-.708L8.707 8l2.647-2.646a.5.5 0 00-.708-.708L8 7.293 5.354 4.646z" />
                    </svg>
                  ) : (
                    <svg className="h-3.5 w-3.5 animate-spin text-indigo-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}>
                      <circle cx="8" cy="8" r="5" strokeOpacity={0.3} />
                      <path d="M8 3a5 5 0 015 5" strokeLinecap="round" />
                    </svg>
                  )}
                </span>
                <span className={
                  s.status === 'completed' ? 'text-zinc-400' :
                  s.status === 'error' ? 'text-red-400' :
                  'text-zinc-200'
                }>
                  {s.detail}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Result banner */}
      {status === 'completed' && summary && (
        <div className="rounded-md bg-emerald-900/20 px-3 py-2 text-sm text-emerald-400">
          {summary}
          {sessionId && (
            <a
              href={`/managed-agents/${agentId}/sessions/${sessionId}`}
              className="ml-2 underline hover:text-emerald-300"
            >
              View session →
            </a>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-md bg-red-900/20 px-3 py-2 text-sm text-red-400">{error}</div>
      )}
    </div>
  )
}
