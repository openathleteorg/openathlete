import { splitLinks } from '@/utils/links';
import { cn } from '@/utils/shadcn';

import { splitImages } from '@openathlete/shared';

import { StoredImage } from './stored-image';

interface P {
  text: string;
  className?: string;
  /** Link colour inside a coloured bubble */
  linkClassName?: string;
}

/** Plain text with its links clickable and its images shown */
export function RichText({ text, className, linkClassName }: P) {
  return (
    <div className={cn('whitespace-pre-wrap break-words', className)}>
      {splitImages(text).map((part, index) =>
        part.type === 'image' ? (
          <StoredImage key={index} fileId={part.fileId} className="my-1" />
        ) : (
          splitLinks(part.value).map((piece, pieceIndex) =>
            piece.type === 'link' ? (
              <a
                key={`${index}-${pieceIndex}`}
                href={piece.href}
                target="_blank"
                rel="noreferrer noopener"
                className={cn(
                  'break-all underline underline-offset-2',
                  linkClassName ?? 'text-primary',
                )}
              >
                {piece.value}
              </a>
            ) : (
              <span key={`${index}-${pieceIndex}`}>{piece.value}</span>
            ),
          )
        ),
      )}
    </div>
  );
}
