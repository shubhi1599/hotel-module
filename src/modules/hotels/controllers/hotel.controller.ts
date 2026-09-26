import type { RequestHandler } from 'express';

import { createHotelSchema } from '../dto/create-hotel.dto.js';
import { HotelService } from '../services/hotel.service.js';

const hotelService = new HotelService();

export const createHotel: RequestHandler = async (request, response) => {
  const input = createHotelSchema.parse(request.body);
  const hotel = await hotelService.createHotel(input);

  response.status(201).json({ data: hotel });
};
