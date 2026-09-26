import { z } from 'zod';

export const hotelIdParamsSchema = z.object({
  id: z.coerce.number().int().positive('id must be a positive integer.').safe(),
});

export type HotelIdParams = z.infer<typeof hotelIdParamsSchema>;
