import express from 'express';

import { errorHandler } from './common/middleware/error-handler.js';
import { hotelsRouter } from './modules/hotels/hotels.routes.js';

export function createApp() {
  const app = express();

  app.use(express.json());

  app.get('/health', (_request, response) => {
    response.status(200).json({ status: 'ok' });
  });

  app.use('/hotels', hotelsRouter);
  app.use(errorHandler);

  return app;
}
