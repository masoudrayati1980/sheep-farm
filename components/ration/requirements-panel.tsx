'use client'

import type { Requirements } from '@/lib/ration/types'
import { cn } from '@/lib/utils'
import { NumField } from './num-field'

interface Props {
  req: Requirements
  onChange: (patch: Partial<Requirements>) => void
}

export function RequirementsPanel({ req, onChange }: Props) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <AnimalCard req={req} onChange={onChange} />
      <NutrientCard req={req} onChange={onChange} />
      <RatioCard req={req} onChange={onChange} />
    </div>
  )
}

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-xs">
      <header className="flex flex-col gap-1">
        <h3 className="font-semibold">{title}</h3>
        {hint && <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>}
      </header>
      {children}
    </section>
  )
}

function AnimalCard({ req, onChange }: Props) {
  return (
    <Card title="مشخصات دام" hint="جیره همیشه برای هر رأس محاسبه می‌شود؛ در حالت گروهی مقدار کل گله هم نمایش داده می‌شود.">
      <div role="radiogroup" aria-label="نوع جیره" className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
        {(
          [
            ['single', 'جیره یک دام'],
            ['group', 'جیره گروهی'],
          ] as const
        ).map(([mode, label]) => (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={req.mode === mode}
            onClick={() => onChange({ mode })}
            className={cn(
              'h-9 rounded-md text-sm font-medium transition-colors',
              req.mode === mode ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted-foreground">گروه / نوع دام</span>
        <input
          type="text"
          value={req.animal}
          onChange={(e) => onChange({ animal: e.target.value })}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted-foreground">میانگین وزن (kg)</span>
          <NumField label="میانگین وزن" value={req.bodyWeight} onChange={(v) => onChange({ bodyWeight: v ?? 0 })} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className={cn('text-muted-foreground', req.mode === 'single' && 'opacity-50')}>تعداد دام (رأس)</span>
          {req.mode === 'group' ? (
            <NumField label="تعداد دام" value={req.headCount} onChange={(v) => onChange({ headCount: v ?? 1 })} />
          ) : (
            <div className="flex h-9 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
              ۱
            </div>
          )}
        </label>
      </div>
    </Card>
  )
}

function RangeRow({
  label,
  unit,
  min,
  max,
  onMin,
  onMax,
}: {
  label: string
  unit: string
  min: number
  max: number
  onMin: (v: number) => void
  onMax: (v: number) => void
}) {
  return (
    <div className="grid grid-cols-[1fr_5rem_5rem] items-center gap-2">
      <div className="flex flex-col">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground" dir="ltr">
          {unit}
        </span>
      </div>
      <NumField label={`حداقل ${label}`} value={min} onChange={(v) => onMin(v ?? 0)} />
      <NumField label={`حداکثر ${label}`} value={max} onChange={(v) => onMax(v ?? 0)} />
    </div>
  )
}

function ColumnHeads() {
  return (
    <div className="grid grid-cols-[1fr_5rem_5rem] gap-2 text-xs text-muted-foreground">
      <span>شاخص</span>
      <span className="text-center">حداقل</span>
      <span className="text-center">حداکثر</span>
    </div>
  )
}

function NutrientCard({ req, onChange }: Props) {
  return (
    <Card title="نیاز غذایی روزانه هر رأس" hint="انرژی بر حسب انرژی قابل متابولیسم (ME) است.">
      <div className="flex flex-col gap-3">
        <ColumnHeads />
        <RangeRow
          label="ماده خشک"
          unit="kg DM/day"
          min={req.dmMin}
          max={req.dmMax}
          onMin={(dmMin) => onChange({ dmMin })}
          onMax={(dmMax) => onChange({ dmMax })}
        />
        <RangeRow
          label="انرژی"
          unit="Mcal ME/day"
          min={req.energyMin}
          max={req.energyMax}
          onMin={(energyMin) => onChange({ energyMin })}
          onMax={(energyMax) => onChange({ energyMax })}
        />
        <RangeRow
          label="پروتئین خام"
          unit="g CP/day"
          min={req.cpMin}
          max={req.cpMax}
          onMin={(cpMin) => onChange({ cpMin })}
          onMax={(cpMax) => onChange({ cpMax })}
        />
      </div>
    </Card>
  )
}

function RatioCard({ req, onChange }: Props) {
  const lo = Math.max(0, Math.max(req.forageMin, 100 - req.concMax))
  const hi = Math.min(100, Math.min(req.forageMax, 100 - req.concMin))
  const valid = hi >= lo
  return (
    <Card title="نسبت علوفه و کنسانتره" hint="درصدها بر اساس ماده خشک جیره محاسبه می‌شوند، نه وزن تر.">
      <div className="flex flex-col gap-3">
        <ColumnHeads />
        <RangeRow
          label="علوفه"
          unit="% DM"
          min={req.forageMin}
          max={req.forageMax}
          onMin={(forageMin) => onChange({ forageMin })}
          onMax={(forageMax) => onChange({ forageMax })}
        />
        <RangeRow
          label="کنسانتره"
          unit="% DM"
          min={req.concMin}
          max={req.concMax}
          onMin={(concMin) => onChange({ concMin })}
          onMax={(concMax) => onChange({ concMax })}
        />
      </div>
      <div className="flex flex-col gap-2">
        <div className="relative h-3 overflow-hidden rounded-full bg-accent/60" aria-hidden="true">
          {valid && (
            <div
              className="absolute inset-y-0 rounded-full bg-primary"
              style={{ insetInlineStart: `${lo}%`, width: `${hi - lo}%` }}
            />
          )}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>علوفه ۰٪</span>
          <span className="font-medium text-foreground">
            {valid
              ? `محدوده مجاز علوفه: ${lo.toLocaleString('fa-IR')}٪ تا ${hi.toLocaleString('fa-IR')}٪`
              : 'محدوده‌ها با هم تناقض دارند'}
          </span>
          <span>۱۰۰٪</span>
        </div>
      </div>
    </Card>
  )
}
