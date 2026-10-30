import { useInView } from 'framer-motion';
import { ReactNode, useRef } from 'react';

interface P {
  title: string;
  id: string;
  /** Beside the title: the choices of the section */
  actions?: ReactNode;
  /** Gets whether the section came near the screen, to load its data */
  children: (visible: boolean) => ReactNode;
}

/** A part of the page: it asks for its data once the user gets close. */
export function StatSection({ title, id, actions, children }: P) {
  const ref = useRef<HTMLElement>(null);
  const visible = useInView(ref, { once: true, margin: '300px' });
  return (
    <section
      ref={ref}
      id={id}
      aria-labelledby={`${id}-title`}
      className="space-y-3 scroll-mt-36"
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h2 id={`${id}-title`} className="text-lg font-semibold">
          {title}
        </h2>
        {actions}
      </div>
      {children(visible)}
    </section>
  );
}
