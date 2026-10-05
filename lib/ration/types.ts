export type FeedType = 'forage' | 'concentrate'

export interface Feed {
  id: string
  code: string
  name: string
  type: FeedType
  /** ماده خشک، درصد */
  dm: number
  /** انرژی قابل متابولیسم، Mcal/kg DM */
  energy: number
  /** پروتئین خام، درصد از ماده خشک */
  cp: number
  /** قیمت، تومان به ازای هر kg تر (as-fed) */
  price: number
  /** حداقل مصرف، kg DM در روز برای هر رأس */
  minKg: number | null
  /** حداکثر مصرف، kg DM در روز برای هر رأس */
  maxKg: number | null
  /** حداقل درصد از ماده خشک جیره */
  minPct: number | null
  /** حداکثر درصد از ماده خشک جیره */
  maxPct: number | null
  active: boolean
}

export type RationMode = 'single' | 'group'

export interface Requirements {
  mode: RationMode
  animal: string
  bodyWeight: number
  headCount: number
  /** kg DM/day per head */
  dmMin: number
  dmMax: number
  /** Mcal ME/day per head */
  energyMin: number
  energyMax: number
  /** g CP/day per head */
  cpMin: number
  cpMax: number
  /** درصد از ماده خشک */
  forageMin: number
  forageMax: number
  concMin: number
  concMax: number
}

export type ConstraintGroup = 'dm' | 'energy' | 'protein' | 'ratio' | 'feedLimits'

export interface RationItem {
  feed: Feed
  kgDM: number
  kgAsFed: number
  pctDM: number
  cost: number
}

export interface ConstraintCheck {
  key: string
  label: string
  unit: string
  min: number | null
  max: number | null
  value: number
  ok: boolean
  binding: 'min' | 'max' | null
  digits: number
}

export interface RationTotals {
  dm: number
  asFed: number
  energy: number
  cp: number
  energyDensity: number
  cpPct: number
  foragePct: number
  concPct: number
  costPerHead: number
  costPerKgDM: number
}

export interface Ration {
  id: string
  title: string
  note: string
  items: RationItem[]
  totals: RationTotals
  checks: ConstraintCheck[]
  feedChecks: ConstraintCheck[]
  valid: boolean
}

export interface Achievable {
  min: number
  max: number
}

export interface DiagnosisCause {
  group: ConstraintGroup
  title: string
  message: string
  suggestion: string
  achievable?: Achievable
  required?: { min: number; max: number }
  unit?: string
  feedNames?: string[]
}

export interface Diagnosis {
  causes: DiagnosisCause[]
  pairHints: string[]
  general: string | null
}

export type Outcome =
  | { status: 'invalid'; errors: string[] }
  | { status: 'infeasible'; diagnosis: Diagnosis }
  | { status: 'ok'; rations: Ration[] }
