interface P {
  value: string | number;
  label: string;
}
export function StatBlock({ value, label }: P) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/2.5 px-4 py-5 text-center">
      <div className="text-2xl font-semibold text-[var(--oa-fg)] tracking-tight">
        {value}
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-wider text-[var(--oa-muted)] font-medium">
        {label}
      </div>
    </div>
  );
}
