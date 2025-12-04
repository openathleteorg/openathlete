import client, { routes } from '@/lib/axios';

export interface NewsletterSubscribeRequest {
  email: string;
}

export interface NewsletterSubscribeResponse {
  success: boolean;
  message?: string;
}

export const NewsletterAPI = {
  subscribe: async (
    data: NewsletterSubscribeRequest,
  ): Promise<NewsletterSubscribeResponse> => {
    const response = await client.post<NewsletterSubscribeResponse>(
      routes.newsletter.subscribe,
      data,
    );
    return response.data;
  },
};

