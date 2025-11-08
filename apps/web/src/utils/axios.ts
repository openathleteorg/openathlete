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
    verifyInvitation: '/auth/invitation',
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
    duplicate: (eventId: Event['eventId']) => `/event/${eventId}/duplicate`,
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
    getUnvalidatedSessions: (
      athleteId: number,
      startDate?: string,
      endDate?: string,
    ) =>
      `/event/unvalidated/${athleteId}${
        startDate && endDate ? `?startDate=${startDate}&endDate=${endDate}` : ''
      }`,
  },
  eventTemplate: {
    getMyTemplates: '/event-template',
    create: '/event-template',
    update: (eventTemplateId: number) => `/event-template/${eventTemplateId}`,
    use: (eventTemplateId: number) => `/event-template/${eventTemplateId}/use`,
    delete: (eventTemplateId: Event['eventId']) =>
      `/event-template/${eventTemplateId}`,
  },
  eventTemplateFolder: {
    getMyFolders: '/event-template-folder',
    create: '/event-template-folder',
    update: (folderId: number) => `/event-template-folder/${folderId}`,
    delete: (folderId: number) => `/event-template-folder/${folderId}`,
  },
  record: {
    getRecords: '/record',
  },
  equipment: {
    getMyEquipment: '/equipment',
    createEquipment: '/equipment',
    updateEquipment: (equipmentId: number) => `/equipment/${equipmentId}`,
    deleteEquipment: (equipmentId: number) => `/equipment/${equipmentId}`,
  },
  metric: {
    getMetrics: '/metric',
    getLatestMetrics: '/metric/latest',
    getMetricHistory: (type: string) => `/metric/history/${type}`,
    calculateMetric: (type: string) => `/metric/calculate/${type}`,
    createMetric: '/metric',
    updateMetric: (metricId: number) => `/metric/${metricId}`,
    deleteMetric: (metricId: number) => `/metric/${metricId}`,
  },
  provider: {
    getOAuthUri: (provider: ConnectorProvider) =>
      `/provider/${provider.toLowerCase()}/uri`,
    setOAuthToken: (provider: ConnectorProvider) =>
      `/provider/${provider.toLowerCase()}/token`,
    disconnect: (provider: ConnectorProvider) =>
      `/provider/${provider.toLowerCase()}/disconnect`,
    getConnected: '/provider/connected',
  },
  athlete: {
    getMyAthlete: '/athlete/me',
    getCoachedAthletes: '/athlete/coached',
    getCoaches: '/athlete/coaches',
    inviteCoach: '/athlete/invite/coach',
    inviteAthlete: '/athlete/invite/athlete',
    removeAthlete: (athleteId: number) => `/athlete/${athleteId}`,
    removeCoach: (coachId: number) => `/athlete/coach/${coachId}`,
    getAthleteSettings: (athleteId: number) => `/athlete/${athleteId}/settings`,
    updateAthleteSettings: (athleteId: number) => `/athlete/${athleteId}/settings`,
    getPendingInvitations: '/athlete/invitations/pending',
    acceptInvitation: (invitationId: number) => `/athlete/invitations/${invitationId}/accept`,
    rejectInvitation: (invitationId: number) => `/athlete/invitations/${invitationId}/reject`,
  },
  statistics: {
    getStatisticsForPeriod: (
      athleteId: number,
      startDate: string,
      endDate: string,
    ) => `/statistics?athleteId=${athleteId}&start=${startDate}&end=${endDate}`,
  },
  coach: {
    dashboard: (start?: string, end?: string) =>
      `/coach/dashboard${start && end ? `?start=${start}&end=${end}` : ''}`,
    getPendingInvitations: '/coach/invitations/pending',
    acceptInvitation: (invitationId: number) => `/coach/invitations/${invitationId}/accept`,
    rejectInvitation: (invitationId: number) => `/coach/invitations/${invitationId}/reject`,
  },
  cycle: {
    create: '/cycle',
    update: (cycleId: number) => `/cycle/${cycleId}`,
    getMyCycles: '/cycle',
    getCycle: (cycleId: number) => `/cycle/${cycleId}`,
    deleteCycle: (cycleId: number) => `/cycle/${cycleId}`,
  },
  agent: {
    createThread: '/agent/threads',
    getThreads: '/agent/threads',
    getThread: (threadId: number) => `/agent/threads/${threadId}`,
    updateThread: (threadId: number) => `/agent/threads/${threadId}`,
    deleteThread: (threadId: number) => `/agent/threads/${threadId}`,
    createMessage: '/agent/messages',
    getThreadMessages: (threadId: number) =>
      `/agent/threads/${threadId}/messages`,
    deleteMessage: (messageId: number) => `/agent/messages/${messageId}`,
    createBlock: '/agent/blocks',
    updateBlock: (blockId: number) => `/agent/blocks/${blockId}`,
    deleteBlock: (blockId: number) => `/agent/blocks/${blockId}`,
    chat: (threadId: number) => `/agent/threads/${threadId}/chat`,
  },
  messages: {
    createThread: '/messages/threads',
    getThreads: '/messages/threads',
    getThread: (threadId: number) => `/messages/threads/${threadId}`,
    updateThread: (threadId: number) => `/messages/threads/${threadId}`,
    deleteThread: (threadId: number) => `/messages/threads/${threadId}`,
    createMessage: '/messages/messages',
    getThreadMessages: (threadId: number) =>
      `/messages/threads/${threadId}/messages`,
    getMessage: (messageId: number) => `/messages/messages/${messageId}`,
    updateMessage: (messageId: number) => `/messages/messages/${messageId}`,
    deleteMessage: (messageId: number) => `/messages/messages/${messageId}`,
    markAsRead: (threadId: number) => `/messages/threads/${threadId}/read`,
  },
  workout: {
    // Note: Workouts are now managed through event endpoints
    reorder: (eventId: number) => `/event/${eventId}/workout/reorder`,
    duplicate: (eventId: number) => `/event/${eventId}/workout/duplicate`,
  },
  trainingLoad: {
    calculate: (activityId: number) => `/training-load/calculate/${activityId}`,
    activity: (activityId: number) => `/training-load/activity/${activityId}`,
    period: '/training-load/period',
    metrics: '/training-load/metrics',
    history: '/training-load/history',
    recalculate: '/training-load/recalculate',
  },
  betaAccess: {
    request: '/beta-access',
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
