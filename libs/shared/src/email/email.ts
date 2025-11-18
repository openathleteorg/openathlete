export type EmailLanguage = 'FR' | 'EN';

const emailSubjects: {
  'password-reset': Record<EmailLanguage, string>;
  welcome: Record<EmailLanguage, string>;
  'athlete-invitation': Record<EmailLanguage, string>;
  'athlete-invitation-existing': Record<EmailLanguage, string>;
  'coach-invitation-new': Record<EmailLanguage, string>;
  'coach-invitation-existing': Record<EmailLanguage, string>;
} = {
  'password-reset': {
    FR: 'Réinitialisation de votre mot de passe',
    EN: 'Reset your password',
  },
  welcome: {
    FR: 'Bienvenue sur OpenAthlete',
    EN: 'Welcome to OpenAthlete',
  },
  'athlete-invitation': {
    FR: 'Invitation à rejoindre OpenAthlete',
    EN: 'Invitation to join OpenAthlete',
  },
  'athlete-invitation-existing': {
    FR: 'Nouvelle invitation de coach',
    EN: 'New coach invitation',
  },
  'coach-invitation-new': {
    FR: 'Invitation à rejoindre OpenAthlete',
    EN: 'Invitation to join OpenAthlete',
  },
  'coach-invitation-existing': {
    FR: 'Nouvelle invitation de coach',
    EN: 'New coach invitation',
  },
} as const;

export const emailLibrary = {
  'password-reset': {
    defaultSubject: emailSubjects['password-reset'],
    props: {} as { url: string },
  },
  welcome: {
    defaultSubject: emailSubjects.welcome,
    props: {} as { name?: string; dashboard_url?: string },
  },
  'athlete-invitation': {
    defaultSubject: emailSubjects['athlete-invitation'],
    props: {} as { coachName: string; url: string },
  },
  'athlete-invitation-existing': {
    defaultSubject: emailSubjects['athlete-invitation-existing'],
    props: {} as { coachName: string; url: string },
  },
  'coach-invitation-new': {
    defaultSubject: emailSubjects['coach-invitation-new'],
    props: {} as { athleteName: string; url: string },
  },
  'coach-invitation-existing': {
    defaultSubject: emailSubjects['coach-invitation-existing'],
    props: {} as { athleteName: string; url: string },
  },
} as const;

export type EmailId = keyof typeof emailLibrary;

export type EmailFromId<E extends EmailId> = (typeof emailLibrary)[E];

export type EmailPropsFromId<I extends EmailId> =
  (typeof emailLibrary)[I]['props'];
