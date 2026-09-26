import type { CreateHotelDto } from '../dto/create-hotel.dto.js';
import type { AutocompleteHotelsQuery } from '../dto/autocomplete-hotels.dto.js';
import { AppError } from '../../../common/errors/app-error.js';
import {
  getCacheValue,
  incrementCacheValue,
  setCacheValue,
} from '../../../common/cache/redis.js';
import { type AutocompleteHotel, HotelRepository } from '../repositories/hotel.repository.js';

const hotelRepository = new HotelRepository();
const autocompleteCacheVersionKey = 'hotels:autocomplete:version';
const autocompleteCacheTtlSeconds = 300;

function normalizeName(name: string): string {
  return name.toLocaleLowerCase();
}

export class HotelService {
  async createHotel(input: CreateHotelDto) {
    const images = input.images.map((image, index) => ({
      url: new URL(image.url).toString(),
      isPrimary: image.isPrimary || (index === 0 && !input.images.some(({ isPrimary }) => isPrimary)),
      sortOrder: index + 1,
    }));

    const { hotel, images: createdImages } = await hotelRepository.create(
      {
        name: input.name,
        normalizedName: normalizeName(input.name),
        description: input.description,
        address: input.address,
        city: input.city,
        countryCode: input.countryCode,
        latitude: input.latitude,
        longitude: input.longitude,
        starRating: input.starRating,
      },
      images,
    );

    try {
      await incrementCacheValue(autocompleteCacheVersionKey);
    } catch (error) {
      console.warn('Autocomplete cache invalidation failed.', error);
    }

    return {
      id: hotel.id,
      name: hotel.name,
      description: hotel.description,
      address: hotel.address,
      city: hotel.city,
      countryCode: hotel.countryCode,
      latitude: hotel.latitude,
      longitude: hotel.longitude,
      starRating: hotel.starRating,
      isActive: hotel.isActive,
      images: createdImages.map((image) => ({
        id: image.id,
        url: image.url,
        isPrimary: image.isPrimary,
        sortOrder: image.sortOrder,
      })),
    };
  }

  async autocomplete(input: AutocompleteHotelsQuery) {
    const normalizedPrefix = normalizeName(input.q);

    try {
      const cacheVersion = (await getCacheValue(autocompleteCacheVersionKey)) ?? '0';
      const cacheKey = `hotels:autocomplete:${cacheVersion}:${encodeURIComponent(normalizedPrefix)}`;
      const cachedHotels = await getCacheValue(cacheKey);

      if (cachedHotels) {
        return JSON.parse(cachedHotels) as AutocompleteHotel[];
      }

      const hotels = await hotelRepository.findActiveByNamePrefix(normalizedPrefix);
      await setCacheValue(cacheKey, JSON.stringify(hotels), autocompleteCacheTtlSeconds);
      return hotels;
    } catch (error) {
      console.warn('Autocomplete cache unavailable; querying PostgreSQL.', error);
      return hotelRepository.findActiveByNamePrefix(normalizedPrefix);
    }
  }

  async getHotelById(id: number) {
    const hotel = await hotelRepository.findById(id);

    if (!hotel) {
      throw new AppError('Hotel not found.', 404);
    }

    const images = await hotelRepository.findImagesByHotelId(hotel.id);

    return {
      id: hotel.id,
      name: hotel.name,
      description: hotel.description,
      address: hotel.address,
      city: hotel.city,
      countryCode: hotel.countryCode,
      latitude: hotel.latitude,
      longitude: hotel.longitude,
      starRating: hotel.starRating,
      isActive: hotel.isActive,
      images: images.map((image) => ({
        id: image.id,
        url: image.url,
        isPrimary: image.isPrimary,
        sortOrder: image.sortOrder,
      })),
    };
  }
}
