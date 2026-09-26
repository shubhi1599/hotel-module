import type { RequestHandler } from 'express';

import { autocompleteHotelsQuerySchema } from '../dto/autocomplete-hotels.dto.js';
import { createHotelSchema } from '../dto/create-hotel.dto.js';
import { hotelIdParamsSchema } from '../dto/hotel-id.dto.js';
import { HotelService } from '../services/hotel.service.js';

const hotelService = new HotelService();

export const createHotel: RequestHandler = async (request, response) => {
  const input = createHotelSchema.parse(request.body);
  const hotel = await hotelService.createHotel(input);

  response.status(201).json({ data: hotel });
};

export const autocompleteHotels: RequestHandler = async (request, response) => {
  const input = autocompleteHotelsQuerySchema.parse(request.query);
  const hotels = await hotelService.autocomplete(input);

  response.status(200).json(hotels);
};

export const getHotelById: RequestHandler = async (request, response) => {
  const { id } = hotelIdParamsSchema.parse(request.params);
  const hotel = await hotelService.getHotelById(id);

  response.status(200).json(hotel);
};
