import { z } from 'zod';

/**
 * Where a new user came from: the campaign of the link they followed, the
 * site that sent them, and the website pages they saw before signing up.
 */
export const signupAttributionSchema = z
  .object({
    utmSource: z.string().max(100).optional(),
    utmMedium: z.string().max(100).optional(),
    utmCampaign: z.string().max(200).optional(),
    utmTerm: z.string().max(200).optional(),
    utmContent: z.string().max(200).optional(),
    /** Host of the external site that linked to us, e.g. www.google.com */
    referrer: z.string().max(255).optional(),
    /** Path of the first website page of the visit */
    landingPage: z.string().max(500).optional(),
    /** Path of the website page whose link opened the app */
    sitePage: z.string().max(500).optional(),
    /** Which button of that page, e.g. home_hero */
    cta: z.string().max(100).optional(),
  })
  .strict();

export type SignupAttribution = z.infer<typeof signupAttributionSchema>;
