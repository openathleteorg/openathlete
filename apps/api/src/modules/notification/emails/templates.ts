import { EmailId, EmailLanguage, EmailPropsFromId } from '@openathlete/shared';

import { RenderedEmail } from './core/layout';
import { buildAthleteInvitationExistingEmail } from './templates/athlete-invitation-existing.template';
import { buildAthleteInvitationEmail } from './templates/athlete-invitation.template';
import { buildCoachInvitationExistingEmail } from './templates/coach-invitation-existing.template';
import { buildCoachInvitationNewEmail } from './templates/coach-invitation-new.template';
import { buildPasswordResetEmail } from './templates/password-reset.template';
import { buildSignupNotificationEmail } from './templates/signup-notification.template';
import { buildSubscriptionConfirmationEmail } from './templates/subscription-confirmation.template';
import { buildWelcomeEmail } from './templates/welcome.template';

export const emailTemplates: {
  [K in EmailId]: (
    props: EmailPropsFromId<K> & { language?: EmailLanguage },
  ) => RenderedEmail;
} = {
  'password-reset': buildPasswordResetEmail,
  welcome: buildWelcomeEmail,
  'subscription-confirmation': buildSubscriptionConfirmationEmail,
  'athlete-invitation': buildAthleteInvitationEmail,
  'athlete-invitation-existing': buildAthleteInvitationExistingEmail,
  'coach-invitation-new': buildCoachInvitationNewEmail,
  'coach-invitation-existing': buildCoachInvitationExistingEmail,
  'signup-notification': buildSignupNotificationEmail,
};
