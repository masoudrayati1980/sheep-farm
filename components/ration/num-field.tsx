'use client'

import { useState } from 'react'
import { normalizeNumberInput } from '@/lib/format'
import { cn } from '@/lib/utils'

function parse(text: string): number | null | undefined {
  const n = normalizeNumberInput(text)
  if (n === '') return null
  if (!/^\d*\.?\d*$/.test(n) || n === '.') return undefined
  return Number(n)
}

const display = (v: number | null) => (v == null ? '' : String(v))

interface NumFieldProps {
  value: number | null
  onChange: (value: number | null) => void
  label: string
  optional?: boolean
  placeholder?: string
  className?: string
  id?: string
}

export function NumField({ value, onChange, label, optional, placeholder, className, id }: NumFieldProps) {
  const [text, setText] = useState(display(value))
  const [synced, setSynced] = useState(value)

  if (value !== synced) {
    setSynced(value)
    if (parse(text) !== value) setText(display(value))
  }

  const parsed = parse(text)
  const invalid = parsed === undefined || (!optional && parsed === null)

  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      dir="ltr"
      autoComplete="off"
      aria-label={label}
      aria-invalid={invalid || undefined}
      placeholder={placeholder ?? (optional ? '—' : undefined)}
      value={text}
      onChange={(e) => {
        const next = e.target.value
        setText(next)
        const p = parse(next)
        if (p === undefined || (p === null && !optional)) return
        setSynced(p)
        onChange(p)
      }}
      className={cn(
        'h-9 w-full min-w-0 rounded-md border border-input bg-background px-2 text-center text-sm tabular-nums outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20',
        className,
      )}
    />
  )
}
