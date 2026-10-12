export const ACCESS_TOKEN = 'access_token';
export const REFRESH_TOKEN = 'refresh_token';
export const CALENDAR_COLORED_BY = 'calendar_colored_by';
export const SIDEBAR_OPEN_STATES = 'sidebar_open_states';
export const CURRENT_SPACE = 'current_space';
export const MOBILE_SERVER_URL = 'openathlete_mobile_server_url';

export const getItem = (key: string) => localStorage.getItem(key);
export const setItem = (key: string, value: string) =>
  localStorage.setItem(key, value);
export const removeItem = (key: string) => localStorage.removeItem(key);
export const clear = () => {
  const serverUrl = localStorage.getItem(MOBILE_SERVER_URL);
  localStorage.clear();
  if (serverUrl) localStorage.setItem(MOBILE_SERVER_URL, serverUrl);
};
