import { Badge } from '@/components/ui/badge'

const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  completed: 'default',
  hired: 'default',
  open: 'default',
  new: 'secondary',
  pending: 'secondary',
  running: 'secondary',
  applied: 'secondary',
  screening: 'secondary',
  interview: 'secondary',
  paused: 'outline',
  archived: 'outline',
  rejected: 'destructive',
  failed: 'destructive',
  closed: 'outline',
  filled: 'outline',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={variants[status] ?? 'outline'} className="capitalize">
      {status.replace(/_/g, ' ')}
    </Badge>
  )
}
