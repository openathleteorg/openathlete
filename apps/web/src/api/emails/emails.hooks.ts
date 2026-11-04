import { useMutation } from '@tanstack/react-query';

import { EmailsAPI } from './emails.api';

export const useUnsubscribeMutation = () =>
  useMutation({ mutationFn: EmailsAPI.unsubscribe });

export const useResubscribeMutation = () =>
  useMutation({ mutationFn: EmailsAPI.resubscribe });
