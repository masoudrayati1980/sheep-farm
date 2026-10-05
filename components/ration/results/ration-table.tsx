import { nf, toman } from '@/lib/format'
import type { Ration, Requirements } from '@/lib/ration/types'
import { cn } from '@/lib/utils'

export function RationTable({ ration, req }: { ration: Ration; req: Requirements }) {
  const group = req.mode === 'group'
  const heads = group ? req.headCount : 1
  const { totals } = ration

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <caption className="sr-only">{`ترکیب ${ration.title}`}</caption>
        <thead>
          <tr className="border-b text-right text-xs text-muted-foreground">
            <th scope="col" className="py-2 pe-2 font-medium">نهاده</th>
            <th scope="col" className="px-2 py-2 text-center font-medium">kg تر / رأس</th>
            <th scope="col" className="px-2 py-2 text-center font-medium">kg DM / رأس</th>
            <th scope="col" className="px-2 py-2 text-center font-medium">٪ DM</th>
            {group && <th scope="col" className="px-2 py-2 text-center font-medium">kg تر کل گروه</th>}
            <th scope="col" className="py-2 ps-2 text-left font-medium">هزینه / رأس (تومان)</th>
          </tr>
        </thead>
        <tbody>
          {ration.items.map((item) => (
            <tr key={item.feed.id} className="border-b">
              <th scope="row" className="py-2.5 pe-2 text-right font-medium">
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      'size-2 shrink-0 rounded-full',
                      item.feed.type === 'forage' ? 'bg-primary' : 'bg-warning',
                    )}
                    aria-hidden="true"
                  />
                  {item.feed.name}
                  <span className="sr-only">{item.feed.type === 'forage' ? '(علوفه)' : '(کنسانتره)'}</span>
                </span>
              </th>
              <td className="px-2 py-2.5 text-center font-semibold tabular-nums">{nf(item.kgAsFed, 3)}</td>
              <td className="px-2 py-2.5 text-center tabular-nums">{nf(item.kgDM, 3)}</td>
              <td className="px-2 py-2.5 text-center tabular-nums">
                <span className="flex items-center justify-center gap-2">
                  <span className="hidden h-1.5 w-12 overflow-hidden rounded-full bg-muted sm:block" aria-hidden="true">
                    <span className="block h-full rounded-full bg-primary/60" style={{ width: `${item.pctDM}%` }} />
                  </span>
                  {nf(item.pctDM, 1)}
                </span>
              </td>
              {group && <td className="px-2 py-2.5 text-center tabular-nums">{nf(item.kgAsFed * heads, 2)}</td>}
              <td className="py-2.5 ps-2 text-left tabular-nums">{toman(item.cost)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-semibold">
            <th scope="row" className="pt-3 pe-2 text-right">جمع</th>
            <td className="px-2 pt-3 text-center tabular-nums">{nf(totals.asFed, 3)}</td>
            <td className="px-2 pt-3 text-center tabular-nums">{nf(totals.dm, 3)}</td>
            <td className="px-2 pt-3 text-center tabular-nums">{nf(100, 1)}</td>
            {group && <td className="px-2 pt-3 text-center tabular-nums">{nf(totals.asFed * heads, 2)}</td>}
            <td className="pt-3 ps-2 text-left tabular-nums">{toman(totals.costPerHead)}</td>
          </tr>
        </tfoot>
      </table>
      <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
          علوفه
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-warning" aria-hidden="true" />
          کنسانتره
        </span>
      </div>
    </div>
  )
}
