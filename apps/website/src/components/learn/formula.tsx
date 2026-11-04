import type { ReactNode } from 'react';

/**
 * A formula on its own line, in the glossary bodies. `where` lists the
 * symbols underneath, one per line.
 */
export function Formula({
  children,
  where,
}: {
  children: ReactNode;
  where?: ReactNode[];
}) {
  return (
    <div className="not-prose my-7 overflow-x-auto rounded-xl border border-border bg-paper px-5 py-4">
      <p className="font-mono text-[0.95rem] leading-relaxed text-ink sm:text-[0.98rem] sm:whitespace-nowrap">
        {children}
      </p>
      {where && where.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-border pt-3 text-[0.9rem] leading-relaxed text-muted-foreground">
          {where.map((line, index) => (
            <li key={index}>{line}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
