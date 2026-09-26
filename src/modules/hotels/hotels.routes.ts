import { Router } from 'express';

import { createHotel } from './controllers/hotel.controller.js';

export const hotelsRouter = Router();

hotelsRouter.post('/', createHotel);
