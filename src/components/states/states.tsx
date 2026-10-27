import type { ReactNode } from "react";
import { CloudOff, FileSearch, Inbox, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/** Register skeleton: shaped like the toolbar + rows (DS §8 Skeletons). Labels around it stay real text. */
export function LoadingState() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-col gap-4 pt-2">
      <span className="sr-only">Wczytywanie rejestru…</span>
      <div className="flex gap-2">
        <Skeleton className="h-(--control-h) flex-1 md:max-w-90" />
        <Skeleton className="h-(--control-h) w-24" />
      </div>
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="flex min-h-(--row-h) items-center gap-4">
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-3/5" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-3.5 w-20" />
        </div>
      ))}
    </div>
  );
}

/** Shared block for empty / no results / error (DS §8): left-aligned, one line icon, no illustration. */
function Block({ icon, title, children, actions, alert }: { icon: ReactNode; title: string; children: ReactNode; actions?: ReactNode; alert?: boolean }) {
  return (
    <div role={alert ? "alert" : undefined} className="flex flex-col items-start gap-3 py-8 md:py-12">
      <span className="text-ink-3 [&>svg]:size-10">{icon}</span>
      <h2 className="font-display text-display-3">{title}</h2>
      <div className="max-w-[56ch] text-body text-ink-2">{children}</div>
      {actions && <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({
  monthLocative,
  registerLocative,
  future,
  onAdd,
  onBack,
  backLabel,
  locked,
}: {
  monthLocative: string;
  /** e.g. "rejestrze VAT sprzedaży" */
  registerLocative: string;
  future: boolean;
  onAdd: () => void;
  onBack?: () => void;
  backLabel?: string;
  locked: boolean;
}) {
  if (future)
    return (
      <Block icon={<Inbox strokeWidth={1.5} />} title="Ten okres jeszcze się nie zaczął" actions={onBack && <Button variant="text" onClick={onBack}>{backLabel}</Button>}>
        Dokumenty z datą w {monthLocative} pojawią się tutaj.
      </Block>
    );
  return (
    <Block
      icon={<Inbox strokeWidth={1.5} />}
      title={`Brak dokumentów w ${monthLocative}`}
      actions={
        <>
          {!locked && (
            <Button variant="primary" onClick={onAdd}>
              <Plus /> Dodaj dokument
            </Button>
          )}
          {onBack && (
            <Button variant="text" onClick={onBack}>
              {backLabel}
            </Button>
          )}
        </>
      }
    >
      W {registerLocative} nie ma jeszcze żadnego dokumentu za ten okres.
    </Block>
  );
}

export function NoResultsState({ query, total, onClear }: { query: string; total: number; onClear: () => void }) {
  return (
    <Block icon={<FileSearch strokeWidth={1.5} />} title="Nic nie pasuje do filtrów" actions={<Button onClick={onClear}>Wyczyść filtry</Button>}>
      {query ? `Szukasz „${query}” wśród ${total} dokumentów z wybranymi filtrami.` : `Żaden z ${total} dokumentów nie spełnia wybranych filtrów.`}
    </Block>
  );
}

export function ErrorState({ code, onRetry, retrying }: { code?: string; onRetry: () => void; retrying?: boolean }) {
  return (
    <Block
      alert
      icon={<CloudOff strokeWidth={1.5} />}
      title="Nie udało się wczytać rejestru"
      actions={
        <>
          <Button variant="primary" loading={retrying} onClick={onRetry}>
            Spróbuj ponownie
          </Button>
          {code && <span className="text-small text-ink-3">Kod: {code}</span>}
        </>
      }
    >
      Sprawdź połączenie i spróbuj ponownie. Dane, które wpisałeś, są bezpieczne.
    </Block>
  );
}
