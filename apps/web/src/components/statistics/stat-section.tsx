import { m } from '@/paraglide/messages';
import { useInView } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { ReactNode, useRef, useState } from 'react';

interface P {
  title: string;
  id: string;
  /** Beside the title: the choices of the section */
  actions?: ReactNode;
  /** A tab above already names it: the title stays for screen readers */
  plain?: boolean;
  /** Gets whether the section came near the screen, to load its data */
  children: (visible: boolean) => ReactNode;
}

/** A part of the page: it asks for its data once the user gets close. */
export function StatSection({ title, id, actions, plain, children }: P) {
  const ref = useRef<HTMLElement>(null);
  const visible = useInView(ref, { once: true, margin: '300px' });
  const [open, setOpen] = useState(true);
  return (
    <section
      ref={ref}
      id={id}
      aria-labelledby={`${id}-title`}
      className="space-y-3 scroll-mt-36"
    >
      {plain && (
        <h2 id={`${id}-title`} className="sr-only">
          {title}
        </h2>
      )}
      <div
        className={
          plain
            ? 'hidden'
            : 'flex flex-col gap-2 md:flex-row md:items-center md:justify-between'
        }
      >
        <button
          type="button"
          aria-expanded={open}
          aria-label={
            open
              ? m.statistics_collapse({ section: title })
              : m.statistics_expand({ section: title })
          }
          onClick={() => setOpen(!open)}
          className="flex min-h-11 items-center gap-1 text-left md:min-h-0"
        >
          <ChevronDown
            className={`size-4 text-muted-foreground transition-transform ${open ? '' : '-rotate-90'}`}
          />
          {!plain && (
            <h2 id={`${id}-title`} className="text-lg font-semibold">
              {title}
            </h2>
          )}
        </button>
        {open && actions}
      </div>
      {open && children(visible)}
    </section>
  );
}
