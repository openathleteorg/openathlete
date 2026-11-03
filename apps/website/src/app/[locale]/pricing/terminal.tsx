import { cn } from '@/utils/shadcn';

export const INSTALL_SCRIPT_URL =
  'https://raw.githubusercontent.com/openathleteorg/openathlete/main/scripts/install.sh';

/**
 * The install script and what it prints, trimmed: the containers of
 * docker-compose.yml with the HTTPS profile that `--domain` turns on.
 */
export function InstallTerminal({
  domain,
  className,
}: {
  domain: string;
  className?: string;
}) {
  const services = ['postgres', 'redis', 'api', 'web', 'caddy'];
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-white/10 bg-[#030824] font-mono text-[0.8rem] shadow-[0_40px_80px_-30px_rgb(0_0_0/0.6)]',
        className,
      )}
    >
      <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-3">
        <span className="size-2.5 rounded-full bg-coral/80" />
        <span className="size-2.5 rounded-full bg-[#f2b13c]/80" />
        <span className="size-2.5 rounded-full bg-mint/70" />
        <span className="ml-3 text-[0.72rem] text-white/40">~</span>
      </div>
      <pre className="overflow-x-auto p-5 leading-7 break-all whitespace-pre-wrap text-white/80">
        <code>
          <span className="text-white/40">$ </span>
          curl -fsSL {INSTALL_SCRIPT_URL}
          {' | sh -s -- --domain '}
          <span className="text-sky">{domain}</span>
          {'\n\n'}
          <span className="text-white/45">Created .env with new secrets.</span>
          {'\n'}
          {services.map((service) => (
            <span key={service}>
              <span className="text-mint">✔</span> {service.padEnd(10, ' ')}
              <span className="text-white/40">
                {service === 'caddy' ? 'HTTPS ready' : 'Started'}
              </span>
              {'\n'}
            </span>
          ))}
          {'\n'}
          <span className="text-sky">→</span> https://{domain}
        </code>
      </pre>
    </div>
  );
}
