import countries from 'i18n-iso-countries';
import { z } from 'zod';

// getAlpha2Codes() maps ISO alpha-2 codes to their alpha-3 equivalents.
const countryCodes = new Set(Object.keys(countries.getAlpha2Codes()));

const imageSchema = z
  .object({
    url: z.string().trim().url('Image URL must be a valid URL.').max(2_048),
    isPrimary: z.boolean().optional().default(false),
  })
  .strict();

export const createHotelSchema = z
  .object({
    name: z.string().trim().min(1).max(255),
    description: z.string().trim().min(1).max(10_000).optional(),
    address: z.string().trim().min(1).max(500),
    city: z.string().trim().min(1).max(255),
    countryCode: z
      .string()
      .trim()
      .toUpperCase()
      .refine((value) => countryCodes.has(value), 'countryCode must be a valid ISO 3166-1 alpha-2 code.'),
    latitude: z.number().finite().min(-90).max(90),
    longitude: z.number().finite().min(-180).max(180),
    starRating: z.number().int().min(1).max(5),
    images: z.array(imageSchema).optional().default([]),
  })
  .strict()
  .superRefine((hotel, context) => {
    const primaryImageCount = hotel.images.filter((image) => image.isPrimary).length;

    if (primaryImageCount > 1) {
      context.addIssue({
        code: 'custom',
        path: ['images'],
        message: 'Only one image can be primary.',
      });
    }

    const urls = new Set<string>();
    hotel.images.forEach((image, index) => {
      const normalizedUrl = new URL(image.url).toString();

      if (urls.has(normalizedUrl)) {
        context.addIssue({
          code: 'custom',
          path: ['images', index, 'url'],
          message: 'Duplicate image URLs are not allowed.',
        });
      }

      urls.add(normalizedUrl);
    });
  });

export type CreateHotelDto = z.infer<typeof createHotelSchema>;
