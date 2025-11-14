import { getPath } from './routes/paths';
import { getApiBaseUrl } from './utils/capacitor';

export const API_BASE_URL = getApiBaseUrl();
export const PATH_AFTER_LOGIN = getPath(['dashboard']);
