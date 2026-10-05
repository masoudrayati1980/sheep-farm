import { cn } from '@/lib/utils'

interface Props {
  min: number | null
  max: number | null
  value: number
  ok: boolean
}

export function RangeBar({ min, max, value, ok }: Props) {
  const lowRef = min ?? 0
  const highRef = max ?? Math.max(value, lowRef) * 1.3 + 1e-9
  const span = Math.max(highRef - lowRef, Math.abs(highRef) * 0.1, 1e-9)
  const lo = Math.min(lowRef - span * 0.3, value)
  const hi = Math.max(highRef + span * 0.3, value)
  const pos = (v: number) => ((v - lo) / (hi - lo)) * 100
  const start = pos(lowRef)
  const end = max == null ? 100 : pos(highRef)

  return (
    <div className="relative h-2 w-full rounded-full bg-muted" aria-hidden="true">
      <div
        className="absolute inset-y-0 rounded-full bg-primary/25"
        style={{ insetInlineStart: `${start}%`, width: `${end - start}%` }}
      />
      <div
        className={cn(
          'absolute -top-1 h-4 w-1.5 rounded-full ring-2 ring-card',
          ok ? 'bg-primary' : 'bg-destructive',
        )}
        style={{ right: `${pos(value)}%`, transform: 'translateX(50%)' }}
      />
    </div>
  )
}
