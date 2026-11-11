import { StoredImage } from '@/components/images';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { Textarea } from '@/components/ui/textarea';
import { useImageUpload } from '@/hooks/use-image-upload';
import { m } from '@/paraglide/messages';
import { imageFiles } from '@/utils/image-resize';
import { ImagePlus, Send, X } from 'lucide-react';
import {
  type ClipboardEvent,
  KeyboardEvent,
  useCallback,
  useRef,
  useState,
} from 'react';

import { STORED_FILE_PURPOSE, imageRef } from '@openathlete/shared';

interface ChatInputProps {
  threadId: number;
  onSendMessage: (content: string) => void;
  isStreaming: boolean;
  /** Pictures can be attached, for the conversation's participants */
  allowImages?: boolean;
}

export function ChatInput({
  threadId,
  onSendMessage,
  isStreaming,
  allowImages = false,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    enabled: imagesEnabled,
    upload,
    isUploading,
  } = useImageUpload(STORED_FILE_PURPOSE.MESSAGE, threadId);
  const canAttach = allowImages && imagesEnabled;

  const attach = useCallback(
    async (files: File[]) => {
      const ids = await upload(files);
      setImages((current) => [...current, ...ids]);
    },
    [upload],
  );

  const handleSubmit = useCallback(async () => {
    const trimmedMessage = message.trim();
    if ((!trimmedMessage && images.length === 0) || isStreaming || isUploading)
      return;

    setMessage('');
    setImages([]);

    // The images follow the text, each on its line
    onSendMessage(
      [trimmedMessage, ...images.map(imageRef)].filter(Boolean).join('\n'),
    );
  }, [message, images, isStreaming, isUploading, onSendMessage]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const files = imageFiles(e.clipboardData.files);
    if (!canAttach || files.length === 0) return;
    e.preventDefault();
    void attach(files);
  };

  const canSend =
    (message.trim().length > 0 || images.length > 0) &&
    !isStreaming &&
    !isUploading;

  return (
    <div className="space-y-2">
      {(images.length > 0 || isUploading) && (
        <ul className="flex flex-wrap gap-2">
          {images.map((fileId) => (
            <li key={fileId} className="relative">
              <StoredImage
                fileId={fileId}
                zoomable={false}
                className="h-16 w-16 max-h-16 object-cover"
              />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={() =>
                  setImages((current) => current.filter((id) => id !== fileId))
                }
                aria-label={m.image_remove()}
                className="absolute -top-2 -right-2 size-7 rounded-full"
              >
                <X className="size-3.5" />
              </Button>
            </li>
          ))}
          {isUploading && (
            <li className="flex h-16 w-16 items-center justify-center rounded-md border">
              <Loader size="sm" />
            </li>
          )}
        </ul>
      )}
      <div className="flex gap-2 items-end">
        {canAttach && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                void attach(imageFiles(e.target.files));
                e.target.value = '';
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              aria-label={m.image_add()}
              title={m.image_add()}
              className="h-[60px] w-11 flex-shrink-0"
            >
              <ImagePlus className="h-5 w-5" />
            </Button>
          </>
        )}
        <Textarea
          value={message}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setMessage(e.target.value)
          }
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={m.chatbot_write_message()}
          className="min-h-[60px] max-h-[120px] resize-none"
          disabled={isStreaming}
        />
        <Button
          onClick={handleSubmit}
          disabled={!canSend}
          size="icon"
          aria-label={m.event_comments_send()}
          className="h-[60px] w-[60px] flex-shrink-0"
        >
          {isStreaming ? <Loader size="sm" /> : <Send className="h-5 w-5" />}
        </Button>
      </div>
    </div>
  );
}
