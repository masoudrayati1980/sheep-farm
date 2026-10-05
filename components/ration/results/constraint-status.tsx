import { CircleCheck, CircleX } from 'lucide-react'
import { nf } from '@/lib/format'
import type { ConstraintCheck } from '@/lib/ration/types'
import { cn } from '@/lib/utils'
import { RangeBar } from './range-bar'

function StatusBadge({ check }: { check: ConstraintCheck }) {
  if (!check.ok) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
        <CircleX className="size-3.5" aria-hidden="true" />
        خارج از محدوده
      </span>
    )
  }
  const text = check.binding === 'min' ? 'روی حد پایین' : check.binding === 'max' ? 'روی حد بالا' : 'در محدوده'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        check.binding ? 'bg-accent/60 text-accent-foreground' : 'bg-success/12 text-success',
      )}
    >
      <CircleCheck className="size-3.5" aria-hidden="true" />
      {text}
    </span>
  )
}

export function ConstraintTable({ checks, caption }: { checks: ConstraintCheck[]; caption: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b text-right text-xs text-muted-foreground">
            <th scope="col" className="py-2 pe-2 font-medium">شاخص</th>
            <th scope="col" className="px-2 py-2 text-center font-medium">حداقل</th>
            <th scope="col" className="px-2 py-2 text-center font-medium">مقدار جیره</th>
            <th scope="col" className="px-2 py-2 text-center font-medium">حداکثر</th>
            <th scope="col" className="w-[28%] px-3 py-2 font-medium">
              <span className="sr-only">نمودار موقعیت</span>
            </th>
            <th scope="col" className="py-2 ps-2 font-medium">وضعیت</th>
          </tr>
        </thead>
        <tbody>
          {checks.map((c) => (
            <tr key={c.key} className="border-b last:border-b-0">
              <th scope="row" className="py-3 pe-2 text-right font-medium">
                {c.label}
                <span className="ms-1.5 text-xs font-normal text-muted-foreground">{c.unit}</span>
              </th>
              <td className="px-2 py-3 text-center tabular-nums text-muted-foreground">{nf(c.min, c.digits)}</td>
              <td className={cn('px-2 py-3 text-center font-semibold tabular-nums', !c.ok && 'text-destructive')}>
                {nf(c.value, c.digits)}
              </td>
              <td className="px-2 py-3 text-center tabular-nums text-muted-foreground">{nf(c.max, c.digits)}</td>
              <td className="px-3 py-3">
                <RangeBar min={c.min} max={c.max} value={c.value} ok={c.ok} />
              </td>
              <td className="py-3 ps-2">
                <StatusBadge check={c} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
