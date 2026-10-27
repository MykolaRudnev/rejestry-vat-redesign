"use client";
import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Drawer, DrawerBody, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useIsDesktop } from "@/hooks/use-media-query";
import { documentsCount, jpkCodeOptions } from "@/lib/labels";

const groups = [
  { title: "Grupy towarów i usług (GTU)", codes: jpkCodeOptions.gtu },
  { title: "Procedury", codes: jpkCodeOptions.procedures },
];

/** "Oznacz kodami JPK" [B9] — adds GTU / procedure markers to the selected documents. */
export function JpkCodesSheet({
  open,
  onOpenChange,
  count,
  onApply,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  count: number;
  onApply: (codes: string[]) => Promise<void>;
}) {
  const desktop = useIsDesktop();
  const [codes, setCodes] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const title = "Oznacz kodami JPK";
  const description = `Dodaj oznaczenia JPK_V7 do ${documentsCount(count)}. Istniejące oznaczenia zostaną zachowane.`;
  const body = (
    <div className="flex flex-col gap-6">
      {groups.map((g) => (
        <fieldset key={g.title} className="flex flex-col gap-2.5">
          <legend className="pb-2.5 text-small font-medium text-ink-2">{g.title}</legend>
          <div className="flex flex-wrap gap-1.5">
            {g.codes.map((c) => {
              const on = codes.includes(c);
              return (
                <Toggle key={c} pressed={on} onPressedChange={() => setCodes(on ? codes.filter((x) => x !== c) : [...codes, c])}>
                  {on && <Check />}
                  {c.replace("_", " ")}
                </Toggle>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
  const apply = async () => {
    setBusy(true);
    await onApply(codes);
    setBusy(false);
    setCodes([]);
    onOpenChange(false);
  };
  const footer = (
    <>
      <Button onClick={() => onOpenChange(false)}>Anuluj</Button>
      <Button variant="primary" disabled={!codes.length} loading={busy} onClick={apply}>
        {busy ? "Zapisywanie…" : `Oznacz ${documentsCount(count)}`}
      </Button>
    </>
  );
  if (!desktop)
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <DrawerBody>{body}</DrawerBody>
          <DrawerFooter className="flex-row *:flex-1">{footer}</DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <SheetBody>{body}</SheetBody>
        <SheetFooter>{footer}</SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
