import { type LucideIcon } from 'lucide-react';

/** One way to get the app, with what can be done about it. */
export function InstallChannel({
  icon: Icon,
  name,
  description,
  children,
}: {
  icon: LucideIcon;
  name: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div data-install-channel className="flex items-center gap-3 py-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{name}</span>
        <span className="block text-sm text-muted-foreground">
          {description}
        </span>
      </span>
      {children}
    </div>
  );
}
