import { MutationOptions, useMutation } from '@tanstack/react-query';

import { ContactSubmissionDto } from '@openathlete/shared';

import { MarketingService } from './contact.service';

export const useContactSubmitMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof MarketingService.submitContact>>,
    Error,
    ContactSubmissionDto
  >,
) =>
  useMutation({
    ...opt,
    mutationFn: MarketingService.submitContact,
  });
