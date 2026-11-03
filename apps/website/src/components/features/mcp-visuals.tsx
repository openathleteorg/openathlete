import { cn } from '@/utils/shadcn';
import { Check, Sparkles, Wrench } from 'lucide-react';

/** A conversation in an MCP client, with the tool calls it triggered. */
export function McpChat({
  client,
  prompt,
  calls,
  reply,
  className,
}: {
  client: string;
  prompt: string;
  calls: Array<{ tool: string; detail: string }>;
  reply: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-3xl border border-white/10 bg-[#030824] shadow-[0_40px_80px_-30px_rgb(5_12_52/0.7)]',
        className,
      )}
    >
      <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-3">
        <span className="size-2.5 rounded-full bg-coral/80" />
        <span className="size-2.5 rounded-full bg-[#f2b13c]/80" />
        <span className="size-2.5 rounded-full bg-mint/70" />
        <span className="ml-3 font-mono text-[0.72rem] text-white/45">
          {client}
        </span>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 p-4 sm:p-6">
        <p className="ml-auto max-w-[88%] rounded-2xl rounded-br-md bg-white/10 px-4 py-3 text-[0.92rem] text-white">
          {prompt}
        </p>
        <ul className="flex flex-col gap-1.5">
          {calls.map((call) => (
            <li
              key={call.tool + call.detail}
              className="flex items-center gap-2.5 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2 font-mono text-[0.72rem]"
            >
              <Wrench className="size-3.5 shrink-0 text-ink-soft" />
              <span className="text-sky">{call.tool}</span>
              <span className="min-w-0 truncate text-white/45">
                {call.detail}
              </span>
              <Check className="ml-auto size-3.5 shrink-0 text-mint" />
            </li>
          ))}
        </ul>
        <div className="flex min-w-0 gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-sky via-orchid to-coral text-ink">
            <Sparkles className="size-4" />
          </span>
          <p className="min-w-0 rounded-2xl rounded-tl-md border border-white/10 bg-white/[0.04] px-4 py-3 text-[0.92rem] leading-relaxed text-white/85">
            {reply}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ToolList({
  title,
  badge,
  rows,
  tone,
}: {
  title: string;
  badge: string;
  rows: Array<{ tools: string[]; body: string }>;
  tone: 'read' | 'write';
}) {
  return (
    <div className="rounded-3xl border border-border bg-white">
      <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
        <h3 className="font-semibold">{title}</h3>
        <span
          className={cn(
            'rounded-full px-2.5 py-1 font-mono text-[0.7rem] font-medium',
            tone === 'read'
              ? 'bg-sky/15 text-sky-strong'
              : 'bg-coral/15 text-coral-strong',
          )}
        >
          {badge}
        </span>
      </div>
      <ul className="divide-y divide-border">
        {rows.map((row) => (
          <li key={row.tools.join()} className="px-5 py-3.5 sm:px-6">
            <p className="flex flex-wrap gap-1.5">
              {row.tools.map((tool) => (
                <code
                  key={tool}
                  className="rounded-md bg-paper px-1.5 py-0.5 font-mono text-[0.75rem] text-ink"
                >
                  {tool}
                </code>
              ))}
            </p>
            <p className="mt-1.5 text-[0.88rem] leading-snug text-muted-foreground">
              {row.body}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
