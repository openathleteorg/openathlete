import { EmailId } from '@openathlete/shared';

import { buildAthleteInvitationEmail } from './templates/athlete-invitation.template';
import { buildPasswordResetEmail } from './templates/password-reset.template';
import { buildWelcomeEmail } from './templates/welcome.template';

export const emailTemplates = {
  'password-reset': buildPasswordResetEmail as (props: any) => string,
  welcome: buildWelcomeEmail as (props: any) => string,
  'athlete-invitation': buildAthleteInvitationEmail as (props: any) => string,
};
