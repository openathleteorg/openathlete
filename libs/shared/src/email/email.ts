export const emailLibrary = {
  'password-reset': {
    defaultSubject: 'Réinitialisation de votre mot de passe',
    props: {} as { url: string },
  },
  welcome: {
    defaultSubject: 'Bienvenue sur OpenAthlete',
    props: {} as { name?: string; dashboard_url?: string },
  },
  'athlete-invitation': {
    defaultSubject: 'Invitation à rejoindre OpenAthlete',
    props: {} as { coachName: string; url: string },
  },
} as const;

export type EmailId = keyof typeof emailLibrary;

export type EmailFromId<E extends EmailId> = (typeof emailLibrary)[E];

export type EmailPropsFromId<I extends EmailId> =
  (typeof emailLibrary)[I]['props'];
