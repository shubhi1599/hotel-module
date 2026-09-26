import type { CreateHotelDto } from '../dto/create-hotel.dto.js';
import type { AutocompleteHotelsQuery } from '../dto/autocomplete-hotels.dto.js';
import { AppError } from '../../../common/errors/app-error.js';
import { HotelRepository } from '../repositories/hotel.repository.js';

const hotelRepository = new HotelRepository();

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
    return hotelRepository.findActiveByNamePrefix(normalizeName(input.q));
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
