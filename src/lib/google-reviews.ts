import { z } from "zod";
const httpsUrl = z
  .string()
  .url()
  .refine((v) => v.startsWith("https://"));
export const googlePlaceSchema = z.object({
  rating: z.number().min(0).max(5).optional(),
  userRatingCount: z.number().int().min(0).optional(),
  googleMapsUri: httpsUrl.optional(),
  attributions: z
    .array(
      z.object({
        provider: z.string().optional(),
        providerUri: httpsUrl.optional(),
      }),
    )
    .optional(),
  reviews: z
    .array(
      z.object({
        name: z.string().optional(),
        rating: z.number().min(1).max(5),
        originalText: z
          .object({ text: z.string(), languageCode: z.string().optional() })
          .optional(),
        text: z
          .object({ text: z.string(), languageCode: z.string().optional() })
          .optional(),
        authorAttribution: z.object({
          displayName: z.string(),
          uri: httpsUrl.optional(),
          photoUri: httpsUrl.optional(),
        }),
        relativePublishTimeDescription: z.string().optional(),
        googleMapsUri: httpsUrl.optional(),
      }),
    )
    .max(5)
    .optional(),
});
export type GooglePlace = z.infer<typeof googlePlaceSchema>;
