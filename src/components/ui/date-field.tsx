"use client"

import * as React from "react"
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Overlay } from "@/components/ui/overlay"
import { isoToPl, plToIso } from "@/lib/format"

const MONTHS = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"]
const DAYS = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"]
const pad = (n: number) => String(n).padStart(2, "0")

function Calendar({ value, today, min, max, onPick }: { value: string; today: string; min?: string; max?: string; onPick: (iso: string) => void }) {
  const base = value || today
  const [view, setView] = React.useState({ y: Number(base.slice(0, 4)), m: Number(base.slice(5, 7)) })
  const first = new Date(view.y, view.m - 1, 1)
  const offset = (first.getDay() + 6) % 7
  const days = new Date(view.y, view.m, 0).getDate()
  const shift = (d: number) => setView(({ y, m }) => (m + d < 1 ? { y: y - 1, m: 12 } : m + d > 12 ? { y: y + 1, m: 1 } : { y, m: m + d }))
  const step = "grid size-10 place-items-center rounded-md text-ink-2 hover:bg-surface-hover hover:text-ink-1"
  return (
    <div className="flex flex-col gap-2 p-1">
      <div className="flex items-center justify-between">
        <button type="button" className={step} onClick={() => shift(-1)} aria-label="Poprzedni miesiąc">
          <ChevronLeft className="size-4.5" />
        </button>
        <p className="text-title" aria-live="polite">
          {MONTHS[view.m - 1]} {view.y}
        </p>
        <button type="button" className={step} onClick={() => shift(1)} aria-label="Następny miesiąc">
          <ChevronRight className="size-4.5" />
        </button>
      </div>
      <div role="grid" className="grid grid-cols-7 gap-0.5 text-center">
        {DAYS.map((d) => (
          <span key={d} role="columnheader" className="pb-1 text-small text-ink-3">
            {d}
          </span>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <span key={`e${i}`} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const iso = `${view.y}-${pad(view.m)}-${pad(i + 1)}`
          const selected = iso === value
          const disabled = (min && iso < min) || (max && iso > max)
          return (
            <button
              key={iso}
              type="button"
              role="gridcell"
              aria-selected={selected}
              aria-label={`${i + 1} ${MONTHS[view.m - 1].toLowerCase()} ${view.y}`}
              disabled={!!disabled}
              onClick={() => onPick(iso)}
              className={cn(
                "tnum relative grid size-10 place-items-center rounded-sm text-body transition-colors duration-(--dur-fast) disabled:text-ink-disabled",
                selected ? "bg-accent-fill text-accent-knockout" : "hover:bg-surface-hover",
                iso === today && !selected && "font-semibold text-accent-text"
              )}
            >
              {i + 1}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Date in Polish format (dd.mm.rrrr) on a ledger line, with a calendar in a popover / drawer.
 * Replaces the native picker, which showed the browser locale (brief: "daty w formacie pl-PL").
 */
const DateField = React.forwardRef<
  HTMLInputElement,
  {
    id: string
    value: string
    onChange: (iso: string) => void
    onBlur?: () => void
    today: string
    min?: string
    max?: string
    invalid?: boolean
    describedBy?: string
    label: string
  }
>(function DateField({ id, value, onChange, onBlur, today, min, max, invalid, describedBy, label }, ref) {
  const [text, setText] = React.useState(isoToPl(value))
  const [open, setOpen] = React.useState(false)
  const [prev, setPrev] = React.useState(value)
  if (value !== prev) {
    setPrev(value)
    setText(isoToPl(value))
  }
  return (
    <div className="ledger relative flex items-center" data-invalid={invalid || undefined} aria-invalid={invalid || undefined}>
      <input
        ref={ref}
        id={id}
        value={text}
        inputMode="numeric"
        placeholder="dd.mm.rrrr"
        autoComplete="off"
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onChange={(e) => {
          setText(e.target.value)
          const iso = plToIso(e.target.value)
          if (iso) onChange(iso)
        }}
        onBlur={() => {
          const iso = plToIso(text)
          if (iso) setText(isoToPl(iso))
          else if (text.trim() === "") onChange("")
          else onChange("invalid")
          onBlur?.()
        }}
        className="tnum h-11 min-w-0 flex-1 bg-transparent px-3 text-body text-ink-1 outline-none placeholder:text-ink-3"
      />
      <Overlay
        title={label}
        open={open}
        onOpenChange={setOpen}
        align="end"
        className="w-auto p-2"
        trigger={
          <button type="button" aria-label={`${label}: otwórz kalendarz`} className="mr-1 grid size-9 shrink-0 place-items-center rounded-sm text-ink-2 hover:bg-surface-pressed hover:text-ink-1">
            <CalendarDays className="size-4.5" />
          </button>
        }
      >
        <div className="flex justify-center">
          <Calendar
            value={value === "invalid" ? "" : value}
            today={today}
            min={min}
            max={max}
            onPick={(iso) => {
              onChange(iso)
              setText(isoToPl(iso))
              setOpen(false)
            }}
          />
        </div>
      </Overlay>
    </div>
  )
})

export { DateField }
