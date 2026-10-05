import type { Feed, Requirements } from './types'

export const DEFAULT_FEEDS: Feed[] = [
  { id: 'alfalfa', code: 'F01', name: 'یونجه', type: 'forage', dm: 90, energy: 2.2, cp: 17, price: 18000, minKg: null, maxKg: null, minPct: null, maxPct: 40, active: true },
  { id: 'straw', code: 'F02', name: 'کاه گندم', type: 'forage', dm: 92, energy: 1.6, cp: 4, price: 9000, minKg: null, maxKg: null, minPct: null, maxPct: 15, active: true },
  { id: 'silage', code: 'F03', name: 'سیلاژ ذرت', type: 'forage', dm: 33, energy: 2.4, cp: 8, price: 6000, minKg: null, maxKg: null, minPct: null, maxPct: 30, active: true },
  { id: 'barley', code: 'C01', name: 'جو', type: 'concentrate', dm: 89, energy: 2.9, cp: 12, price: 22000, minKg: null, maxKg: 0.5, minPct: null, maxPct: 35, active: true },
  { id: 'corn', code: 'C02', name: 'ذرت دانه', type: 'concentrate', dm: 88, energy: 3.1, cp: 9, price: 24000, minKg: null, maxKg: null, minPct: null, maxPct: 30, active: true },
  { id: 'soy', code: 'C03', name: 'کنجاله سویا', type: 'concentrate', dm: 90, energy: 3.0, cp: 48, price: 45000, minKg: null, maxKg: 0.15, minPct: null, maxPct: 10, active: true },
  { id: 'bran', code: 'C04', name: 'سبوس گندم', type: 'concentrate', dm: 89, energy: 2.5, cp: 17, price: 15000, minKg: null, maxKg: null, minPct: null, maxPct: 20, active: true },
  { id: 'pulp', code: 'C05', name: 'تفاله چغندر', type: 'concentrate', dm: 90, energy: 2.6, cp: 9, price: 17000, minKg: null, maxKg: null, minPct: null, maxPct: 15, active: true },
]

export const DEFAULT_REQUIREMENTS: Requirements = {
  mode: 'group',
  animal: 'میش شیرده',
  bodyWeight: 55,
  headCount: 25,
  dmMin: 1.3,
  dmMax: 1.6,
  energyMin: 2.7,
  energyMax: 3.1,
  cpMin: 170,
  cpMax: 210,
  forageMin: 40,
  forageMax: 60,
  concMin: 40,
  concMax: 60,
}
