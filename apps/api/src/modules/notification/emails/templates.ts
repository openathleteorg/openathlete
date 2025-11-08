import { EmailId } from '@openathlete/shared';

import { buildAthleteInvitationEmail } from './templates/athlete-invitation.template';
import { buildAthleteInvitationExistingEmail } from './templates/athlete-invitation-existing.template';
import { buildCoachInvitationExistingEmail } from './templates/coach-invitation-existing.template';
import { buildCoachInvitationNewEmail } from './templates/coach-invitation-new.template';
import { buildPasswordResetEmail } from './templates/password-reset.template';
import { buildWelcomeEmail } from './templates/welcome.template';

export const emailTemplates = {
  'password-reset': buildPasswordResetEmail as (props: any) => string,
  welcome: buildWelcomeEmail as (props: any) => string,
  'athlete-invitation': buildAthleteInvitationEmail as (props: any) => string,
  'athlete-invitation-existing': buildAthleteInvitationExistingEmail as (props: any) => string,
  'coach-invitation-new': buildCoachInvitationNewEmail as (props: any) => string,
  'coach-invitation-existing': buildCoachInvitationExistingEmail as (props: any) => string,
};
