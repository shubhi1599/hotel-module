import { Router } from 'express';

import { autocompleteHotels, createHotel, getHotelById } from './controllers/hotel.controller.js';

export const hotelsRouter = Router();

hotelsRouter.get('/autocomplete', autocompleteHotels);
hotelsRouter.post('/', createHotel);
hotelsRouter.get('/:id', getHotelById);
