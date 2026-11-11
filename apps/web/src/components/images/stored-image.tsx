import { useImageUrl } from '@/api/stored-files';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { ImageOff } from 'lucide-react';
import { useState } from 'react';

interface P {
  fileId: string;
  className?: string;
  /** Opens the image full size on a tap (default) */
  zoomable?: boolean;
}

/** An image stored on the instance, loaded with the user's session */
export function StoredImage({ fileId, className, zoomable = true }: P) {
  const { url, isError } = useImageUrl(fileId);
  const [open, setOpen] = useState(false);

  if (isError) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-2 rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground',
          className,
        )}
      >
        <ImageOff className="size-4" />
        {m.image_unavailable()}
      </span>
    );
  }
  if (!url) {
    return <Skeleton className={cn('h-40 w-full max-w-sm', className)} />;
  }

  const image = (
    <img
      src={url}
      alt={m.image_alt()}
      className={cn('max-h-80 max-w-full rounded-md object-contain', className)}
    />
  );
  if (!zoomable) return image;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block cursor-zoom-in"
        aria-label={m.image_open()}
      >
        {image}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent mobileFullscreen className="sm:max-w-5xl">
          <DialogTitle className="sr-only">{m.image_alt()}</DialogTitle>
          <img
            src={url}
            alt={m.image_alt()}
            className="max-h-[85vh] w-full object-contain"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
