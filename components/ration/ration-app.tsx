'use client'

import { CircleCheck, OctagonX, RotateCcw, TriangleAlert, Wheat } from 'lucide-react'
import { useDeferredValue, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { toman } from '@/lib/format'
import { DEFAULT_FEEDS, DEFAULT_REQUIREMENTS } from '@/lib/ration/defaults'
import { formulate } from '@/lib/ration/engine'
import type { Feed, Outcome, Requirements } from '@/lib/ration/types'
import { cn } from '@/lib/utils'
import { FeedTable } from './feed-table'
import { RequirementsPanel } from './requirements-panel'
import { ResultsSection } from './results/results-section'

function StatusPill({ outcome }: { outcome: Outcome }) {
  const map = {
    ok: { icon: CircleCheck, cls: 'bg-success/12 text-success', text: '' },
    infeasible: { icon: OctagonX, cls: 'bg-destructive/10 text-destructive', text: 'جیره امکان‌پذیر نیست' },
    invalid: { icon: TriangleAlert, cls: 'bg-warning/15 text-accent-foreground', text: 'ورودی نیاز به اصلاح دارد' },
  }[outcome.status]
  const Icon = map.icon
  const text =
    outcome.status === 'ok' ? `جیره اقتصادی: ${toman(outcome.rations[0].totals.costPerHead)} تومان/رأس` : map.text
  return (
    <a
      href="#results"
      aria-live="polite"
      className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium sm:text-sm', map.cls)}
    >
      <Icon className="size-4" aria-hidden="true" />
      {text}
    </a>
  )
}

function SectionHeading({ step, title, hint }: { step: string; title: string; hint: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
        {step}
      </span>
      <div className="flex flex-col gap-0.5">
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground">{hint}</p>
      </div>
    </div>
  )
}

export function RationApp() {
  const [feeds, setFeeds] = useState<Feed[]>(DEFAULT_FEEDS)
  const [req, setReq] = useState<Requirements>(DEFAULT_REQUIREMENTS)
  const [resetKey, setResetKey] = useState(0)

  const deferredFeeds = useDeferredValue(feeds)
  const deferredReq = useDeferredValue(req)
  const outcome = useMemo(() => formulate(deferredFeeds, deferredReq), [deferredFeeds, deferredReq])

  const updateFeed = (id: string, patch: Partial<Feed>) =>
    setFeeds((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)))
  const addFeed = () =>
    setFeeds((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        code: `N${(prev.length + 1).toString().padStart(2, '0')}`,
        name: 'نهاده جدید',
        type: 'concentrate',
        dm: 90,
        energy: 2.5,
        cp: 12,
        price: 20000,
        minKg: null,
        maxKg: null,
        minPct: null,
        maxPct: null,
        active: true,
      },
    ])
  const removeFeed = (id: string) => setFeeds((prev) => prev.filter((f) => f.id !== id))
  const reset = () => {
    setFeeds(DEFAULT_FEEDS)
    setReq(DEFAULT_REQUIREMENTS)
    setResetKey((k) => k + 1)
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Wheat className="size-5" aria-hidden="true" />
            </span>
            <div className="flex flex-col">
              <h1 className="font-bold leading-tight">جیره‌نویسی گوسفند طراحی و توسعه توسط مسعود رعیتی
شماره تماس: 09125244073 </h1>
              <p className="text-xs text-muted-foreground">اقتصادی‌ترین جیره عملی بر پایه ماده خشک</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill outcome={outcome} />
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw />
              بازنشانی
            </Button>
          </div>
        </div>
      </header>

      <main key={resetKey} className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-8 sm:px-6">
        <section className="flex flex-col gap-4">
          <SectionHeading step="۱" title="دام و نیاز غذایی" hint="مشخصات دام، محدوده نیازهای روزانه و نسبت علوفه به کنسانتره." />
          <RequirementsPanel req={req} onChange={(patch) => setReq((prev) => ({ ...prev, ...patch }))} />
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeading
            step="۲"
            title="نهاده‌ها و محدودیت مصرف"
            hint="ترکیب، قیمت و محدودیت هر نهاده. محدودیت‌ها می‌توانند بر حسب kg DM یا درصد DM جیره باشند."
          />
          <FeedTable feeds={feeds} onUpdate={updateFeed} onAdd={addFeed} onRemove={removeFeed} />
        </section>

        <section id="results" className="flex scroll-mt-24 flex-col gap-4">
          <SectionHeading
            step="۳"
            title="جیره پیشنهادی"
            hint="با هر تغییر در ورودی‌ها، جیره با برنامه‌ریزی خطی دوباره بهینه می‌شود."
          />
          <ResultsSection outcome={outcome} req={deferredReq} />
        </section>
      </main>
    </div>
  )
}
