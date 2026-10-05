import { nf, toman } from '@/lib/format'
import type { Ration } from '@/lib/ration/types'
import { cn } from '@/lib/utils'

export function ComparisonTable({ rations, selectedId }: { rations: Ration[]; selectedId: string }) {
  const feedMap = new Map<string, string>()
  for (const r of rations) for (const i of r.items) feedMap.set(i.feed.id, i.feed.name)
  const feedIds = [...feedMap.keys()]
  const kg = (r: Ration, id: string) => r.items.find((i) => i.feed.id === id)?.kgAsFed ?? 0

  const metricRows: { label: string; render: (r: Ration) => string }[] = [
    { label: 'هزینه هر رأس (تومان)', render: (r) => toman(r.totals.costPerHead) },
    { label: 'ماده خشک (kg/روز)', render: (r) => nf(r.totals.dm, 2) },
    { label: 'انرژی (Mcal/روز)', render: (r) => nf(r.totals.energy, 2) },
    { label: 'پروتئین (g/روز)', render: (r) => nf(r.totals.cp, 0) },
    { label: 'علوفه (٪ DM)', render: (r) => nf(r.totals.foragePct, 1) },
  ]

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-sm">
        <caption className="sr-only">مقایسه جیره‌های پیشنهادی</caption>
        <thead>
          <tr className="border-b text-right text-xs text-muted-foreground">
            <th scope="col" className="py-2 pe-2 font-medium">شاخص</th>
            {rations.map((r) => (
              <th
                key={r.id}
                scope="col"
                className={cn('px-2 py-2 text-center font-medium', r.id === selectedId && 'text-foreground')}
              >
                {r.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {metricRows.map((m) => (
            <tr key={m.label} className="border-b">
              <th scope="row" className="py-2 pe-2 text-right font-medium">{m.label}</th>
              {rations.map((r) => (
                <td key={r.id} className={cn('px-2 py-2 text-center tabular-nums', r.id === selectedId && 'bg-primary/5 font-semibold')}>
                  {m.render(r)}
                </td>
              ))}
            </tr>
          ))}
          <tr>
            <th colSpan={rations.length + 1} scope="colgroup" className="pt-4 pb-1 text-right text-xs font-medium text-muted-foreground">
              مقدار نهاده‌ها (kg تر / رأس)
            </th>
          </tr>
          {feedIds.map((id) => (
            <tr key={id} className="border-b last:border-b-0">
              <th scope="row" className="py-2 pe-2 text-right font-normal">{feedMap.get(id)}</th>
              {rations.map((r) => {
                const v = kg(r, id)
                return (
                  <td
                    key={r.id}
                    className={cn(
                      'px-2 py-2 text-center tabular-nums',
                      r.id === selectedId && 'bg-primary/5',
                      v === 0 && 'text-muted-foreground/50',
                    )}
                  >
                    {v === 0 ? '—' : nf(v, 3)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
