import { Button } from '@/components/ui/button';
import { m } from '@/paraglide/messages';
import { CloudOff } from 'lucide-react';
import { useState } from 'react';

interface P {
  onRetry: () => Promise<void>;
}

/**
 * Shown when the API does not confirm the session at start: no answer, a
 * rate limit or a server error. Part of the main bundle, so it renders
 * offline even where the pages' own code was never cached.
 */
export function OfflineScreen({ onRetry }: P) {
  const [retrying, setRetrying] = useState(false);
  const retry = async () => {
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };
  return (
    <div
      role="alert"
      className="flex h-screen flex-col items-center justify-center gap-4 px-4 text-center"
    >
      <CloudOff className="size-10 text-muted-foreground" aria-hidden />
      <h1 className="text-xl font-semibold">{m.offline_title()}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        {m.offline_description()}
      </p>
      <Button
        className="min-h-11"
        isLoading={retrying}
        onClick={() => void retry()}
      >
        {m.offline_retry()}
      </Button>
    </div>
  );
}
