import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { Copy } from 'lucide-react';
import { ComponentProps, ReactNode } from 'react';

type SettingsSectionProps = {
  /** Left out when the page title already names the only section */
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  children?: ReactNode;
};

/**
 * A heading above its content, on the page itself: the only surface below it
 * is a SettingsPanel, so settings never stack a card in a card.
 */
export function SettingsSection({
  title,
  description,
  action,
  className,
  children,
}: SettingsSectionProps) {
  return (
    <section className={cn('space-y-3', className)}>
      <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
        {title ? (
          <div className="min-w-0 space-y-0.5">
            <h2 className="text-base font-semibold tracking-tight">{title}</h2>
            {description ? (
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
        ) : null}
        {action ? (
          <div className="flex shrink-0 items-center sm:ml-auto [&>button]:max-sm:w-full">
            {action}
          </div>
        ) : null}
      </div>
      {children}
    </section>
  );
}

/** Rows or a form, framed like the groups of the Me tab. */
export function SettingsPanel({
  padded,
  className,
  ...props
}: ComponentProps<'div'> & { padded?: boolean }) {
  return (
    <div
      className={cn(
        'divide-y overflow-hidden rounded-2xl border bg-card',
        padded && 'p-4 md:p-5',
        className,
      )}
      {...props}
    />
  );
}

type SettingsRowProps = Omit<ComponentProps<'div'>, 'title'> & {
  title?: ReactNode;
  description?: ReactNode;
  leading?: ReactNode;
  /** Long text leaves its control no room on a phone: put it below */
  stacked?: boolean;
  /** What the row controls: a switch, a value, a button */
  children?: ReactNode;
};

export function SettingsRow({
  title,
  description,
  leading,
  stacked,
  className,
  children,
  ...props
}: SettingsRowProps) {
  return (
    <div
      className={cn(
        'flex min-h-14 gap-3 px-4 py-3',
        stacked
          ? 'flex-col sm:flex-row sm:items-center sm:justify-between'
          : 'items-center justify-between',
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {leading ? (
          <div className="flex shrink-0 items-center justify-center text-muted-foreground">
            {leading}
          </div>
        ) : null}
        <div className="min-w-0 space-y-0.5">
          {title ? (
            <div className="text-sm font-medium break-words">{title}</div>
          ) : null}
          {description ? (
            <div className="text-sm break-words text-muted-foreground">
              {description}
            </div>
          ) : null}
        </div>
      </div>
      {children ? (
        <div className="flex shrink-0 items-center gap-2">{children}</div>
      ) : null}
    </div>
  );
}

/** What a panel says while it has nothing to list. */
export function SettingsEmpty({ children }: { children: ReactNode }) {
  return (
    <SettingsPanel>
      <p className="px-4 py-6 text-center text-sm text-muted-foreground">
        {children}
      </p>
    </SettingsPanel>
  );
}

export function SettingsRowsSkeleton({ count = 2 }: { count?: number }) {
  return (
    <SettingsPanel>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="space-y-2 px-4 py-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-56 max-w-full" />
        </div>
      ))}
    </SettingsPanel>
  );
}

/** A value the user pastes elsewhere: a feed address, a server URL. */
export function SettingsCopyField({
  value,
  onCopy,
  className,
  ...props
}: Omit<ComponentProps<'div'>, 'onCopy'> & {
  value: string;
  onCopy: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div
        className={cn(
          'min-w-0 flex-1 rounded-md bg-muted px-3 py-2.5 font-mono text-sm break-all text-muted-foreground select-all',
          className,
        )}
        {...props}
      >
        {value}
      </div>
      <Button variant="outline" onClick={onCopy}>
        <Copy className="size-4" />
        {m.copy()}
      </Button>
    </div>
  );
}
