export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'GlobInn Hotel Module API',
    version: '1.0.0',
    description: 'Hotel creation, autocomplete, and details APIs for GlobInn.',
  },
  servers: [{ url: 'http://localhost:3000', description: 'Local Docker environment' }],
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        responses: {
          '200': {
            description: 'Service is available.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { status: { type: 'string', example: 'ok' } },
                  required: ['status'],
                },
              },
            },
          },
        },
      },
    },
    '/hotels': {
      post: {
        summary: 'Create a hotel',
        description:
          'Creates a hotel and its images atomically. If images are supplied without a primary image, the first image becomes primary.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateHotelRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Hotel created.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateHotelResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '500': { $ref: '#/components/responses/InternalServerError' },
        },
      },
    },
    '/hotels/autocomplete': {
      get: {
        summary: 'Autocomplete active hotels',
        description:
          'Performs a case-insensitive, literal prefix search. It returns at most ten minimal hotel records and never returns images.',
        parameters: [
          {
            name: 'q',
            in: 'query',
            required: true,
            description: 'Two or more characters of the hotel name prefix.',
            schema: { type: 'string', minLength: 2, example: 'gra' },
          },
        ],
        responses: {
          '200': {
            description: 'Matching active hotels.',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  maxItems: 10,
                  items: { $ref: '#/components/schemas/AutocompleteHotel' },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '500': { $ref: '#/components/responses/InternalServerError' },
        },
      },
    },
    '/hotels/{id}': {
      get: {
        summary: 'Get hotel details',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', format: 'int64', minimum: 1, example: 101 },
          },
        ],
        responses: {
          '200': {
            description: 'Hotel and its images, ordered by sort order.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Hotel' } },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '404': { $ref: '#/components/responses/NotFoundError' },
          '500': { $ref: '#/components/responses/InternalServerError' },
        },
      },
    },
  },
  components: {
    schemas: {
      CreateHotelRequest: {
        type: 'object',
        additionalProperties: false,
        required: [
          'name',
          'address',
          'city',
          'countryCode',
          'latitude',
          'longitude',
          'starRating',
        ],
        properties: {
          name: { type: 'string', maxLength: 255, example: 'The Grand Hotel' },
          description: { type: 'string', maxLength: 10_000, example: 'Luxury hotel in Delhi' },
          address: { type: 'string', maxLength: 500, example: 'MG Road' },
          city: { type: 'string', maxLength: 255, example: 'Delhi' },
          countryCode: { type: 'string', minLength: 2, maxLength: 2, example: 'IN' },
          latitude: { type: 'number', minimum: -90, maximum: 90, example: 28.6139 },
          longitude: { type: 'number', minimum: -180, maximum: 180, example: 77.209 },
          starRating: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
          images: {
            type: 'array',
            description: 'URLs must be unique; only one item can set isPrimary to true.',
            items: { $ref: '#/components/schemas/CreateHotelImage' },
          },
        },
      },
      CreateHotelImage: {
        type: 'object',
        additionalProperties: false,
        required: ['url'],
        properties: {
          url: { type: 'string', format: 'uri', example: 'https://example.com/hotel.jpg' },
          isPrimary: { type: 'boolean', default: false },
        },
      },
      CreateHotelResponse: {
        type: 'object',
        required: ['data'],
        properties: { data: { $ref: '#/components/schemas/Hotel' } },
      },
      Hotel: {
        type: 'object',
        required: [
          'id',
          'name',
          'address',
          'city',
          'countryCode',
          'latitude',
          'longitude',
          'starRating',
          'isActive',
          'images',
        ],
        properties: {
          id: { type: 'integer', format: 'int64', example: 101 },
          name: { type: 'string', example: 'The Grand Hotel' },
          description: { type: 'string', nullable: true, example: 'Luxury hotel in Delhi' },
          address: { type: 'string', example: 'MG Road' },
          city: { type: 'string', example: 'Delhi' },
          countryCode: { type: 'string', example: 'IN' },
          latitude: { type: 'number', example: 28.6139 },
          longitude: { type: 'number', example: 77.209 },
          starRating: { type: 'integer', example: 5 },
          isActive: { type: 'boolean', example: true },
          images: {
            type: 'array',
            items: { $ref: '#/components/schemas/HotelImage' },
          },
        },
      },
      HotelImage: {
        type: 'object',
        required: ['id', 'url', 'isPrimary', 'sortOrder'],
        properties: {
          id: { type: 'integer', format: 'int64', example: 1 },
          url: { type: 'string', format: 'uri', example: 'https://example.com/hotel.jpg' },
          isPrimary: { type: 'boolean', example: true },
          sortOrder: { type: 'integer', minimum: 1, example: 1 },
        },
      },
      AutocompleteHotel: {
        type: 'object',
        required: ['id', 'name', 'city'],
        properties: {
          id: { type: 'integer', format: 'int64', example: 101 },
          name: { type: 'string', example: 'Grand Hotel' },
          city: { type: 'string', example: 'Delhi' },
        },
      },
      Error: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'object',
            required: ['code', 'message'],
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'The request body is invalid.' },
              details: { type: 'array', items: { type: 'object' } },
            },
          },
        },
      },
    },
    responses: {
      ValidationError: {
        description: 'Request validation failed.',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      NotFoundError: {
        description: 'The requested hotel does not exist.',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      InternalServerError: {
        description: 'Unexpected server error.',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
    },
  },
} as const;
