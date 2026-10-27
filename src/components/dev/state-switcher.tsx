"use client";
import { ChevronsUpDown, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Overlay } from "@/components/ui/overlay";
import type { DemoState } from "@/lib/types";

export const demoStates: { id: DemoState; label: string; hint: string }[] = [
  { id: "filled", label: "Dane", hint: "Rejestr z dokumentami" },
  { id: "empty", label: "Pusto", hint: "Brak danych w okresie" },
  { id: "error", label: "Błąd", hint: "API zwraca błąd 503" },
  { id: "loading", label: "Ładowanie", hint: "Odpowiedź nie nadchodzi" },
];

/** The one place for every demo disclaimer [A6 B5 B7]; drives `?state=` of the fake API. */
export function DemoStateList({ state, onChange }: { state: DemoState; onChange: (s: DemoState) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="max-w-[40ch] px-2.5 pt-1 pb-2 text-small text-ink-2">
        To jest mapa zakresu, a nie uruchomienie księgowania. Dane pozostają demonstracyjne.
      </p>
      <div role="radiogroup" aria-label="Stan ekranu (symulacja API)">
        {demoStates.map((s) => (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={s.id === state}
            onClick={() => onChange(s.id)}
            className="flex min-h-12 w-full items-center gap-3 rounded-sm px-2.5 text-left transition-colors duration-(--dur-fast) hover:bg-surface-hover"
          >
            <span
              aria-hidden
              className={cn(
                "grid size-4.5 shrink-0 place-items-center rounded-pill inset-ring-2",
                s.id === state ? "inset-ring-accent-fill" : "inset-ring-line-control",
              )}
            >
              {s.id === state && <span className="size-2 rounded-pill bg-accent-fill" />}
            </span>
            <span>
              <span className="block text-body">{s.label}</span>
              <span className="block text-small text-ink-2">{s.hint}</span>
            </span>
          </button>
        ))}
      </div>
      <p className="px-2.5 pt-1 pb-1 text-small text-ink-3">
        Również przez adres: <code className="font-mono">?state=empty</code>
      </p>
    </div>
  );
}

/** Sidebar row (≥1024) or rail icon (768–1023). On phones the list lives in the account drawer. */
export function DemoControl({ state, onChange, variant = "row" }: { state: DemoState; onChange: (s: DemoState) => void; variant?: "row" | "icon" }) {
  const current = demoStates.find((s) => s.id === state)!;
  const trigger =
    variant === "row" ? (
      <button
        type="button"
        aria-label={`Dane demonstracyjne: ${current.label}. Zmień stan ekranu`}
        className="flex h-10 w-full items-center gap-2.5 rounded-md px-2.5 text-body text-ink-2 transition-colors duration-(--dur-fast) hover:bg-surface-hover hover:text-ink-1 aria-expanded:bg-surface-pressed"
      >
        <FlaskConical className="size-4.5 shrink-0" />
        <span className="flex-1 truncate text-left">
          {state === "filled" ? "Dane demonstracyjne" : <>Demo: <span className="text-wa-soft-ink">{current.label}</span></>}
        </span>
        <ChevronsUpDown className="size-4 shrink-0" />
      </button>
    ) : (
      <button
        type="button"
        aria-label={`Dane demonstracyjne: ${current.label}. Zmień stan ekranu`}
        className="grid size-11 place-items-center rounded-md text-ink-2 hover:bg-surface-hover hover:text-ink-1 aria-expanded:bg-surface-pressed"
      >
        <FlaskConical className="size-5" />
      </button>
    );
  return (
    <Overlay trigger={trigger} title="Dane demonstracyjne" side="right" align="end" showTitle className="w-80 p-1.5">
      <DemoStateList state={state} onChange={onChange} />
    </Overlay>
  );
}
