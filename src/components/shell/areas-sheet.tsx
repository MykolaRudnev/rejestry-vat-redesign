"use client";
import { Accordion } from "radix-ui";
import { Check, ChevronDown, CalendarDays, CircleDashed } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Drawer, DrawerBody, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useIsDesktop } from "@/hooks/use-media-query";
import { areas, readinessLabel, type Readiness } from "@/data/areas";
import { TODAY } from "@/data/companies";
import type { Company } from "@/lib/types";

const tone: Record<Readiness, "ok" | "wa" | "neutral"> = { ready: "ok", config: "wa", unavailable: "neutral" };

/** The original landing screen "Obszary księgowe" folded into one panel [A5 A7 A8 A9]. */
function AreasContent() {
  const year = TODAY.slice(0, 4);
  return (
    <div className="flex flex-col gap-8">
      <section className="flex gap-3">
        <CalendarDays className="mt-0.5 size-5 shrink-0 text-ink-2" />
        <div className="flex flex-col items-start gap-1.5">
          <h3 className="text-title">Okres księgowy · {year}</h3>
          <p className="text-small text-ink-2">
            Orientacyjny rok rozliczeniowy aktywnej organizacji. Wymaga potwierdzenia przed uruchomieniem operacji księgowych.
          </p>
          <Badge tone="wa">Wymaga konfiguracji</Badge>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <h3 className="text-title">Dostępność obszarów</h3>
          <p className="text-small text-ink-2">
            Status pokazuje gotowość warunków, ale nie uruchamia księgowania ani operacji zewnętrznych.
          </p>
        </div>
        <Accordion.Root type="multiple" className="flex flex-col">
          {areas.map((a) => (
            <Accordion.Item key={a.id} value={a.id} className="border-b border-line-subtle last:border-b-0">
              <Accordion.Header>
                <Accordion.Trigger className="group flex min-h-14 w-full items-center gap-3 rounded-sm py-2 text-left text-body hover:text-ink-1">
                  <span className="flex-1 font-medium">{a.name}</span>
                  <Badge tone={tone[a.readiness]}>{readinessLabel[a.readiness]}</Badge>
                  <ChevronDown className="size-4.5 shrink-0 text-ink-2 transition-transform duration-(--dur-base) group-data-[state=open]:rotate-180" />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                <ul className="flex flex-col gap-1.5 pb-3">
                  {a.conditions.map((c) => (
                    <li key={c.label} className="flex items-start gap-2 text-small text-ink-2">
                      {c.ok ? <Check className="mt-0.5 size-4 shrink-0 text-ok-soft-ink" /> : <CircleDashed className="mt-0.5 size-4 shrink-0 text-ink-3" />}
                      <span>
                        {c.label}
                        <span className="sr-only">{c.ok ? " — spełniony" : " — do zrobienia"}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </section>
    </div>
  );
}

export function AreasSheet({ open, onOpenChange, company }: { open: boolean; onOpenChange: (o: boolean) => void; company: Company }) {
  const desktop = useIsDesktop();
  const title = "Obszary księgowe";
  const description = `Mapa dostępnych obszarów księgowych dla aktywnej organizacji · ${company.shortName}`;
  if (!desktop)
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <DrawerBody>
            <AreasContent />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    );
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <p className="text-small text-ink-2">Ewidencje</p>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <SheetBody className="pt-4">
          <AreasContent />
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
