import { cn } from '@/utils/shadcn';
import Image, { type StaticImageData } from 'next/image';

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
  imageSrc?: string | StaticImageData;
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
      <div
        className={cn(
          'w-full rounded-xl border shadow-lg overflow-hidden',
          className,
        )}
        style={{ aspectRatio }}
      >
        <Image
          src={imageSrc}
          alt={imageAlt || description}
          className="w-full h-full object-cover"
          width={1200}
          height={675}
        />
      </div>
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
