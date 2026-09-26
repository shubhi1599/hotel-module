import { and, asc, eq, like } from 'drizzle-orm';

import { db } from '../../../database/client.js';
import { hotelImages, hotels } from '../../../database/schema.js';

export interface NewHotel {
  name: string;
  normalizedName: string;
  description?: string;
  address: string;
  city: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  starRating: number;
}

export interface NewHotelImage {
  url: string;
  isPrimary: boolean;
  sortOrder: number;
}

export class HotelRepository {
  async create(hotel: NewHotel, images: readonly NewHotelImage[]) {
    return db.transaction(async (transaction) => {
      const [createdHotel] = await transaction.insert(hotels).values(hotel).returning();

      if (!createdHotel) {
        throw new Error('Hotel creation did not return a record.');
      }

      const createdImages = images.length
        ? await transaction
            .insert(hotelImages)
            .values(images.map((image) => ({ ...image, hotelId: createdHotel.id })))
            .returning()
        : [];

      return {
        hotel: createdHotel,
        images: createdImages.sort((left, right) => left.sortOrder - right.sortOrder),
      };
    });
  }

  async findImagesByHotelId(hotelId: number) {
    return db
      .select()
      .from(hotelImages)
      .where(eq(hotelImages.hotelId, hotelId))
      .orderBy(asc(hotelImages.sortOrder));
  }

  async findById(id: number) {
    const [hotel] = await db.select().from(hotels).where(eq(hotels.id, id)).limit(1);

    return hotel;
  }

  async findActiveByNamePrefix(normalizedPrefix: string) {
    const escapedPrefix = normalizedPrefix.replace(/[\\%_]/g, '\\$&');

    return db
      .select({
        id: hotels.id,
        name: hotels.name,
        city: hotels.city,
      })
      .from(hotels)
      .where(
        and(
          eq(hotels.isActive, true),
          like(hotels.normalizedName, `${escapedPrefix}%`),
        ),
      )
      .orderBy(asc(hotels.normalizedName), asc(hotels.id))
      .limit(10);
  }
}
