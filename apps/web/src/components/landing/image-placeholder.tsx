import { cn } from '@/utils/shadcn';

interface ImagePlaceholderProps {
  /**
   * Description of what image should be produced for this slot
   */
  description: string;
  /**
   * Optional aspect ratio (default: '16/9')
   */
  aspectRatio?: string;
  /**
   * When image is ready, replace this component with: <img src="..." alt="..." className="..." />
   */
  imageSrc?: string;
  imageAlt?: string;
  className?: string;
}

export function ImagePlaceholder({
  description,
  aspectRatio = '16/9',
  imageSrc,
  imageAlt,
  className,
}: ImagePlaceholderProps) {
  if (imageSrc) {
    return (
      <img
        src={imageSrc}
        alt={imageAlt || description}
        className={cn(
          'w-full rounded-xl border shadow-lg object-cover',
          className,
        )}
        style={{ aspectRatio }}
      />
    );
  }

  return (
    <div
      className={cn(
        'w-full rounded-xl border bg-muted/30 shadow-lg flex items-center justify-center',
        className,
      )}
      style={{ aspectRatio }}
    >
      <div className="text-center p-8 max-w-md">
        <div className="text-muted-foreground text-sm font-medium mb-2">
          Image placeholder
        </div>
        <div className="text-muted-foreground/70 text-xs italic">
          {description}
        </div>
      </div>
    </div>
  );
}
