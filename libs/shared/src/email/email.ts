import { z } from 'zod';

/** A user's saved language, which their emails are written in. */
export const emailLanguageSchema = z.enum(['FR', 'EN', 'IT', 'ES', 'PT_BR']);

export type EmailLanguage = z.infer<typeof emailLanguageSchema>;

const emailSubjects: {
  'password-reset': Record<EmailLanguage, string>;
  welcome: Record<EmailLanguage, string>;
  'subscription-confirmation': Record<EmailLanguage, string>;
  'athlete-invitation': Record<EmailLanguage, string>;
  'athlete-invitation-existing': Record<EmailLanguage, string>;
  'coach-invitation-new': Record<EmailLanguage, string>;
  'coach-invitation-existing': Record<EmailLanguage, string>;
  'signup-notification': Record<EmailLanguage, string>;
} = {
  'password-reset': {
    ES: 'Restablece tu contraseña',
    FR: 'Réinitialisation de votre mot de passe',
    EN: 'Reset your password',
    IT: 'Reimposta la tua password',
    PT_BR: 'Redefina sua senha',
  },
  welcome: {
    ES: 'Tu cuenta de OpenAthlete',
    FR: 'Votre compte OpenAthlete',
    EN: 'Your OpenAthlete account',
    IT: 'Il tuo account OpenAthlete',
    PT_BR: 'Sua conta OpenAthlete',
  },
  'subscription-confirmation': {
    ES: 'Gracias por apoyar OpenAthlete',
    FR: 'Merci de soutenir OpenAthlete',
    EN: 'Thank you for supporting OpenAthlete',
    IT: 'Grazie per sostenere OpenAthlete',
    PT_BR: 'Agradecemos por apoiar o OpenAthlete',
  },
  'athlete-invitation': {
    ES: 'Invitación para unirte a OpenAthlete',
    FR: 'Invitation à rejoindre OpenAthlete',
    EN: 'Invitation to join OpenAthlete',
    IT: 'Invito a unirsi a OpenAthlete',
    PT_BR: 'Convite para entrar no OpenAthlete',
  },
  'athlete-invitation-existing': {
    ES: 'Nueva invitación de entrenador',
    FR: 'Nouvelle invitation de coach',
    EN: 'New coach invitation',
    IT: 'Nuovo invito da coach',
    PT_BR: 'Novo convite de treinador',
  },
  'coach-invitation-new': {
    ES: 'Invitación para unirte a OpenAthlete',
    FR: 'Invitation à rejoindre OpenAthlete',
    EN: 'Invitation to join OpenAthlete',
    IT: 'Invito a unirsi a OpenAthlete',
    PT_BR: 'Convite para entrar no OpenAthlete',
  },
  'coach-invitation-existing': {
    ES: 'Nueva invitación de entrenador',
    FR: 'Nouvelle invitation de coach',
    EN: 'New coach invitation',
    IT: 'Nuovo invito da coach',
    PT_BR: 'Novo convite de treinador',
  },
  'signup-notification': {
    ES: 'Nuevo registro de usuario',
    FR: 'Nouvelle inscription utilisateur',
    EN: 'New user signup',
    IT: 'Nuova registrazione utente',
    PT_BR: 'Novo cadastro de usuário',
  },
} as const;

export const emailLibrary = {
  'password-reset': {
    defaultSubject: emailSubjects['password-reset'],
    props: {} as { url: string },
  },
  welcome: {
    defaultSubject: emailSubjects.welcome,
    props: {} as {
      name?: string;
      connections_url: string;
      /** Who signs, on instances that write to their users in person */
      signature?: string;
    },
  },
  'subscription-confirmation': {
    defaultSubject: emailSubjects['subscription-confirmation'],
    props: {} as {
      name?: string;
      subscription_settings_url: string;
    },
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
  'signup-notification': {
    defaultSubject: emailSubjects['signup-notification'],
    props: {} as { email: string; firstName?: string; lastName?: string },
  },
} as const;

export type EmailId = keyof typeof emailLibrary;

export type EmailFromId<E extends EmailId> = (typeof emailLibrary)[E];

export type EmailPropsFromId<I extends EmailId> =
  (typeof emailLibrary)[I]['props'];
