import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { Textarea } from '@/components/ui/textarea';
import { useImageUpload } from '@/hooks/use-image-upload';
import { m } from '@/paraglide/messages';
import { imageFiles } from '@/utils/image-resize';
import { cn } from '@/utils/shadcn';
import { ImagePlus, X } from 'lucide-react';
import {
  type ClipboardEvent,
  type ComponentProps,
  type DragEvent,
  useRef,
} from 'react';

import {
  type STORED_FILE_PURPOSE,
  imageIdsIn,
  imageRef,
} from '@openathlete/shared';

import { StoredImage } from './stored-image';

type P = Omit<ComponentProps<typeof Textarea>, 'value' | 'onChange'> & {
  value: string;
  onChange: (value: string) => void;
  purpose: STORED_FILE_PURPOSE;
  messageThreadId?: number;
};

/**
 * A text field where pictures can be pasted, dropped or picked: each one
 * is uploaded and lands where the cursor is, shown under the field.
 */
export function ImageTextarea({
  value,
  onChange,
  purpose,
  messageThreadId,
  className,
  ...props
}: P) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { enabled, upload, isUploading } = useImageUpload(
    purpose,
    messageThreadId,
  );
  // The latest text, for uploads that end after more typing
  const valueRef = useRef(value);
  valueRef.current = value;

  const insert = async (files: File[]) => {
    if (!enabled || files.length === 0) return;
    const cursor = textareaRef.current?.selectionEnd ?? valueRef.current.length;
    const ids = await upload(files);
    if (ids.length === 0) return;
    const current = valueRef.current;
    const at = Math.min(cursor, current.length);
    const before = current.slice(0, at);
    const after = current.slice(at);
    const block = ids.map(imageRef).join('\n');
    onChange(
      `${before}${before && !before.endsWith('\n') ? '\n' : ''}${block}${
        after.startsWith('\n') ? '' : '\n'
      }${after}`,
    );
  };

  const onPaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const files = imageFiles(event.clipboardData.files);
    if (!enabled || files.length === 0) return;
    event.preventDefault();
    void insert(files);
  };

  const onDrop = (event: DragEvent<HTMLTextAreaElement>) => {
    const files = imageFiles(event.dataTransfer.files);
    if (!enabled || files.length === 0) return;
    event.preventDefault();
    void insert(files);
  };

  const remove = (fileId: string) =>
    onChange(
      value
        .split(imageRef(fileId))
        .join('')
        .replace(/\n{3,}/g, '\n\n'),
    );

  const images = imageIdsIn(value);

  return (
    <div className="space-y-2">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onPaste={onPaste}
        onDrop={onDrop}
        className={className}
        {...props}
      />
      {enabled && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(event) => {
              void insert(imageFiles(event.target.files));
              event.target.value = '';
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader size="sm" />
            ) : (
              <ImagePlus className="size-4" />
            )}
            {m.image_add()}
          </Button>
          <span className="text-xs text-muted-foreground">
            {m.image_paste_hint()}
          </span>
        </div>
      )}
      {images.length > 0 && (
        <ul className={cn('flex flex-wrap gap-2')}>
          {images.map((fileId) => (
            <li key={fileId} className="relative">
              <StoredImage
                fileId={fileId}
                zoomable={false}
                className="h-20 w-20 max-h-20 object-cover"
              />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={() => remove(fileId)}
                aria-label={m.image_remove()}
                className="absolute -top-2 -right-2 size-7 rounded-full"
              >
                <X className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
