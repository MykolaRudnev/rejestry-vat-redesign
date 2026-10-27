"use client";
import { useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  AlertOctagon,
  ArrowDownUp,
  Check,
  CircleDashed,
  Clock3,
  CloudOff,
  Filter,
  LoaderCircle,
  Minus,
  MoreHorizontal,
  Plus,
  Printer,
  Search,
  TriangleAlert,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Money } from "@/components/register/money";

const surfaces = ["desk", "sheet", "raised", "overlay", "sunken", "hover", "pressed", "selected", "inverse"] as const;
const inks = ["ink-1", "ink-2", "ink-3", "ink-disabled"] as const;
const statuses = [
  { k: "accent", fill: "bg-accent-fill", soft: "bg-accent-soft text-accent-soft-ink" },
  { k: "ok", fill: "bg-ok-fill", soft: "bg-ok-soft text-ok-soft-ink" },
  { k: "wa", fill: "bg-wa-fill", soft: "bg-wa-soft text-wa-soft-ink" },
  { k: "er", fill: "bg-er-fill", soft: "bg-er-soft text-er-soft-ink" },
];
const surfaceClass: Record<(typeof surfaces)[number], string> = {
  desk: "bg-surface-desk",
  sheet: "bg-surface-sheet",
  raised: "bg-surface-raised",
  overlay: "bg-surface-overlay",
  sunken: "bg-surface-sunken",
  hover: "bg-surface-hover",
  pressed: "bg-surface-pressed",
  selected: "bg-surface-selected",
  inverse: "bg-surface-inverse",
};
const inkClass: Record<(typeof inks)[number], string> = {
  "ink-1": "text-ink-1",
  "ink-2": "text-ink-2",
  "ink-3": "text-ink-3",
  "ink-disabled": "text-ink-disabled",
};

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-(--stack-group)">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-display-3">{title}</h2>
        {note && <p className="max-w-[64ch] text-small text-ink-2">{note}</p>}
      </div>
      {children}
    </section>
  );
}

export function Specimen() {
  const { resolvedTheme, setTheme } = useTheme();
  // the theme is only known in the browser; render the toggle's value after hydration
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const [chips, setChips] = useState({ korekta: true, gtu: false });

  return (
    <div className="min-h-dvh bg-surface-desk md:p-(--sheet-inset)">
      <main className="mx-auto flex max-w-[calc(var(--content-max)+2*var(--gutter))] flex-col gap-(--stack-section) bg-surface-sheet px-(--gutter) py-10 shadow-sheet md:rounded-xl md:py-14">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-col gap-2">
            <p className="text-small text-ink-2">Saldo · system projektowy</p>
            <h1 className="font-display text-display-1">Papier i atrament</h1>
            <p className="max-w-[56ch] text-body text-ink-2">
              Ciepły papier, chłodny atrament, jeden ultramarynowy stempel. Kolor pojawia się tylko tam, gdzie coś wymaga decyzji.
            </p>
          </div>
          <ToggleGroup type="single" value={mounted ? resolvedTheme : ""} onValueChange={(v) => v && setTheme(v)} aria-label="Motyw">
            <ToggleGroupItem value="light">Jasny</ToggleGroupItem>
            <ToggleGroupItem value="dark">Ciemny</ToggleGroupItem>
          </ToggleGroup>
        </header>

        <Section title="Kwoty" note="Krój Newsreader dla kwot w nagłówkach, IBM Plex Sans z cyframi tabelarycznymi w tabelach.">
          <div className="flex flex-col gap-2">
            <span className="text-small text-ink-2">VAT do zapłaty</span>
            <Money value={45134.33} variant="hero" className="font-display text-hero" />
            <div className="flex flex-wrap gap-x-8 gap-y-1 text-body text-ink-2">
              <span>
                należny <Money value={48366.21} variant="display" className="font-display text-display-3" />
              </span>
              <span>
                naliczony <Money value={3231.88} variant="display" className="font-display text-display-3" />
              </span>
            </div>
          </div>
          <div className="grid max-w-md grid-cols-[1fr_auto] gap-x-6 gap-y-2 text-body">
            <span className="text-ink-2">Korekta</span>
            <Money value={-2349.3} className="text-right" />
            <span className="text-ink-2">Faktura</span>
            <Money value={44710.5} className="text-right" />
            <span className="text-ink-2">Zero</span>
            <Money value={0} className="text-right" />
          </div>
        </Section>

        <Section title="Typografia">
          <div className="flex flex-col gap-3">
            <p className="font-display text-display-1">Rejestry i VAT</p>
            <p className="font-display text-display-2">Faktura FV/2026/10/019</p>
            <p className="font-display text-display-3">Brak dokumentów w październiku</p>
            <p className="text-title">Klinika Weterynaryjna Azor</p>
            <p className="max-w-[64ch] text-body">
              Okres wymaga potwierdzenia przed wysyłką JPK_V7M. Zażółć gęślą jaźń — polskie znaki w każdym kroju.
            </p>
            <p className="text-small text-ink-2">NIP 690-216-22-60 · Faktura · 24 października</p>
            <p className="font-mono text-mono text-ink-2">5842799130-20261024-3F9A0C1B22E4-7C</p>
          </div>
        </Section>

        <Section title="Powierzchnie i atrament" note="Tier 2 — komponenty używają tylko tych nazw.">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
            {surfaces.map((s) => (
              <div key={s} className="flex flex-col gap-1.5">
                <div className={cn("h-16 rounded-md shadow-sheet", surfaceClass[s])} />
                <span className="text-small text-ink-2">{s}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-6">
            {inks.map((i) => (
              <span key={i} className={cn("text-title", inkClass[i])}>
                {i}
              </span>
            ))}
            <span className="text-title text-accent-text">accent-text</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {statuses.map((s) => (
              <div key={s.k} className="flex flex-col gap-1.5">
                <div className={cn("h-10 rounded-md", s.fill)} />
                <div className={cn("flex h-10 items-center rounded-md px-3 text-small font-medium", s.soft)}>{s.k}-soft</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Przyciski" note="Jeden przycisk główny na widok.">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">
              <Plus /> Dodaj dokument
            </Button>
            <Button variant="primary" loading>
              Zapisywanie…
            </Button>
            <Button variant="primary" disabled>
              Zapisz
            </Button>
            <Button>
              <Filter /> Filtry
            </Button>
            <Button variant="ghost" size="icon" aria-label="Więcej akcji">
              <MoreHorizontal />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Drukuj">
              <Printer />
            </Button>
            <Button variant="text">Potwierdź okres</Button>
            <Button variant="danger-ghost">Usuń</Button>
            <Button variant="danger">Usuń trwale</Button>
          </div>
        </Section>

        <Section title="Pola" note="Linia księgowa: tło, zaokrąglona góra, linia u dołu.">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="s-nip">NIP kontrahenta</Label>
              <Input id="s-nip" defaultValue="690-216-22-60" />
              <p className="text-small text-ink-3">10 cyfr, sprawdzamy sumę kontrolną.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="s-err">NIP kontrahenta</Label>
              <Input id="s-err" defaultValue="690-216-22-61" aria-invalid aria-describedby="s-err-m" />
              <p id="s-err-m" className="flex items-center gap-1.5 text-small text-er-soft-ink">
                <AlertOctagon className="size-4" /> Nieprawidłowa suma kontrolna NIP.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="s-dis">Numer KSeF</Label>
              <Input id="s-dis" disabled placeholder="Nadawany po przyjęciu" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="s-amt">Kwota netto</Label>
              <div className="relative">
                <Input id="s-amt" defaultValue="36 350,00" className="tnum pr-10 text-right" />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ink-3">zł</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="s-ro">Data wystawienia (okres zamknięty)</Label>
              <Input id="s-ro" readOnly defaultValue="24.10.2026" />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-small font-medium text-ink-2">Wyszukiwanie</span>
              <label className="flex h-(--control-h) items-center gap-2 rounded-md bg-surface-sunken px-3 transition-colors duration-(--dur-fast) focus-within:bg-surface-raised">
                <Search className="size-4.5 shrink-0 text-ink-3" />
                <input
                  className="min-w-0 flex-1 bg-transparent text-body outline-none placeholder:text-ink-3"
                  placeholder="Szukaj: kontrahent, NIP, numer, KSeF"
                  aria-label="Szukaj"
                />
                <kbd className="hidden rounded-xs bg-surface-pressed px-1.5 font-mono text-micro text-ink-2 fine:inline">/</kbd>
              </label>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2.5 text-body">
              <Checkbox defaultChecked /> Zaznaczony
            </label>
            <label className="flex items-center gap-2.5 text-body">
              <Checkbox /> Pusty
            </label>
            <label className="flex items-center gap-2.5 text-body text-ink-disabled">
              <Checkbox disabled /> Niedostępny
            </label>
          </div>
        </Section>

        <Section title="Zakładki, chipy, segmenty">
          <Tabs defaultValue="sales">
            <TabsList>
              <TabsTrigger value="sales" title="Rejestr VAT sprzedaży">
                Sprzedaż <span className="tnum text-small font-normal text-ink-3">24</span>
              </TabsTrigger>
              <TabsTrigger value="purchase" title="Rejestr VAT zakupów">
                Zakupy <span className="tnum text-small font-normal text-ink-3">17</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-8 items-center gap-1 rounded-pill bg-accent-soft pr-1 pl-3 text-small font-medium text-accent-soft-ink">
              Rodzaj: Korekta
              <button aria-label="Usuń filtr Rodzaj: Korekta" className="grid size-6 place-items-center rounded-pill hover:bg-accent-line">
                <X className="size-3.5" />
              </button>
            </span>
            <Button variant="text" className="text-small">
              Wyczyść wszystko
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Toggle pressed={chips.korekta} onPressedChange={(v) => setChips((c) => ({ ...c, korekta: v }))}>
              {chips.korekta && <Check />} Korekta <span className="tnum opacity-70">3</span>
            </Toggle>
            <Toggle pressed={chips.gtu} onPressedChange={(v) => setChips((c) => ({ ...c, gtu: v }))}>
              {chips.gtu && <Check />} GTU_12 <span className="tnum opacity-70">2</span>
            </Toggle>
            <Toggle disabled>
              Paragon z NIP <span className="tnum">0</span>
            </Toggle>
          </div>
          <ToggleGroup type="single" defaultValue="10" aria-label="Na stronie">
            <ToggleGroupItem value="10">10</ToggleGroupItem>
            <ToggleGroupItem value="25">25</ToggleGroupItem>
            <ToggleGroupItem value="50">50</ToggleGroupItem>
          </ToggleGroup>
        </Section>

        <Section title="Statusy" note="Zdrowe stany są cichym tekstem, problemy dostają pigułkę. Zawsze ikona + słowo.">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-small">
            <span className="inline-flex items-center gap-1.5 text-ink-2">
              <CircleDashed className="size-4" /> Nie wysłana
            </span>
            <Badge tone="accent">
              <Clock3 /> W kolejce
            </Badge>
            <Badge tone="accent">
              <LoaderCircle className="animate-spin" /> Przetwarzanie
            </Badge>
            <span className="inline-flex items-center gap-1.5 text-ok-soft-ink">
              <Check className="size-4" /> Przyjęta
            </span>
            <Badge tone="er">
              <AlertOctagon /> Odrzucona
            </Badge>
            <span className="inline-flex items-center gap-1.5 text-ink-3">
              <Minus className="size-4" /> Poza KSeF
            </span>
            <Badge tone="wa">Wymaga konfiguracji</Badge>
            <Badge tone="ok">Gotowy</Badge>
            <Badge>Niedostępny</Badge>
          </div>
          <div className="flex min-h-12 flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-wa-soft px-4 py-3 text-body text-wa-soft-ink">
            <TriangleAlert className="size-4.5 shrink-0" />
            <span>
              <strong className="font-semibold">3 dokumenty do wyjaśnienia w KSeF</strong> · 1 odrzucony, 2 w kolejce
            </span>
            <Button variant="text" className="ml-auto text-ink-1">
              Wyjaśnij
            </Button>
          </div>
        </Section>

        <Section title="Menu i powiadomienia">
          <div className="flex flex-wrap gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Więcej akcji">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Rejestr</DropdownMenuLabel>
                <DropdownMenuItem>
                  <Printer /> Drukuj rejestr <DropdownMenuShortcut>⌘P</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <ArrowDownUp /> Kolumny
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive">Usuń zaznaczone</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => toast("Dokument usunięty", { action: { label: "Cofnij", onClick: () => {} } })}>Toast z cofnięciem</Button>
            <Button onClick={() => toast.error("Nie udało się wysłać do KSeF")}>Toast błędu</Button>
          </div>
        </Section>

        <Section title="Stany" note="Puste, błąd i ładowanie mają ten sam układ: do lewej, bez ilustracji.">
          <div className="grid gap-(--stack-section) lg:grid-cols-2">
            <div className="flex flex-col items-start gap-3 py-8">
              <CloudOff className="size-10 text-ink-3" strokeWidth={1.5} />
              <h3 className="font-display text-display-3">Nie udało się wczytać rejestru</h3>
              <p className="max-w-[56ch] text-body text-ink-2">Sprawdź połączenie i spróbuj ponownie. Dane, które wpisałeś, są bezpieczne.</p>
              <Button variant="primary">Spróbuj ponownie</Button>
              <span className="text-small text-ink-3">Kod: REG-503</span>
            </div>
            <div aria-busy="true" className="flex flex-col gap-4 py-8">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-14 w-72" />
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="flex flex-1 flex-col gap-2">
                    <Skeleton className="h-3.5 w-3/5" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <Skeleton className="h-3.5 w-20" />
                </div>
              ))}
            </div>
          </div>
        </Section>
      </main>
    </div>
  );
}
