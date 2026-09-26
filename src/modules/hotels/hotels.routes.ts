import { Router } from 'express';

import { autocompleteHotels, createHotel } from './controllers/hotel.controller.js';

export const hotelsRouter = Router();

hotelsRouter.get('/autocomplete', autocompleteHotels);
hotelsRouter.post('/', createHotel);
