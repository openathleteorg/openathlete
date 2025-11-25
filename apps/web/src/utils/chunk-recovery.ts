const CHUNK_ERROR_PATTERNS = [
  /Loading chunk [\w-]+ failed/i,
  /ChunkLoadError/i,
  /Failed to load (?:dynamically )?imported module/i,
  /Failed to fetch dynamically imported module/i,
];

const ASSET_RELOAD_KEY = '__openathlete_last_chunk_reload__';
const RELOAD_COOLDOWN_MS = 10_000;

const markReload = () => {
  sessionStorage.setItem(ASSET_RELOAD_KEY, String(Date.now()));
};

const canReload = () => {
  const lastReload = Number(sessionStorage.getItem(ASSET_RELOAD_KEY) ?? '0');
  return Date.now() - lastReload > RELOAD_COOLDOWN_MS;
};

const extractMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }

  return '';
};

const isChunkLoadErrorMessage = (message: string) =>
  Boolean(message) &&
  CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(message));

const isAssetLoadEvent = (event: Event) => {
  const target = event.target;
  if (target instanceof HTMLScriptElement) {
    return target.src.includes('/assets/');
  }

  if (target instanceof HTMLLinkElement && target.rel === 'modulepreload') {
    return target.href.includes('/assets/');
  }

  return false;
};

const reloadPage = () => {
  if (!canReload()) {
    return;
  }

  markReload();
  window.location.reload();
};

const handleErrorEvent = (event: Event | ErrorEvent) => {
  if (event instanceof ErrorEvent) {
    if (isChunkLoadErrorMessage(extractMessage(event.error ?? event.message))) {
      event.preventDefault();
      reloadPage();
    }
    return;
  }

  if (isAssetLoadEvent(event)) {
    event.preventDefault();
    reloadPage();
  }
};

const handlePromiseRejection = (event: PromiseRejectionEvent) => {
  if (isChunkLoadErrorMessage(extractMessage(event.reason))) {
    event.preventDefault();
    reloadPage();
  }
};

const handleVitePreloadError: EventListener = (event) => {
  event.preventDefault();
  reloadPage();
};

export const initChunkLoadRecovery = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.addEventListener('error', handleErrorEvent);
  window.addEventListener('unhandledrejection', handlePromiseRejection);
  window.addEventListener('vite:preloadError', handleVitePreloadError);
};
