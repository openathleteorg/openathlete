import { API_BASE_URL } from '@/config';
import { getAccessToken } from '@/utils/auth';
import { QueryClient } from '@tanstack/react-query';
import axios, { isAxiosError } from 'axios';

import { ConnectorProvider, Event } from '@openathlete/shared';

import { ACCESS_TOKEN, REFRESH_TOKEN, setItem } from './local-storage';

export const routes = {
  auth: {
    login: '/auth/login',
    refreshToken: '/auth/refresh-token',
    emailExists: '/auth/email-exists',
  },
  user: {
    getMe: '/user/me',
    createAccount: '/user',
    updateAccount: '/user',
    passwordReset: '/user/password-reset',
    passwordResetRequest: '/user/password-reset/request',
  },
  event: {
    create: '/event',
    update: (eventId: Event['eventId']) => `/event/${eventId}`,
    getMyEvents: '/event',
    getEvent: (eventId: Event['eventId']) => `/event/${eventId}`,
    getEventStream: (eventId: Event['eventId']) => `/event/${eventId}/stream`,
    getEventWeather: (eventId: Event['eventId']) => `/event/${eventId}/weather`,
    getEventNormalization: (eventId: Event['eventId']) =>
      `/event/${eventId}/normalization`,
    deleteEvent: (eventId: Event['eventId']) => `/event/${eventId}`,
    setRelatedActivity: (
      eventId: Event['eventId'],
      activityId: Event['eventId'],
    ) => `/event/${eventId}/related-activity/${activityId}`,
    unsetRelatedActivity: (eventId: Event['eventId']) =>
      `/event/${eventId}/related-activity`,
    getMyIcalCalendarSecret: '/event/ical/secret',
  },
  eventTemplate: {
    getMyTemplates: '/event-template',
    create: '/event-template',
    delete: (eventTemplateId: Event['eventId']) =>
      `/event-template/${eventTemplateId}`,
  },
  record: {
    getMyRecords: '/record',
  },
  equipment: {
    getMyEquipment: '/equipment',
    createEquipment: '/equipment',
    updateEquipment: (equipmentId: number) => `/equipment/${equipmentId}`,
    deleteEquipment: (equipmentId: number) => `/equipment/${equipmentId}`,
  },
  connector: {
    getOAuthUri: (provider: ConnectorProvider) =>
      `/connector/${provider.toLowerCase()}/uri`,
    setOAuthToken: (provider: ConnectorProvider) =>
      `/connector/${provider.toLowerCase()}/token`,
  },
  athlete: {
    getMyAthlete: '/athlete/me',
    getCoachedAthletes: '/athlete/coached',
    getCoaches: '/athlete/coaches',
    inviteCoach: '/athlete/invite/coach',
    inviteAthlete: '/athlete/invite/athlete',
    removeAthlete: (athleteId: number) => `/athlete/${athleteId}`,
    removeCoach: (coachId: number) => `/athlete/coach/${coachId}`,
  },
  statistics: {
    getStatisticsForPeriod: (
      athleteId: number,
      startDate: string,
      endDate: string,
    ) => `/statistics?athleteId=${athleteId}&start=${startDate}&end=${endDate}`,
  },
  marketing: {
    contact: '/contact',
  },
  cycle: {
    create: '/cycle',
    update: (cycleId: number) => `/cycle/${cycleId}`,
    getMyCycles: '/cycle',
    getCycle: (cycleId: number) => `/cycle/${cycleId}`,
    deleteCycle: (cycleId: number) => `/cycle/${cycleId}`,
  },
} as const;

const client = axios.create({
  baseURL: API_BASE_URL,
});

client.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token?.refreshToken) {
    setItem(REFRESH_TOKEN, token.refreshToken);
    setItem(ACCESS_TOKEN, token.accessToken);
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token.accessToken}`;
  }
  return config;
});

client.interceptors.response.use(undefined, async (error) => {
  if (isAxiosError(error) && error.response?.status === 401) {
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
    const queryClient = new QueryClient();
    queryClient.clear();
  } else {
    throw error;
  }
});

export default client;
