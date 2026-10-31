export const ACCESS_TOKEN = 'access_token';
export const REFRESH_TOKEN = 'refresh_token';
export const CALENDAR_COLORED_BY = 'calendar_colored_by';
export const SIDEBAR_OPEN_STATES = 'sidebar_open_states';
export const CURRENT_SPACE = 'current_space';
export const MOBILE_SERVER_URL = 'openathlete_mobile_server_url';
export const PUSH_PROMPT_DISMISSED = 'openathlete_push_prompt_dismissed';
export const SUPPORT_REMINDER_DISMISSED =
  'openathlete_support_reminder_dismissed';
export const FIRST_SEEN_AT = 'openathlete_first_seen_at';
export const METRICS_PINNED = 'openathlete_metrics_pinned';

export const getItem = (key: string) => localStorage.getItem(key);
export const setItem = (key: string, value: string) =>
  localStorage.setItem(key, value);
export const removeItem = (key: string) => localStorage.removeItem(key);

// Signing out keeps what belongs to the device rather than the session: the
// server it talks to, and the support reminder's state
const KEPT_ON_CLEAR = [
  MOBILE_SERVER_URL,
  SUPPORT_REMINDER_DISMISSED,
  FIRST_SEEN_AT,
];

export const clear = () => {
  const kept = KEPT_ON_CLEAR.flatMap((key) => {
    const value = localStorage.getItem(key);
    return value === null ? [] : [{ key, value }];
  });
  localStorage.clear();
  for (const { key, value } of kept) localStorage.setItem(key, value);
};
