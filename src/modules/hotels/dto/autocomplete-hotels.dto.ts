import { z } from 'zod';

export const autocompleteHotelsQuerySchema = z.object({
  q: z.string().trim().min(2, 'q must contain at least 2 characters.').max(255),
});

export type AutocompleteHotelsQuery = z.infer<typeof autocompleteHotelsQuerySchema>;
