import { useGetUserThreadsQuery } from '@/api/messages';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import {
  MessageSearchTarget,
  searchThreadMessages,
} from '@/utils/message-search';
import { Search } from 'lucide-react';
import { useId, useMemo, useRef, useState } from 'react';

import { withImagesAsLabel } from '@openathlete/shared';

export function MessageSearch({
  activeThreadId,
  onSelect,
}: {
  activeThreadId?: number | null;
  onSelect: (target: MessageSearchTarget) => void;
}) {
  const pendingTarget = useRef<MessageSearchTarget | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<'current' | 'all'>('all');
  const [visibleCount, setVisibleCount] = useState(50);
  const inputId = useId();
  const {
    data: threads,
    isLoading,
    isError,
    refetch,
  } = useGetUserThreadsQuery({ enabled: open });
  const results = useMemo(
    () =>
      searchThreadMessages(
        threads ?? [],
        query,
        scope === 'current' ? (activeThreadId ?? undefined) : undefined,
      ),
    [threads, query, scope, activeThreadId],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (value) {
          setQuery('');
          setScope(activeThreadId ? 'current' : 'all');
          setVisibleCount(50);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          aria-label={m.messages_search_title()}
          title={m.messages_search_title()}
        >
          <Search className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-2xl flex flex-col overflow-hidden"
        onCloseAutoFocus={(event) => {
          if (pendingTarget.current) {
            event.preventDefault();
            onSelect(pendingTarget.current);
            pendingTarget.current = null;
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{m.messages_search_title()}</DialogTitle>
          <DialogDescription>
            {m.messages_search_description()}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 shrink-0">
          <label htmlFor={inputId} className="sr-only">
            {m.messages_search_placeholder()}
          </label>
          <Input
            id={inputId}
            type="search"
            maxLength={200}
            value={query}
            placeholder={m.messages_search_placeholder()}
            onChange={(event) => {
              setQuery(event.target.value);
              setVisibleCount(50);
            }}
          />
          <div
            role="group"
            aria-label={m.messages_search_scope()}
            className="flex flex-wrap gap-2"
          >
            <Button
              variant={scope === 'current' ? 'default' : 'outline'}
              size="sm"
              aria-pressed={scope === 'current'}
              disabled={!activeThreadId}
              onClick={() => {
                setScope('current');
                setVisibleCount(50);
              }}
            >
              {m.messages_search_current()}
            </Button>
            <Button
              variant={scope === 'all' ? 'default' : 'outline'}
              size="sm"
              aria-pressed={scope === 'all'}
              onClick={() => {
                setScope('all');
                setVisibleCount(50);
              }}
            >
              {m.messages_search_all()}
            </Button>
          </div>
        </div>
        <div
          className="min-h-0 overflow-y-auto space-y-2"
          aria-busy={isLoading}
        >
          {isLoading ? (
            <p role="status">{m.loading()}</p>
          ) : isError ? (
            <div role="alert" className="space-y-2">
              <p>{m.messages_search_error()}</p>
              <Button variant="outline" onClick={() => void refetch()}>
                {m.messages_search_retry()}
              </Button>
            </div>
          ) : !query.trim() ? (
            <p className="text-sm text-muted-foreground">
              {m.messages_search_hint()}
            </p>
          ) : (
            <>
              <p role="status" className="text-sm text-muted-foreground">
                {results.length
                  ? m.messages_search_count({ count: results.length })
                  : m.messages_search_empty()}
              </p>
              <ul className="space-y-2">
                {results.slice(0, visibleCount).map(({ thread, message }) => (
                  <li key={message.messageId}>
                    <button
                      type="button"
                      className="w-full rounded-md border p-3 text-left hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring break-words"
                      onClick={() => {
                        pendingTarget.current = {
                          messageThreadId: thread.messageThreadId,
                          messageId: message.messageId,
                        };
                        setOpen(false);
                      }}
                    >
                      <span className="block text-sm font-semibold">
                        {thread.title ||
                          m.message_thread_title({
                            id: thread.messageThreadId,
                          })}
                      </span>
                      <span className="block text-xs text-muted-foreground mb-1">
                        {[message.sender?.firstName, message.sender?.lastName]
                          .filter(Boolean)
                          .join(' ')}{' '}
                        ·{' '}
                        {new Date(message.createdAt).toLocaleString(
                          getLocale(),
                        )}
                      </span>
                      <span className="block text-sm whitespace-pre-wrap line-clamp-3">
                        {withImagesAsLabel(message.content, '📷')}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {results.length > visibleCount && (
                <Button
                  variant="outline"
                  onClick={() => setVisibleCount((count) => count + 50)}
                >
                  {m.messages_search_more()}
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
