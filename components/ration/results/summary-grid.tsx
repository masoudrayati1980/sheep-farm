import { nf, toman } from '@/lib/format'
import type { Ration, Requirements } from '@/lib/ration/types'

function Stat({ label, value, unit, sub }: { label: string; value: string; unit: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-muted/60 p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="flex flex-col">
        <span className="text-lg font-semibold tabular-nums">
          {value} <span className="text-xs font-normal text-muted-foreground">{unit}</span>
        </span>
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      </dd>
    </div>
  )
}

export function SummaryGrid({ ration, req }: { ration: Ration; req: Requirements }) {
  const t = ration.totals
  const group = req.mode === 'group'
  const heads = group ? req.headCount : 1

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl bg-primary p-4 text-primary-foreground">
        <p className="text-sm opacity-85">{group ? `هزینه روزانه گروه (${heads.toLocaleString('fa-IR')} رأس)` : 'هزینه روزانه'}</p>
        <p className="mt-1 text-3xl font-bold tabular-nums">
          {toman(t.costPerHead * heads)} <span className="text-base font-normal opacity-85">تومان</span>
        </p>
        <dl className="mt-3 flex flex-col gap-1 border-t border-primary-foreground/20 pt-3 text-sm">
          <div className="flex justify-between gap-2">
            <dt className="opacity-85">هزینه به ازای هر دام</dt>
            <dd className="font-semibold tabular-nums">{`${toman(t.costPerHead)} تومان`}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="opacity-85">هزینه هر کیلوگرم ماده خشک</dt>
            <dd className="font-semibold tabular-nums">{`${toman(t.costPerKgDM)} تومان`}</dd>
          </div>
        </dl>
      </div>
      <dl className="grid grid-cols-2 gap-2">
        <Stat label="ماده خشک کل" value={nf(t.dm, 2)} unit="kg/روز" sub={`وزن تر: ${nf(t.asFed, 2)} kg`} />
        <Stat label="پروتئین" value={nf(t.cp, 0)} unit="g/روز" sub={`${nf(t.cpPct, 1)}٪ ماده خشک`} />
        <Stat label="انرژی" value={nf(t.energy, 2)} unit="Mcal/روز" sub={`${nf(t.energyDensity, 2)} Mcal/kg DM`} />
        <Stat label="علوفه / کنسانتره" value={`${nf(t.foragePct, 0)} / ${nf(t.concPct, 0)}`} unit="٪" sub="بر پایه ماده خشک" />
        {group && (
          <>
            <Stat label="ماده خشک کل گروه" value={nf(t.dm * heads, 1)} unit="kg/روز" />
            <Stat label="خوراک تر کل گروه" value={nf(t.asFed * heads, 1)} unit="kg/روز" />
          </>
        )}
      </dl>
    </div>
  )
}
