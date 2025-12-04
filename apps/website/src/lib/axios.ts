import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const routes = {
  betaAccess: {
    request: '/beta-access',
  },
  newsletter: {
    subscribe: '/newsletter/subscribe',
  },
} as const;

export type Routes = typeof routes;

const client = axios.create({
  baseURL: API_BASE_URL,
});

export default client;
