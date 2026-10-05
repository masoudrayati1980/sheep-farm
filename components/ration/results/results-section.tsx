'use client'

import { TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { toman } from '@/lib/format'
import type { Outcome, Ration, Requirements } from '@/lib/ration/types'
import { cn } from '@/lib/utils'
import { ComparisonTable } from './comparison-table'
import { ConstraintTable } from './constraint-status'
import { InfeasiblePanel } from './infeasible-panel'
import { RationTable } from './ration-table'
import { SummaryGrid } from './summary-grid'

function Panel({ title, hint, children, className }: { title: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-xs', className)}>
      <header className="flex flex-col gap-1">
        <h3 className="font-semibold">{title}</h3>
        {hint && <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>}
      </header>
      {children}
    </section>
  )
}

export function ResultsSection({ outcome, req }: { outcome: Outcome; req: Requirements }) {
  if (outcome.status === 'invalid') {
    return (
      <div role="alert" className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-5">
        <TriangleAlert className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />
        <div className="flex flex-col gap-2">
          <p className="font-semibold">ورودی‌ها قبل از محاسبه نیاز به اصلاح دارند</p>
          <ul className="flex list-disc flex-col gap-1 ps-5 text-sm leading-relaxed text-muted-foreground">
            {outcome.errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      </div>
    )
  }
  if (outcome.status === 'infeasible') return <InfeasiblePanel diagnosis={outcome.diagnosis} />
  return <RationResults rations={outcome.rations} req={req} />
}

function RationResults({ rations, req }: { rations: Ration[]; req: Requirements }) {
  const [selectedId, setSelectedId] = useState('best')
  const selected = rations.find((r) => r.id === selectedId) ?? rations[0]
  const bestCost = rations[0].totals.costPerHead

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="جیره‌های پیشنهادی" className="grid gap-3 sm:grid-cols-3">
        {rations.map((r) => {
          const delta = r.totals.costPerHead - bestCost
          const active = r.id === selected.id
          return (
            <button
              key={r.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSelectedId(r.id)}
              className={cn(
                'flex flex-col items-start gap-1 rounded-xl border p-4 text-right transition-colors',
                active ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'bg-card hover:border-primary/40',
              )}
            >
              <span className="flex w-full items-center justify-between gap-2">
                <span className="font-semibold">{r.title}</span>
                {r.id === 'best' && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
                    کمترین هزینه
                  </span>
                )}
              </span>
              <span className="text-xs text-muted-foreground">{r.note}</span>
              <span className="mt-1 text-lg font-bold tabular-nums">
                {toman(r.totals.costPerHead)} <span className="text-xs font-normal text-muted-foreground">تومان/رأس</span>
              </span>
              {r.id !== 'best' && (
                <span className="text-xs tabular-nums text-muted-foreground">
                  {`${toman(delta)}+ تومان (${((delta / bestCost) * 100).toLocaleString('fa-IR', { maximumFractionDigits: 1 })}٪ گران‌تر)`}
                </span>
              )}
            </button>
          )
        })}
      </div>
      {rations.length < 3 && (
        <p className="text-xs text-muted-foreground">
          جیره جایگزین دیگری که همه قیود را رعایت کند و به‌طور معنی‌دار با جیره اقتصادی متفاوت باشد پیدا نشد.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <Panel
          title={`${selected.title} — ${req.animal}`}
          hint={
            req.mode === 'group'
              ? `${req.headCount.toLocaleString('fa-IR')} رأس، میانگین وزن ${req.bodyWeight.toLocaleString('fa-IR')} کیلوگرم. مقادیر تر برای استفاده مستقیم در دامداری است.`
              : `یک رأس، وزن ${req.bodyWeight.toLocaleString('fa-IR')} کیلوگرم. مقادیر تر برای استفاده مستقیم در دامداری است.`
          }
        >
          <RationTable ration={selected} req={req} />
        </Panel>
        <Panel title="خلاصه جیره" hint="به ازای هر رأس در روز، مگر خلاف آن ذکر شده باشد.">
          <SummaryGrid ration={selected} req={req} />
        </Panel>
      </div>

      <Panel
        title="وضعیت قیود"
        hint="هر شاخص در کنار حداقل و حداکثر تعیین‌شده. «روی حد» یعنی آن قید محدودکننده هزینه است و تغییرش می‌تواند جیره را ارزان‌تر کند."
      >
        <ConstraintTable checks={selected.checks} caption="وضعیت قیود تغذیه‌ای" />
        {selected.feedChecks.length > 0 && (
          <details className="group rounded-lg border bg-muted/30 p-3">
            <summary className="cursor-pointer text-sm font-medium">
              {`محدودیت نهاده‌ها (${selected.feedChecks.length.toLocaleString('fa-IR')} قید)`}
            </summary>
            <div className="mt-3">
              <ConstraintTable checks={selected.feedChecks} caption="وضعیت محدودیت نهاده‌ها" />
            </div>
          </details>
        )}
      </Panel>

      {rations.length > 1 && (
        <Panel title="مقایسه جیره‌ها" hint="همه جیره‌ها تمام قیود اصلی را رعایت می‌کنند.">
          <ComparisonTable rations={rations} selectedId={selected.id} />
        </Panel>
      )}
    </div>
  )
}
