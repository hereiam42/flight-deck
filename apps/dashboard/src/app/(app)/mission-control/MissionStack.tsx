'use client'

import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Props {
  missionId: string
  workspaceId: string
  action: 'complete' | 'promote' | 'kill' | 'commit'
}

export function MissionStack({ missionId, workspaceId, action }: Props) {
  const router = useRouter()

  const handleAction = async () => {
    switch (action) {
      case 'complete':
        await supabase.from('missions').update({ status: 'done', completed_at: new Date().toISOString() }).eq('id', missionId)
        break
      case 'promote':
        await supabase.from('missions').update({ status: 'today' }).eq('id', missionId)
        break
      case 'kill':
        await supabase.from('missions').update({ status: 'killed' }).eq('id', missionId)
        break
      case 'commit':
        await supabase.from('missions').update({ status: 'today', last_touched: new Date().toISOString() }).eq('id', missionId)
        break
    }
    // Rerank
    await supabase.rpc('rerank_missions', { ws_id: workspaceId })
    router.refresh()
  }

  const config = {
    complete: { label: 'Done', className: 'btn-ghost !text-emerald-400 hover:!bg-emerald-500/10' },
    promote: { label: '↑ Today', className: 'btn-ghost !text-xs' },
    kill: { label: 'Kill', className: 'text-[11px] rounded px-2 py-0.5 border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer' },
    commit: { label: 'Commit', className: 'text-[11px] rounded px-2 py-0.5 bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors cursor-pointer' },
  }

  const c = config[action]

  return (
    <button onClick={handleAction} className={c.className}>
      {c.label}
    </button>
  )
}
