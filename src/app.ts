import express from 'express';
import swaggerUi from 'swagger-ui-express';

import { errorHandler } from './common/middleware/error-handler.js';
import { openApiDocument } from './docs/openapi.js';
import { hotelsRouter } from './modules/hotels/hotels.routes.js';

export function createApp() {
  const app = express();

  app.use(express.json());

  app.get('/health', (_request, response) => {
    response.status(200).json({ status: 'ok' });
  });

  app.get('/openapi.json', (_request, response) => {
    response.status(200).json(openApiDocument);
  });
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

  app.use('/hotels', hotelsRouter);
  app.use(errorHandler);

  return app;
}
