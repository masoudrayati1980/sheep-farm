'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Feed, FeedType } from '@/lib/ration/types'
import { cn } from '@/lib/utils'
import { NumField } from './num-field'

interface Props {
  feeds: Feed[]
  onUpdate: (id: string, patch: Partial<Feed>) => void
  onAdd: () => void
  onRemove: (id: string) => void
}

const headers: { label: string; unit?: string }[] = [
  { label: 'فعال' },
  { label: 'کد' },
  { label: 'نام نهاده' },
  { label: 'نوع' },
  { label: 'ماده خشک', unit: '%' },
  { label: 'انرژی', unit: 'Mcal ME/kg DM' },
  { label: 'پروتئین خام', unit: '% DM' },
  { label: 'قیمت', unit: 'تومان/kg تر' },
  { label: 'حداقل مصرف', unit: 'kg DM/رأس' },
  { label: 'حداکثر مصرف', unit: 'kg DM/رأس' },
  { label: 'حداقل سهم', unit: '% DM جیره' },
  { label: 'حداکثر سهم', unit: '% DM جیره' },
]

const textInput =
  'h-9 w-full min-w-0 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30'

export function FeedTable({ feeds, onUpdate, onAdd, onRemove }: Props) {
  const activeCount = feeds.filter((f) => f.active).length
  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-xl border bg-card shadow-xs">
        <table className="w-full min-w-[1180px] border-collapse text-sm">
          <caption className="sr-only">فهرست نهاده‌ها و محدودیت‌های مصرف</caption>
          <thead>
            <tr className="border-b bg-muted/60 text-right">
              {headers.map((h) => (
                <th key={h.label} scope="col" className="px-2 py-2.5 align-bottom font-medium">
                  <span className="block whitespace-nowrap">{h.label}</span>
                  {h.unit && (
                    <span className="block whitespace-nowrap text-xs font-normal text-muted-foreground">{h.unit}</span>
                  )}
                </th>
              ))}
              <th scope="col" className="px-2 py-2.5">
                <span className="sr-only">حذف</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {feeds.map((f) => (
              <tr
                key={f.id}
                className={cn('border-b last:border-b-0 transition-opacity', !f.active && 'bg-muted/30 opacity-55')}
              >
                <td className="px-2 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={f.active}
                    onChange={(e) => onUpdate(f.id, { active: e.target.checked })}
                    aria-label={`فعال بودن ${f.name}`}
                    className="size-4 accent-primary"
                  />
                </td>
                <td className="w-20 px-1 py-2">
                  <input
                    type="text"
                    dir="ltr"
                    value={f.code}
                    onChange={(e) => onUpdate(f.id, { code: e.target.value })}
                    aria-label="کد نهاده"
                    className={cn(textInput, 'text-center font-mono text-xs')}
                  />
                </td>
                <td className="w-36 px-1 py-2">
                  <input
                    type="text"
                    value={f.name}
                    onChange={(e) => onUpdate(f.id, { name: e.target.value })}
                    aria-label="نام نهاده"
                    className={textInput}
                  />
                </td>
                <td className="w-28 px-1 py-2">
                  <select
                    value={f.type}
                    onChange={(e) => onUpdate(f.id, { type: e.target.value as FeedType })}
                    aria-label={`نوع ${f.name}`}
                    className={cn(textInput, 'cursor-pointer')}
                  >
                    <option value="forage">علوفه</option>
                    <option value="concentrate">کنسانتره</option>
                  </select>
                </td>
                <NumCell label={`ماده خشک ${f.name}`} value={f.dm} onChange={(v) => onUpdate(f.id, { dm: v ?? 0 })} />
                <NumCell label={`انرژی ${f.name}`} value={f.energy} onChange={(v) => onUpdate(f.id, { energy: v ?? 0 })} />
                <NumCell label={`پروتئین ${f.name}`} value={f.cp} onChange={(v) => onUpdate(f.id, { cp: v ?? 0 })} />
                <NumCell
                  label={`قیمت ${f.name}`}
                  value={f.price}
                  wide
                  onChange={(v) => onUpdate(f.id, { price: v ?? 0 })}
                />
                <NumCell optional label={`حداقل مصرف ${f.name}`} value={f.minKg} onChange={(v) => onUpdate(f.id, { minKg: v })} />
                <NumCell optional label={`حداکثر مصرف ${f.name}`} value={f.maxKg} onChange={(v) => onUpdate(f.id, { maxKg: v })} />
                <NumCell optional label={`حداقل سهم ${f.name}`} value={f.minPct} onChange={(v) => onUpdate(f.id, { minPct: v })} />
                <NumCell optional label={`حداکثر سهم ${f.name}`} value={f.maxPct} onChange={(v) => onUpdate(f.id, { maxPct: v })} />
                <td className="px-1 py-2 text-center">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onRemove(f.id)}
                    aria-label={`حذف ${f.name}`}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {`${feeds.length.toLocaleString('fa-IR')} نهاده، ${activeCount.toLocaleString('fa-IR')} فعال. خانه‌های محدودیت را برای «بدون محدودیت» خالی بگذارید.`}
        </p>
        <Button variant="outline" onClick={onAdd}>
          <Plus />
          افزودن نهاده
        </Button>
      </div>
    </div>
  )
}

function NumCell({
  label,
  value,
  onChange,
  optional,
  wide,
}: {
  label: string
  value: number | null
  onChange: (v: number | null) => void
  optional?: boolean
  wide?: boolean
}) {
  return (
    <td className={cn('px-1 py-2', wide ? 'w-28' : 'w-20')}>
      <NumField label={label} value={value} onChange={onChange} optional={optional} />
    </td>
  )
}
