export function DateCell({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="text-muted-foreground">—</span>
  return <span className="text-sm">{new Date(value).toLocaleDateString()}</span>
}
