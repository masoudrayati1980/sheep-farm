import solver, { type Model, type SolveResult } from 'javascript-lp-solver'
import { nf } from '@/lib/format'
import type {
  Achievable,
  ConstraintCheck,
  ConstraintGroup,
  Diagnosis,
  DiagnosisCause,
  Feed,
  Outcome,
  Ration,
  RationItem,
  Requirements,
} from './types'

type Metric = 'dm' | 'energy' | 'protein'
type Objective = { kind: 'cost' } | { kind: 'metric'; metric: Metric; dir: 'min' | 'max' }

interface BuildOptions {
  skip?: ConstraintGroup[]
  relaxFeedId?: string
  excluded?: Set<string>
  caps?: Record<string, number>
  objective?: Objective
  forageBounds?: { min?: number; max?: number }
}

type Solution = { x: Record<string, number>; unbounded: false } | { x: null; unbounded: true }

const ZERO = 1e-7
const GROUP_LABELS: Record<ConstraintGroup, string> = {
  dm: 'ماده خشک روزانه',
  energy: 'انرژی',
  protein: 'پروتئین',
  ratio: 'نسبت علوفه / کنسانتره',
  feedLimits: 'محدودیت نهاده‌ها',
}
const ALL_GROUPS: ConstraintGroup[] = ['dm', 'energy', 'protein', 'ratio', 'feedLimits']

const varName = (id: string) => `f_${id}`
const costPerKgDM = (f: Feed) => f.price / (f.dm / 100)
const metricCoef = (f: Feed, m: Metric) => (m === 'dm' ? 1 : m === 'energy' ? f.energy : f.cp * 10)
const isForage = (f: Feed) => (f.type === 'forage' ? 1 : 0)
const isConc = (f: Feed) => (f.type === 'concentrate' ? 1 : 0)

function buildModel(feeds: Feed[], req: Requirements, opts: BuildOptions = {}): Model {
  const skip = new Set(opts.skip ?? [])
  const usable = feeds.filter((f) => f.active && !opts.excluded?.has(f.id))
  const objective = opts.objective ?? { kind: 'cost' }
  const constraints: Record<string, { min?: number; max?: number }> = {}
  const variables: Record<string, Record<string, number>> = {}

  for (const f of usable) {
    const v: Record<string, number> = {}
    v.obj = objective.kind === 'cost' ? costPerKgDM(f) : metricCoef(f, objective.metric)
    v.total = 1
    variables[varName(f.id)] = v
  }
  constraints.total = { min: 0 }

  const addLinear = (key: string, bound: { min?: number; max?: number }, coef: (f: Feed) => number) => {
    constraints[key] = bound
    for (const f of usable) variables[varName(f.id)][key] = coef(f)
  }

  if (!skip.has('dm')) addLinear('dm', { min: req.dmMin, max: req.dmMax }, () => 1)
  if (!skip.has('energy')) addLinear('energy', { min: req.energyMin, max: req.energyMax }, (f) => f.energy)
  if (!skip.has('protein')) addLinear('protein', { min: req.cpMin, max: req.cpMax }, (f) => f.cp * 10)

  if (!skip.has('ratio')) {
    addLinear('forageMin', { min: 0 }, (f) => isForage(f) - req.forageMin / 100)
    addLinear('forageMax', { max: 0 }, (f) => isForage(f) - req.forageMax / 100)
    addLinear('concMin', { min: 0 }, (f) => isConc(f) - req.concMin / 100)
    addLinear('concMax', { max: 0 }, (f) => isConc(f) - req.concMax / 100)
  }
  if (opts.forageBounds?.min != null) {
    const p = opts.forageBounds.min / 100
    addLinear('fbMin', { min: 0 }, (f) => isForage(f) - p)
  }
  if (opts.forageBounds?.max != null) {
    const p = opts.forageBounds.max / 100
    addLinear('fbMax', { max: 0 }, (f) => isForage(f) - p)
  }

  if (!skip.has('feedLimits')) {
    for (const g of usable) {
      if (g.id === opts.relaxFeedId) continue
      if (g.minKg != null || g.maxKg != null) {
        const bound: { min?: number; max?: number } = {}
        if (g.minKg != null) bound.min = g.minKg
        if (g.maxKg != null) bound.max = g.maxKg
        addLinear(`kg_${g.id}`, bound, (f) => (f.id === g.id ? 1 : 0))
      }
      if (g.minPct != null) {
        const p = g.minPct / 100
        addLinear(`pmin_${g.id}`, { min: 0 }, (f) => (f.id === g.id ? 1 : 0) - p)
      }
      if (g.maxPct != null) {
        const p = g.maxPct / 100
        addLinear(`pmax_${g.id}`, { max: 0 }, (f) => (f.id === g.id ? 1 : 0) - p)
      }
    }
  }

  for (const [id, cap] of Object.entries(opts.caps ?? {})) {
    if (!variables[varName(id)]) continue
    addLinear(`cap_${id}`, { max: cap }, (f) => (f.id === id ? 1 : 0))
  }

  return {
    optimize: 'obj',
    opType: objective.kind === 'metric' ? objective.dir : 'min',
    constraints,
    variables,
  } as Model
}

function solve(feeds: Feed[], req: Requirements, opts: BuildOptions = {}): Solution | null {
  const usable = feeds.filter((f) => f.active && !opts.excluded?.has(f.id))
  if (usable.length === 0) return null
  const result = solver.Solve(buildModel(feeds, req, opts)) as SolveResult & Record<string, number | undefined>
  if (!result.feasible) return null
  if (result.bounded === false) return { x: null, unbounded: true }
  const x: Record<string, number> = {}
  for (const f of usable) {
    const v = result[varName(f.id)]
    x[f.id] = typeof v === 'number' && v > ZERO ? v : 0
  }
  return { x, unbounded: false }
}

function isFeasible(feeds: Feed[], req: Requirements, opts: BuildOptions = {}) {
  return solve(feeds, req, { ...opts, objective: { kind: 'metric', metric: 'dm', dir: 'min' } }) !== null
}

function makeCheck(
  key: string,
  label: string,
  unit: string,
  min: number | null,
  max: number | null,
  value: number,
  digits: number,
): ConstraintCheck {
  const tol = (ref: number) => 1e-5 * Math.max(1, Math.abs(ref))
  const okMin = min == null || value >= min - tol(min)
  const okMax = max == null || value <= max + tol(max)
  const bindTol = (ref: number) => Math.max(1e-4 * Math.max(1, Math.abs(ref)), 0.5 * 10 ** -digits)
  let binding: 'min' | 'max' | null = null
  if (min != null && Math.abs(value - min) <= bindTol(min)) binding = 'min'
  else if (max != null && Math.abs(value - max) <= bindTol(max)) binding = 'max'
  return { key, label, unit, min, max, value, ok: okMin && okMax, binding, digits }
}

export function evaluateRation(
  x: Record<string, number>,
  feeds: Feed[],
  req: Requirements,
  meta: { id: string; title: string; note: string },
): Ration {
  const active = feeds.filter((f) => f.active)
  const dm = active.reduce((s, f) => s + (x[f.id] ?? 0), 0)
  const allItems: RationItem[] = active
    .filter((f) => (x[f.id] ?? 0) > 0)
    .map((f) => {
      const kgDM = x[f.id]
      const kgAsFed = kgDM / (f.dm / 100)
      return { feed: f, kgDM, kgAsFed, pctDM: dm > 0 ? (kgDM / dm) * 100 : 0, cost: kgAsFed * f.price }
    })
    .sort((a, b) => b.kgDM - a.kgDM)
  const items = allItems.filter((i) => i.kgDM >= 5e-4)

  const energy = allItems.reduce((s, i) => s + i.kgDM * i.feed.energy, 0)
  const cp = allItems.reduce((s, i) => s + i.kgDM * i.feed.cp * 10, 0)
  const forage = allItems.filter((i) => i.feed.type === 'forage').reduce((s, i) => s + i.kgDM, 0)
  const cost = allItems.reduce((s, i) => s + i.cost, 0)
  const asFed = allItems.reduce((s, i) => s + i.kgAsFed, 0)
  const foragePct = dm > 0 ? (forage / dm) * 100 : 0
  const concPct = dm > 0 ? 100 - foragePct : 0

  const checks: ConstraintCheck[] = [
    makeCheck('dm', 'ماده خشک', 'kg/روز', req.dmMin, req.dmMax, dm, 2),
    makeCheck('energy', 'انرژی (ME)', 'Mcal/روز', req.energyMin, req.energyMax, energy, 2),
    makeCheck('protein', 'پروتئین خام', 'g/روز', req.cpMin, req.cpMax, cp, 0),
    makeCheck('forage', 'علوفه', '٪ DM', req.forageMin, req.forageMax, foragePct, 1),
    makeCheck('conc', 'کنسانتره', '٪ DM', req.concMin, req.concMax, concPct, 1),
  ]

  const feedChecks: ConstraintCheck[] = []
  for (const f of active) {
    const kg = x[f.id] ?? 0
    const pct = dm > 0 ? (kg / dm) * 100 : 0
    if (f.minKg != null || f.maxKg != null) {
      feedChecks.push(makeCheck(`kg_${f.id}`, f.name, 'kg DM/روز', f.minKg, f.maxKg, kg, 3))
    }
    if (f.minPct != null || f.maxPct != null) {
      feedChecks.push(makeCheck(`pct_${f.id}`, f.name, '٪ DM', f.minPct, f.maxPct, pct, 1))
    }
  }

  const valid = [...checks, ...feedChecks].every((c) => c.ok)

  return {
    ...meta,
    items,
    totals: {
      dm,
      asFed,
      energy,
      cp,
      energyDensity: dm > 0 ? energy / dm : 0,
      cpPct: dm > 0 ? cp / (dm * 10) : 0,
      foragePct,
      concPct,
      costPerHead: cost,
      costPerKgDM: dm > 0 ? cost / dm : 0,
    },
    checks,
    feedChecks,
    valid,
  }
}

export function validateInputs(feeds: Feed[], req: Requirements): string[] {
  const errors: string[] = []
  const active = feeds.filter((f) => f.active)
  const pairs: [string, number, number][] = [
    ['ماده خشک روزانه', req.dmMin, req.dmMax],
    ['انرژی', req.energyMin, req.energyMax],
    ['پروتئین', req.cpMin, req.cpMax],
    ['درصد علوفه', req.forageMin, req.forageMax],
    ['درصد کنسانتره', req.concMin, req.concMax],
  ]
  for (const [label, min, max] of pairs) {
    if (min < 0 || max < 0) errors.push(`مقادیر «${label}» نمی‌تواند منفی باشد.`)
    if (min > max) errors.push(`حداقل «${label}» (${nf(min)}) از حداکثر آن (${nf(max)}) بیشتر است.`)
  }
  if (req.dmMax <= 0) errors.push('حداکثر ماده خشک روزانه باید بزرگ‌تر از صفر باشد.')
  if (req.forageMax > 100 || req.concMax > 100) errors.push('درصد علوفه یا کنسانتره نمی‌تواند بیش از ۱۰۰ باشد.')
  if (req.forageMin + req.concMin > 100 + 1e-9) {
    errors.push(
      `مجموع حداقل علوفه (${nf(req.forageMin, 0)}٪) و حداقل کنسانتره (${nf(req.concMin, 0)}٪) از ۱۰۰٪ بیشتر است.`,
    )
  }
  if (req.forageMax + req.concMax < 100 - 1e-9) {
    errors.push(
      `مجموع حداکثر علوفه (${nf(req.forageMax, 0)}٪) و حداکثر کنسانتره (${nf(req.concMax, 0)}٪) کمتر از ۱۰۰٪ است.`,
    )
  }
  if (req.mode === 'group' && (!Number.isInteger(req.headCount) || req.headCount < 1)) {
    errors.push('تعداد دام در جیره گروهی باید یک عدد صحیح و حداقل ۱ باشد.')
  }

  const codes = new Map<string, number>()
  for (const f of feeds) codes.set(f.code.trim(), (codes.get(f.code.trim()) ?? 0) + 1)
  for (const [code, count] of codes) {
    if (!code) errors.push('همه نهاده‌ها باید کد داشته باشند.')
    else if (count > 1) errors.push(`کد «${code}» برای بیش از یک نهاده استفاده شده است؛ کد باید یکتا باشد.`)
  }

  if (active.length === 0) errors.push('هیچ نهاده فعالی وجود ندارد.')
  for (const f of active) {
    const name = f.name || f.code
    if (!(f.dm > 0 && f.dm <= 100)) errors.push(`ماده خشک «${name}» باید بین ۰ و ۱۰۰ باشد.`)
    if (f.energy < 0 || f.cp < 0 || f.price < 0) errors.push(`مقادیر انرژی، پروتئین و قیمت «${name}» نباید منفی باشد.`)
    if (f.minKg != null && f.maxKg != null && f.minKg > f.maxKg) errors.push(`حداقل مصرف «${name}» از حداکثر آن بیشتر است.`)
    if (f.minPct != null && f.maxPct != null && f.minPct > f.maxPct) errors.push(`حداقل درصد «${name}» از حداکثر آن بیشتر است.`)
    if ((f.maxPct ?? 0) > 100 || (f.minPct ?? 0) > 100) errors.push(`درصد «${name}» نمی‌تواند بیش از ۱۰۰ باشد.`)
  }

  if (active.length > 0) {
    if (req.forageMin > 0 && !active.some((f) => f.type === 'forage')) {
      errors.push('حداقل علوفه تعیین شده اما هیچ علوفه فعالی در فهرست نهاده‌ها نیست.')
    }
    if (req.concMin > 0 && !active.some((f) => f.type === 'concentrate')) {
      errors.push('حداقل کنسانتره تعیین شده اما هیچ کنسانتره فعالی در فهرست نهاده‌ها نیست.')
    }
    const sumMinPct = active.reduce((s, f) => s + (f.minPct ?? 0), 0)
    if (sumMinPct > 100 + 1e-9) errors.push(`مجموع «حداقل درصد» نهاده‌ها ${nf(sumMinPct, 1)}٪ است و از ۱۰۰٪ بیشتر است.`)
    const sumMaxPct = active.reduce((s, f) => s + (f.maxPct ?? 100), 0)
    if (sumMaxPct < 100 - 1e-9) {
      errors.push(`مجموع «حداکثر درصد» نهاده‌های فعال ${nf(sumMaxPct, 1)}٪ است؛ با این سقف‌ها جیره به ۱۰۰٪ نمی‌رسد.`)
    }
    const sumMinKg = active.reduce((s, f) => s + (f.minKg ?? 0), 0)
    if (sumMinKg > req.dmMax + 1e-9) {
      errors.push(
        `مجموع حداقل مصرف نهاده‌ها (${nf(sumMinKg, 2)} kg DM) از حداکثر ماده خشک روزانه (${nf(req.dmMax, 2)} kg) بیشتر است.`,
      )
    }
  }
  return errors
}

function metricRange(feeds: Feed[], req: Requirements, metric: Metric, group: ConstraintGroup): Achievable | null {
  const lo = solve(feeds, req, { skip: [group], objective: { kind: 'metric', metric, dir: 'min' } })
  const hi = solve(feeds, req, { skip: [group], objective: { kind: 'metric', metric, dir: 'max' } })
  if (!lo || !hi) return null
  const value = (sol: Solution, fallback: number) =>
    sol.unbounded ? fallback : feeds.reduce((s, f) => s + (sol.x[f.id] ?? 0) * metricCoef(f, metric), 0)
  return { min: value(lo, 0), max: value(hi, Number.POSITIVE_INFINITY) }
}

function forageRange(feeds: Feed[], req: Requirements): Achievable | null {
  const base: BuildOptions = { skip: ['ratio'] }
  if (!isFeasible(feeds, req, base)) return null
  const search = (test: (p: number) => boolean, feasibleAt: number, target: number) => {
    if (test(target)) return target
    let good = feasibleAt
    let bad = target
    for (let i = 0; i < 24; i++) {
      const mid = (good + bad) / 2
      if (test(mid)) good = mid
      else bad = mid
    }
    return good
  }
  const max = search((p) => isFeasible(feeds, req, { ...base, forageBounds: { min: p } }), 0, 100)
  const min = search((p) => isFeasible(feeds, req, { ...base, forageBounds: { max: p } }), 100, 0)
  return { min, max }
}

function diagnose(feeds: Feed[], req: Requirements): Diagnosis {
  const causes: DiagnosisCause[] = []
  const active = feeds.filter((f) => f.active)

  for (const group of ALL_GROUPS) {
    if (!isFeasible(feeds, req, { skip: [group] })) continue

    if (group === 'dm' || group === 'energy' || group === 'protein') {
      const metric: Metric = group
      const range = metricRange(feeds, req, metric, group)
      const required =
        group === 'dm'
          ? { min: req.dmMin, max: req.dmMax }
          : group === 'energy'
            ? { min: req.energyMin, max: req.energyMax }
            : { min: req.cpMin, max: req.cpMax }
      const unit = group === 'dm' ? 'kg DM/روز' : group === 'energy' ? 'Mcal/روز' : 'g/روز'
      const digits = group === 'protein' ? 0 : 2
      const short = range && range.max < required.min
      const label = GROUP_LABELS[group]
      causes.push({
        group,
        title: `${label} با نهاده‌های موجود قابل دستیابی نیست`,
        message: range
          ? `با رعایت سایر قیود، ${label} جیره فقط بین ${nf(range.min, digits)} تا ${nf(range.max, digits)} ${unit} قابل دستیابی است، اما محدوده تعیین‌شده ${nf(required.min, digits)} تا ${nf(required.max, digits)} ${unit} است.`
          : `با کنار گذاشتن قید ${label}، جیره امکان‌پذیر می‌شود.`,
        suggestion:
          group === 'energy'
            ? short
              ? 'حداقل انرژی را کاهش دهید، یا سقف نهاده‌های پرانرژی (جو، ذرت) را افزایش دهید یا نهاده پرانرژی جدیدی فعال کنید.'
              : 'حداکثر انرژی را افزایش دهید، یا نهاده‌های کم‌انرژی‌تر (کاه، علوفه) را با سقف بالاتر مجاز کنید.'
            : group === 'protein'
              ? short
                ? 'حداقل پروتئین را کاهش دهید، یا سقف نهاده‌های پروتئینی (کنجاله سویا، یونجه) را افزایش دهید.'
                : 'حداکثر پروتئین را افزایش دهید، یا سهم نهاده‌های کم‌پروتئین (کاه، ذرت) را بیشتر مجاز کنید.'
              : short
                ? 'حداقل ماده خشک را کاهش دهید یا سقف مصرف (kg DM) نهاده‌ها را افزایش دهید.'
                : 'حداکثر ماده خشک را افزایش دهید یا حداقل مصرف نهاده‌ها را کاهش دهید.',
        achievable: range ?? undefined,
        required,
        unit,
      })
    } else if (group === 'ratio') {
      const range = forageRange(feeds, req)
      const lo = Math.max(req.forageMin, 100 - req.concMax)
      const hi = Math.min(req.forageMax, 100 - req.concMin)
      causes.push({
        group,
        title: 'نسبت علوفه / کنسانتره با نهاده‌های موجود قابل دستیابی نیست',
        message: range
          ? `با رعایت سایر قیود، سهم علوفه فقط بین ${nf(range.min, 1)}٪ تا ${nf(range.max, 1)}٪ ماده خشک قابل دستیابی است، اما محدوده مجاز علوفه ${nf(lo, 1)}٪ تا ${nf(hi, 1)}٪ است.`
          : 'با کنار گذاشتن قید نسبت علوفه/کنسانتره، جیره امکان‌پذیر می‌شود.',
        suggestion:
          range && range.max < lo
            ? 'حداقل علوفه را کاهش دهید یا سقف درصد علوفه‌ها (یونجه، کاه، سیلاژ) را افزایش دهید.'
            : 'حداکثر علوفه را افزایش دهید یا سقف درصد کنسانتره‌ها را بالاتر ببرید.',
        achievable: range ?? undefined,
        required: { min: lo, max: hi },
        unit: '٪ علوفه',
      })
    } else {
      const limited = active.filter(
        (f) => f.minKg != null || f.maxKg != null || f.minPct != null || f.maxPct != null,
      )
      const culprits = limited.filter((f) => isFeasible(feeds, req, { relaxFeedId: f.id })).map((f) => f.name)
      causes.push({
        group,
        title: 'محدودیت مصرف نهاده‌ها مانع رسیدن به جیره است',
        message:
          culprits.length > 0
            ? `برداشتن محدودیت هر یک از این نهاده‌ها جیره را امکان‌پذیر می‌کند: ${culprits.join('، ')}.`
            : 'با برداشتن همه محدودیت‌های درصدی و مقداری نهاده‌ها، جیره امکان‌پذیر می‌شود؛ اما برداشتن محدودیت یک نهاده به تنهایی کافی نیست.',
        suggestion: 'سقف (یا کف) مصرف نهاده‌های نام‌برده را بازبینی کنید یا نهاده جایگزین با ترکیب مشابه فعال کنید.',
        feedNames: culprits,
      })
    }
  }

  const pairHints: string[] = []
  if (causes.length === 0) {
    for (let i = 0; i < ALL_GROUPS.length; i++) {
      for (let j = i + 1; j < ALL_GROUPS.length; j++) {
        if (isFeasible(feeds, req, { skip: [ALL_GROUPS[i], ALL_GROUPS[j]] })) {
          pairHints.push(`«${GROUP_LABELS[ALL_GROUPS[i]]}» و «${GROUP_LABELS[ALL_GROUPS[j]]}»`)
        }
      }
    }
  }

  const general =
    causes.length === 0 && pairHints.length === 0
      ? 'حتی با کنار گذاشتن هر دو گروه از قیود نیز جیره ممکن نیست. ترکیب مواد مغذی نهاده‌های فعال با نیازهای تعیین‌شده فاصله زیادی دارد؛ نهاده‌های بیشتری فعال کنید یا نیازها را بازبینی کنید.'
      : null

  return { causes, pairHints, general }
}

function distance(a: Record<string, number>, b: Record<string, number>) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  let d = 0
  for (const k of keys) d += Math.abs((a[k] ?? 0) - (b[k] ?? 0))
  return d
}

function findAlternatives(feeds: Feed[], req: Requirements, best: Ration, bestX: Record<string, number>, count: number) {
  type Candidate = { x: Record<string, number>; ration: Ration; feedId: string }
  const excludedCandidates: Candidate[] = []
  const cappedCandidates: Candidate[] = []

  for (const item of best.items) {
    const f = item.feed
    const hasFloor = (f.minKg ?? 0) > 0 || (f.minPct ?? 0) > 0
    if (!hasFloor) {
      const sol = solve(feeds, req, { excluded: new Set([f.id]) })
      if (sol && !sol.unbounded) {
        const ration = evaluateRation(sol.x, feeds, req, { id: '', title: '', note: `بدون ${f.name}` })
        if (ration.valid) excludedCandidates.push({ x: sol.x, ration, feedId: f.id })
      }
    }
    const cap = item.kgDM * 0.5
    if (cap >= (f.minKg ?? 0)) {
      const sol = solve(feeds, req, { caps: { [f.id]: cap } })
      if (sol && !sol.unbounded) {
        const ration = evaluateRation(sol.x, feeds, req, {
          id: '',
          title: '',
          note: `${f.name} کمتر (حداکثر ${nf(cap, 2)} kg DM)`,
        })
        if (ration.valid) cappedCandidates.push({ x: sol.x, ration, feedId: f.id })
      }
    }
  }

  const byCost = (a: Candidate, b: Candidate) => a.ration.totals.costPerHead - b.ration.totals.costPerHead
  const picked: Candidate[] = []
  const pick = (pool: Candidate[], minGap: number) => {
    for (const c of [...pool].sort(byCost)) {
      if (picked.length >= count) return
      if (distance(c.x, bestX) < minGap) continue
      if (picked.some((p) => p.feedId === c.feedId || distance(p.x, c.x) < minGap)) continue
      picked.push(c)
    }
  }
  const strongGap = Math.max(0.05, best.totals.dm * 0.08)
  pick(excludedCandidates, strongGap)
  pick(cappedCandidates, strongGap)
  pick([...excludedCandidates, ...cappedCandidates], Math.max(0.02, best.totals.dm * 0.03))
  return picked.map((p, i) => ({ ...p.ration, id: `alt${i + 1}`, title: `جیره جایگزین ${i === 0 ? '۱' : '۲'}` }))
}

export function formulate(feeds: Feed[], req: Requirements): Outcome {
  const errors = validateInputs(feeds, req)
  if (errors.length > 0) return { status: 'invalid', errors }

  const sol = solve(feeds, req)
  if (!sol || sol.unbounded) return { status: 'infeasible', diagnosis: diagnose(feeds, req) }

  const best = evaluateRation(sol.x, feeds, req, {
    id: 'best',
    title: 'جیره اقتصادی',
    note: 'کمترین هزینه با رعایت همه قیود',
  })
  if (!best.valid) {
    return {
      status: 'infeasible',
      diagnosis: {
        causes: [],
        pairHints: [],
        general: 'پاسخ موتور بهینه‌سازی در بررسی نهایی قیود رد شد. برای جلوگیری از ارائه جیره نادرست، نتیجه‌ای نمایش داده نمی‌شود.',
      },
    }
  }

  const alternatives = findAlternatives(feeds, req, best, sol.x, 2)
  return { status: 'ok', rations: [best, ...alternatives] }
}
