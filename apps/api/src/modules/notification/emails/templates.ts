import { EmailPropsFromId } from '@openathlete/shared';

import { buildAthleteInvitationExistingEmail } from './templates/athlete-invitation-existing.template';
import { buildAthleteInvitationEmail } from './templates/athlete-invitation.template';
import { buildCoachInvitationExistingEmail } from './templates/coach-invitation-existing.template';
import { buildCoachInvitationNewEmail } from './templates/coach-invitation-new.template';
import { buildPasswordResetEmail } from './templates/password-reset.template';
import { buildSignupNotificationEmail } from './templates/signup-notification.template';
import { buildWelcomeEmail } from './templates/welcome.template';

export const emailTemplates = {
  'password-reset': buildPasswordResetEmail as (
    props: EmailPropsFromId<'password-reset'>,
  ) => string,
  welcome: buildWelcomeEmail as (props: EmailPropsFromId<'welcome'>) => string,
  'athlete-invitation': buildAthleteInvitationEmail as (
    props: EmailPropsFromId<'athlete-invitation'>,
  ) => string,
  'athlete-invitation-existing': buildAthleteInvitationExistingEmail as (
    props: EmailPropsFromId<'athlete-invitation-existing'>,
  ) => string,
  'coach-invitation-new': buildCoachInvitationNewEmail as (
    props: EmailPropsFromId<'coach-invitation-new'>,
  ) => string,
  'coach-invitation-existing': buildCoachInvitationExistingEmail as (
    props: EmailPropsFromId<'coach-invitation-existing'>,
  ) => string,
  'signup-notification': buildSignupNotificationEmail as (
    props: EmailPropsFromId<'signup-notification'>,
  ) => string,
};
