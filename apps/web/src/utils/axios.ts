import { getAccessToken } from '@/utils/auth';
import { QueryClient } from '@tanstack/react-query';
import axios, { isAxiosError } from 'axios';

import { ConnectorProvider, Event } from '@openathlete/shared';

import { getApiBaseUrl } from './capacitor';
import { ACCESS_TOKEN, REFRESH_TOKEN, setItem } from './local-storage';

export const routes = {
  auth: {
    login: '/auth/login',
    firebaseLogin: '/auth/firebase',
    oidc: '/auth/oidc',
    oidcExchange: '/auth/oidc/exchange',
    refreshToken: '/auth/refresh-token',
    verifyInvitation: '/auth/invitation',
  },
  user: {
    getMe: '/user/me',
    createAccount: '/user',
    updateAccount: '/user',
    deleteAccount: '/user',
    analyticsConsent: '/user/me/analytics-consent',
    signupAttribution: '/user/me/signup-attribution',
    exportData: '/user/me/export',
    updateLanguage: '/user/language',
    passwordReset: '/user/password-reset',
    passwordResetRequest: '/user/password-reset/request',
    completeOnboarding: '/user/complete-onboarding',
    updatePushToken: '/user/push-token',
  },
  emails: {
    unsubscribe: '/emails/unsubscribe',
    resubscribe: '/emails/resubscribe',
  },
  activityImport: {
    fit: '/activity-import/fit',
    gpx: '/activity-import/gpx',
    tcx: '/activity-import/tcx',
    removeDuplicates: '/activity-duplicates/removal',
  },
  event: {
    create: '/event',
    update: (eventId: Event['eventId']) => `/event/${eventId}`,
    duplicate: (eventId: Event['eventId']) => `/event/${eventId}/duplicate`,
    copyEvents: '/event/bulk/copy',
    repeatEvent: (eventId: Event['eventId']) => `/event/${eventId}/repeat`,
    eventSeries: (eventId: Event['eventId']) => `/event/${eventId}/series`,
    moveEvents: '/event/bulk/move',
    planForAthletes: '/event/plan-for-athletes',
    planForAthletesPreview: '/event/plan-for-athletes/preview',
    batch: (batchId: string) => `/event/batch/${encodeURIComponent(batchId)}`,
    getMyEvents: '/event',
    season: '/event/season',
    getUpcomingCompetitions: '/event/upcoming-competitions',
    search: '/event/search',
    getEvent: (eventId: Event['eventId']) => `/event/${eventId}`,
    getEventStream: (eventId: Event['eventId']) => `/event/${eventId}/stream`,
    activityCorrections: (eventId: Event['eventId']) =>
      `/event/${eventId}/activity/corrections`,
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
    getActivityFeedbackQuestions: (eventId: Event['eventId']) =>
      `/event/${eventId}/activity/feedback-questions`,
    submitQuestionAnswer: (eventId: Event['eventId'], questionId: number) =>
      `/event/${eventId}/activity/feedback-questions/${questionId}/answer`,
    skipFeedback: (eventId: Event['eventId']) =>
      `/event/${eventId}/activity/feedback/skip`,
    unskipFeedback: (eventId: Event['eventId']) =>
      `/event/${eventId}/activity/feedback/unskip`,
    transcribeAudio: '/activity-feedback/transcribe',
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
  instance: {
    getInstanceInfo: '/instance',
  },
  record: {
    getRecords: '/record',
    getRecordSports: '/record/sports',
    getRecordHistory: '/record/history',
    getRecordEfforts: '/record/efforts',
    getRecordExclusions: '/record/exclusions',
    createRecordExclusion: '/record/exclusions',
    deleteRecordExclusion: (recordExclusionId: number) =>
      `/record/exclusions/${recordExclusionId}`,
  },
  equipment: {
    getMyEquipment: '/equipment',
    createEquipment: '/equipment',
    updateEquipment: (equipmentId: number) => `/equipment/${equipmentId}`,
    deleteEquipment: (equipmentId: number) => `/equipment/${equipmentId}`,
  },
  exercise: {
    custom: '/exercise/custom',
    customOne: (id: number) => `/exercise/custom/${id}`,
    completeStrengthSession: (eventId: number) =>
      `/event/${eventId}/strength-session`,
  },
  files: {
    uploadImage: '/files/images',
    get: (fileId: string) => `/files/${fileId}`,
  },
  coachNote: {
    notebook: '/coach-notes/notebook',
    list: '/coach-notes',
    create: '/coach-notes',
    update: (coachNoteId: number) => `/coach-notes/${coachNoteId}`,
    delete: (coachNoteId: number) => `/coach-notes/${coachNoteId}`,
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
  injury: {
    getInjuries: '/injury',
  },
  provider: {
    getOAuthUri: (provider: ConnectorProvider) =>
      `/provider/${provider.toLowerCase()}/uri`,
    setOAuthToken: (provider: ConnectorProvider) =>
      `/provider/${provider.toLowerCase()}/token`,
    disconnect: (provider: ConnectorProvider) =>
      `/provider/${provider.toLowerCase()}/disconnect`,
    getConnected: '/provider/connected',
    updatePreferences: (provider: ConnectorProvider) =>
      `/provider/${provider.toLowerCase()}/preferences`,
    importAllActivities: (provider: ConnectorProvider) =>
      `/provider/${provider.toLowerCase()}/import-all`,
    activityDescriptionPreview: '/provider/strava/activity-description/preview',
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
    updateAthleteSettings: (athleteId: number) =>
      `/athlete/${athleteId}/settings`,
    getPendingInvitations: '/athlete/invitations/pending',
    getSentAthleteInvitations: '/athlete/invitations/athletes/sent',
    cancelAthleteInvitation: (invitationId: number) =>
      `/athlete/invitations/athletes/${invitationId}`,
    getSentCoachInvitations: '/athlete/invitations/coaches/sent',
    cancelCoachInvitation: (invitationId: number) =>
      `/athlete/invitations/coaches/${invitationId}`,
    acceptInvitation: (invitationId: number) =>
      `/athlete/invitations/${invitationId}/accept`,
    rejectInvitation: (invitationId: number) =>
      `/athlete/invitations/${invitationId}/reject`,
  },
  statistics: {
    filters: '/statistics/filters',
    overview: '/statistics/overview',
    volume: '/statistics/volume',
    days: '/statistics/days',
    recovery: '/statistics/recovery',
    terrain: '/statistics/terrain',
    cardiacCost: '/statistics/cardiac-cost',
    durability: '/statistics/durability',
    longRuns: '/statistics/long-runs',
    intensity: '/statistics/intensity',
    trends: '/statistics/trends',
    load: '/statistics/load',
  },
  coach: {
    dashboard: (start?: string, end?: string, compare?: boolean) => {
      const params = new URLSearchParams();
      if (start && end) {
        params.set('start', start);
        params.set('end', end);
      }
      if (compare) params.set('compare', 'previous');
      const query = params.toString();
      return `/coach/dashboard${query ? `?${query}` : ''}`;
    },
    thresholds: '/coach/thresholds',
    threshold: (id: number) => `/coach/thresholds/${id}`,
    getPendingInvitations: '/coach/invitations/pending',
    acceptInvitation: (invitationId: number) =>
      `/coach/invitations/${invitationId}/accept`,
    rejectInvitation: (invitationId: number) =>
      `/coach/invitations/${invitationId}/reject`,
  },
  club: {
    list: '/club',
    create: '/club',
    get: (clubId: number) => `/club/${clubId}`,
    update: (clubId: number) => `/club/${clubId}`,
    delete: (clubId: number) => `/club/${clubId}`,
    member: (clubId: number, userId: number) =>
      `/club/${clubId}/members/${userId}`,
    transfer: (clubId: number) => `/club/${clubId}/transfer`,
    joinLinks: (clubId: number) => `/club/${clubId}/join-links`,
    rotateJoinLink: (clubId: number) => `/club/${clubId}/join-links/rotate`,
    invitations: (clubId: number) => `/club/${clubId}/invitations`,
    invitation: (clubId: number, id: number) =>
      `/club/${clubId}/invitations/${id}`,
    resendInvitation: (clubId: number, id: number) =>
      `/club/${clubId}/invitations/${id}/resend`,
    sessions: (clubId: number) => `/club/${clubId}/sessions`,
    session: (clubId: number, id: number) => `/club/${clubId}/sessions/${id}`,
    cancelSession: (clubId: number, id: number) =>
      `/club/${clubId}/sessions/${id}/cancel`,
  },
  clubSessions: {
    forEvent: (eventId: number) => `/club-sessions/event/${eventId}`,
    attendance: '/club-sessions/attendance',
  },
  clubJoin: {
    code: (code: string) => `/club-join/code/${encodeURIComponent(code)}`,
    info: (token: string) => `/club-join/${encodeURIComponent(token)}`,
    accept: (token: string) => `/club-join/${encodeURIComponent(token)}/accept`,
  },
  athleteGroups: {
    list: '/athlete-groups',
    create: '/athlete-groups',
    group: (groupId: number) => `/athlete-groups/${groupId}`,
    athletes: (groupId: number) => `/athlete-groups/${groupId}/athletes`,
    athlete: (groupId: number, athleteId: number) =>
      `/athlete-groups/${groupId}/athletes/${athleteId}`,
    staff: (groupId: number) => `/athlete-groups/${groupId}/staff`,
  },
  coachJoinLink: {
    get: '/coach-join-link',
    rotate: '/coach-join-link/rotate',
    info: (token: string) => `/coach-join-link/${encodeURIComponent(token)}`,
    accept: (token: string) =>
      `/coach-join-link/${encodeURIComponent(token)}/accept`,
  },
  cycle: {
    create: '/cycle',
    update: (cycleId: number) => `/cycle/${cycleId}`,
    getMyCycles: '/cycle',
    getCycle: (cycleId: number) => `/cycle/${cycleId}`,
    deleteCycle: (cycleId: number) => `/cycle/${cycleId}`,
  },
  aiFeatures: {
    generateEvent: '/agent/ai/events/generate',
    modifyEvent: '/agent/ai/events/modify',
  },
  mcp: {
    info: '/mcp/info',
    connections: '/mcp/connections',
    connection: (mcpGrantId: number) => `/mcp/connections/${mcpGrantId}`,
    tokens: '/mcp/tokens',
    authorizeDetails: '/oauth/authorize/details',
    authorize: '/oauth/authorize',
  },
  aiSettings: {
    providers: '/ai/providers',
    credentials: '/ai/credentials',
    credential: (aiCredentialId: number) => `/ai/credentials/${aiCredentialId}`,
    testCredential: (aiCredentialId: number) =>
      `/ai/credentials/${aiCredentialId}/test`,
    models: '/ai/models',
    instructions: '/ai/instructions',
    access: '/ai/access',
    consent: '/ai/consent',
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
    broadcast: '/messages/broadcast',
    scheduled: '/messages/scheduled',
    scheduledMessage: (id: number) => `/messages/scheduled/${id}`,
    eventCommentCounts: '/messages/events/comments',
    eventComments: (eventId: number) => `/messages/events/${eventId}/comments`,
    eventCommentsRead: (eventId: number) =>
      `/messages/events/${eventId}/comments/read`,
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
    weeklySummary: '/training-load/weekly-summary',
    days: '/training-load/days',
    recalculate: '/training-load/recalculate',
  },
  subscription: {
    current: '/subscription/current',
    supporters: '/subscription/supporters',
    checkout: '/subscription/checkout',
    cancel: '/subscription/cancel',
    resume: '/subscription/resume',
    invoices: '/subscription/invoices',
    portal: '/subscription/portal',
    appleAccountToken: '/subscription/apple/account-token',
    appleTransactions: '/subscription/apple/transactions',
  },
  seoPlan: {
    create: '/seo-plan',
    getPlan: (token: string) => `/seo-plan/${token}`,
    import: (token: string) => `/seo-plan/${token}/import`,
  },
} as const;

const client = axios.create({
  baseURL: getApiBaseUrl(),
});

/** The request got no answer: the device is offline or the API unreachable. */
export const isNetworkError = (error: unknown) =>
  isAxiosError(error) && !error.response;

client.interceptors.request.use(async (config) => {
  config.baseURL = getApiBaseUrl();
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
  }
  // Callers still need the failure: swallowing it made a wrong password look
  // like a broken response, and an unauthorized change like a success.
  throw error;
});

export default client;
