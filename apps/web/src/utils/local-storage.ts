export const ACCESS_TOKEN = 'access_token';
export const REFRESH_TOKEN = 'refresh_token';
/**
 * Names the login that owns the session. Credentials live in that owner's
 * record, never in this shared key: a late refresh must not be able to write
 * over the owner that replaced it.
 */
export const AUTH_SESSION = 'auth_session';
/** The credential record of one owner, addressed by its opaque owner ID. */
export const AUTH_RECORD_PREFIX = 'auth_record:';
/** Tombstone for an owner that signed out; it never moves or clears. */
export const AUTH_REVOKED_PREFIX = 'auth_revoked:';
/** Last login attempt allowed to commit. Non-secret. */
export const AUTH_LOGIN_ATTEMPT = 'auth_login_attempt';
export const SIDEBAR_OPEN_STATES = 'sidebar_open_states';
export const CURRENT_SPACE = 'current_space';
export const MOBILE_SERVER_URL = 'openathlete_mobile_server_url';
export const PUSH_PROMPT_DISMISSED = 'openathlete_push_prompt_dismissed';

export const getItem = (key: string) => localStorage.getItem(key);
export const setItem = (key: string, value: string) =>
  localStorage.setItem(key, value);
export const removeItem = (key: string) => localStorage.removeItem(key);

/**
 * What a signed-in account may have left on this device. Sign-out removes this
 * list and nothing else: enumerating or clearing the whole store would delete
 * a successor login that another tab committed meanwhile. Auth keys, the
 * selected server and unknown keys are deliberately absent.
 */
const SIGNED_IN_DEVICE_KEYS = [
  SIDEBAR_OPEN_STATES,
  CURRENT_SPACE,
  PUSH_PROMPT_DISMISSED,
  'chatbot-bubble-position',
  'chatbot-chat-width',
  'chatbot-chat-side',
  'chatbot-active-thread-id',
  'chatbot-conversations',
  'chatbot-active-conversation-id',
  'openathlete_recent_exercises',
  'openathlete_onboarding_v2',
  'openathlete_onboarding_import_requested',
] as const;

export const clear = () => {
  for (const key of SIGNED_IN_DEVICE_KEYS) localStorage.removeItem(key);
};
