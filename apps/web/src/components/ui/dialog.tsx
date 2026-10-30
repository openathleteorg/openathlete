import { useIsMobile } from '@/hooks/use-mobile';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { XIcon } from 'lucide-react';
import * as React from 'react';

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50',
        className,
      )}
      {...props}
    />
  );
}

/** Dragged further than this, or flicked, a sheet closes. */
const SHEET_DISMISS_DISTANCE = 110;
const SHEET_DISMISS_VELOCITY = 0.6;

/**
 * Drag handle of a bottom sheet. The sheet follows the finger directly,
 * outside React, and the close button runs the dialog's own closing.
 */
function SheetGrabber({
  closeRef,
}: {
  closeRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const drag = React.useRef<{ y: number; time: number } | null>(null);
  const sheetOf = (element: HTMLElement) =>
    element.closest<HTMLElement>('[data-slot="dialog-content"]');

  return (
    <div
      data-sheet-grabber
      aria-hidden
      className="sticky -top-4 z-20 -mx-4 -mt-4 flex h-6 shrink-0 touch-none items-center justify-center rounded-t-3xl bg-background"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { y: event.clientY, time: event.timeStamp };
      }}
      onPointerMove={(event) => {
        const sheet = sheetOf(event.currentTarget);
        if (!drag.current || !sheet) return;
        const distance = Math.max(0, event.clientY - drag.current.y);
        sheet.style.transition = 'none';
        sheet.style.transform = `translateY(${distance}px)`;
      }}
      onPointerUp={(event) => {
        const sheet = sheetOf(event.currentTarget);
        if (!drag.current || !sheet) return;
        const distance = event.clientY - drag.current.y;
        const velocity =
          distance / Math.max(1, event.timeStamp - drag.current.time);
        drag.current = null;
        sheet.style.transition = 'transform 0.2s ease-out';
        if (
          distance > SHEET_DISMISS_DISTANCE ||
          velocity > SHEET_DISMISS_VELOCITY
        ) {
          sheet.style.transform = 'translateY(100%)';
          window.setTimeout(() => closeRef.current?.click(), 180);
        } else {
          sheet.style.transform = '';
        }
      }}
    >
      <span className="h-1 w-9 rounded-full bg-muted-foreground/30" />
    </div>
  );
}

function DialogContent({
  className,
  children,
  mobileFullscreen = false,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  mobileFullscreen?: boolean;
}) {
  const isMobile = useIsMobile();
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const sheet = !isMobile ? undefined : mobileFullscreen ? 'full' : 'bottom';
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        data-sheet={sheet}
        className={cn(
          'bg-background fixed z-50 grid w-full gap-4 border shadow-lg overflow-y-auto',
          !sheet &&
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200 top-[50%] left-[50%] max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] rounded-lg p-6 sm:max-w-lg',
          className,
          // After className: a dialog's desktop width means nothing on a phone
          sheet === 'bottom' &&
            '!inset-x-0 !top-auto !bottom-0 !w-full !max-w-none !translate-x-0 !translate-y-0 max-h-[92dvh] overscroll-contain rounded-t-3xl border-x-0 border-b-0 p-4 pb-[calc(1rem+var(--safe-bottom))]',
          sheet === 'full' &&
            '!inset-0 !h-dvh !max-h-none !w-full !max-w-none !translate-x-0 !translate-y-0 content-start overscroll-contain rounded-none border-0 p-4 pt-[calc(1rem+var(--safe-top))] pb-[calc(1rem+var(--safe-bottom))]',
        )}
        style={sheet ? undefined : { maxHeight: 'calc(100vh - 40px)' }}
        {...props}
      >
        {sheet === 'bottom' && <SheetGrabber closeRef={closeRef} />}
        {children}
        <DialogPrimitive.Close
          ref={closeRef}
          className={cn(
            'ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute z-10 transition-opacity focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0',
            sheet
              ? "flex size-11 items-center justify-center rounded-full text-muted-foreground [&_svg:not([class*='size-'])]:size-5"
              : "top-4 right-4 rounded-xs opacity-70 hover:opacity-100 [&_svg:not([class*='size-'])]:size-4",
            sheet === 'bottom' && 'top-2 right-2',
            sheet === 'full' && 'top-[calc(0.25rem+var(--safe-top))] right-1',
          )}
        >
          <XIcon />
          <span className="sr-only">{m.ui_close()} </span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        'flex flex-col gap-2 pr-8 text-left pb-2 md:pr-0 md:pb-0',
        className,
      )}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end max-md:[&_button]:h-12 max-md:[&_button]:text-base',
        className,
      )}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        'text-base md:text-lg leading-none font-semibold',
        className,
      )}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
