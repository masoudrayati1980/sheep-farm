import { Lightbulb, OctagonX } from 'lucide-react'
import { nf } from '@/lib/format'
import type { Achievable, Diagnosis, DiagnosisCause } from '@/lib/ration/types'

function RangeCompare({ achievable, required, unit }: { achievable: Achievable; required: { min: number; max: number }; unit: string }) {
  const finiteMax = Number.isFinite(achievable.max) ? achievable.max : Math.max(required.max, achievable.min) * 1.5
  const lo = Math.min(achievable.min, required.min)
  const hi = Math.max(finiteMax, required.max)
  const pad = (hi - lo) * 0.08 || 1
  const scaleLo = Math.max(0, lo - pad)
  const scaleHi = hi + pad
  const pos = (v: number) => ((v - scaleLo) / (scaleHi - scaleLo)) * 100
  const digits = unit.startsWith('g') ? 0 : unit.includes('٪') ? 1 : 2

  const rows = [
    { label: 'قابل دستیابی', min: achievable.min, max: finiteMax, display: achievable.max, cls: 'bg-muted-foreground/40' },
    { label: 'تعیین‌شده', min: required.min, max: required.max, display: required.max, cls: 'bg-destructive/70' },
  ]

  return (
    <div className="flex flex-col gap-2.5 rounded-lg bg-muted/60 p-3" aria-hidden="true">
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-[6rem_1fr_9rem] items-center gap-3 text-xs">
          <span className="text-muted-foreground">{r.label}</span>
          <div className="relative h-2.5 rounded-full bg-card">
            <div
              className={`absolute inset-y-0 rounded-full ${r.cls}`}
              style={{ insetInlineStart: `${pos(r.min)}%`, width: `${Math.max(pos(r.max) - pos(r.min), 1)}%` }}
            />
          </div>
          <span className="tabular-nums" dir="ltr">
            {`${nf(r.min, digits)} – ${nf(r.display, digits)} ${unit}`}
          </span>
        </div>
      ))}
    </div>
  )
}

function CauseCard({ cause, index }: { cause: DiagnosisCause; index: number }) {
  return (
    <li className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-xs font-bold text-destructive">
          {(index + 1).toLocaleString('fa-IR')}
        </span>
        <div className="flex flex-col gap-1">
          <h4 className="font-semibold">{cause.title}</h4>
          <p className="text-sm leading-relaxed text-muted-foreground">{cause.message}</p>
        </div>
      </div>
      {cause.achievable && cause.required && cause.unit && (
        <RangeCompare achievable={cause.achievable} required={cause.required} unit={cause.unit} />
      )}
      <p className="flex items-start gap-2 text-sm leading-relaxed">
        <Lightbulb className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
        <span>{cause.suggestion}</span>
      </p>
    </li>
  )
}

export function InfeasiblePanel({ diagnosis }: { diagnosis: Diagnosis }) {
  return (
    <div className="flex flex-col gap-5">
      <div role="alert" className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-5">
        <OctagonX className="mt-0.5 size-6 shrink-0 text-destructive" aria-hidden="true" />
        <div className="flex flex-col gap-1">
          <p className="font-semibold text-destructive">جیره‌ای که تمام محدودیت‌های تعیین‌شده را رعایت کند پیدا نشد.</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            برای جلوگیری از ارائه جیره نادرست، هیچ جیره‌ای پیشنهاد نمی‌شود. علت‌های احتمالی با بررسی جداگانه هر گروه از
            قیود شناسایی شده‌اند.
          </p>
        </div>
      </div>

      {diagnosis.causes.length > 0 && (
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">
            علت‌های احتمالی — برطرف کردن هر یک از موارد زیر به تنهایی جیره را امکان‌پذیر می‌کند:
          </h3>
          <ol className="grid gap-3 lg:grid-cols-2">
            {diagnosis.causes.map((c, i) => (
              <CauseCard key={c.group} cause={c} index={i} />
            ))}
          </ol>
        </section>
      )}

      {diagnosis.pairHints.length > 0 && (
        <section className="flex flex-col gap-2 rounded-xl border bg-card p-4">
          <h3 className="text-sm font-semibold">هیچ قیدی به تنهایی مقصر نیست</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            جیره فقط زمانی امکان‌پذیر می‌شود که هم‌زمان دو گروه از قیود بازبینی شوند. ترکیب‌های مؤثر:
          </p>
          <ul className="flex flex-wrap gap-2">
            {diagnosis.pairHints.map((h) => (
              <li key={h} className="rounded-full bg-accent/60 px-3 py-1 text-xs text-accent-foreground">
                {h}
              </li>
            ))}
          </ul>
        </section>
      )}

      {diagnosis.general && (
        <p className="rounded-xl border bg-card p-4 text-sm leading-relaxed text-muted-foreground">{diagnosis.general}</p>
      )}
    </div>
  )
}
