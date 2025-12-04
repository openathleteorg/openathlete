import {
  MutationOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import { NewsletterAPI, NewsletterSubscribeRequest } from './newsletter.api';
import { newsletterKeys } from './newsletter.keys';

export const useNewsletterSubscribeMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof NewsletterAPI.subscribe>>,
    Error,
    NewsletterSubscribeRequest
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    ...opt,
    mutationFn: (data: NewsletterSubscribeRequest) =>
      NewsletterAPI.subscribe(data),
    mutationKey: [newsletterKeys.subscribe],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [newsletterKeys.all] });
    },
  });
};
