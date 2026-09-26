import { randomUUID } from 'node:crypto';

import { eq, inArray } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, afterEach, describe, expect, it } from 'vitest';

import { createApp } from '../../../app.js';
import { closeRedis } from '../../../common/cache/redis.js';
import { closeDatabase, db } from '../../../database/client.js';
import { hotels } from '../../../database/schema.js';

const app = createApp();
const createdHotelIds: number[] = [];
const runId = randomUUID().replaceAll('-', '');
let sequence = 0;

interface HotelRequest {
  name: string;
  description?: string;
  address: string;
  city: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  starRating: number;
  images?: Array<{ url: string; isPrimary?: boolean }>;
}

function buildHotel(overrides: Partial<HotelRequest> = {}): HotelRequest {
  sequence += 1;

  return {
    name: `Spec${runId}-${sequence} Hotel`,
    address: 'MG Road',
    city: 'Delhi',
    countryCode: 'IN',
    latitude: 28.6139,
    longitude: 77.209,
    starRating: 5,
    ...overrides,
  };
}

async function createHotel(payload: HotelRequest) {
  const response = await request(app).post('/hotels').send(payload);

  if (response.status === 201) {
    createdHotelIds.push(response.body.data.id);
  }

  return response;
}

afterEach(async () => {
  if (createdHotelIds.length) {
    await db.delete(hotels).where(inArray(hotels.id, createdHotelIds));
    createdHotelIds.length = 0;
  }
});

afterAll(async () => {
  await closeRedis();
  await closeDatabase();
});

describe('API documentation', () => {
  it('exposes the OpenAPI specification', async () => {
    const response = await request(app).get('/openapi.json');

    expect(response.status).toBe(200);
    expect(response.body.openapi).toBe('3.0.3');
    expect(response.body.paths['/hotels/autocomplete']).toHaveProperty('get');
  });
});

describe('POST /hotels', () => {
  it('creates a valid hotel and makes the first image primary by default', async () => {
    const response = await createHotel(
      buildHotel({
        images: [
          { url: 'https://example.com/spec-one.jpg' },
          { url: 'https://example.com/spec-two.jpg' },
        ],
      }),
    );

    expect(response.status).toBe(201);
    expect(response.body.data.isActive).toBe(true);
    expect(response.body.data.images).toEqual([
      expect.objectContaining({ isPrimary: true, sortOrder: 1 }),
      expect.objectContaining({ isPrimary: false, sortOrder: 2 }),
    ]);
  });

  it.each([
    ['a missing name', { name: undefined }],
    ['invalid latitude', { latitude: 91 }],
    ['invalid star rating', { starRating: 6 }],
    ['an invalid image URL', { images: [{ url: 'not-a-url' }] }],
    [
      'multiple primary images',
      {
        images: [
          { url: 'https://example.com/primary-one.jpg', isPrimary: true },
          { url: 'https://example.com/primary-two.jpg', isPrimary: true },
        ],
      },
    ],
    [
      'duplicate image URLs',
      {
        images: [
          { url: 'https://example.com/duplicate.jpg' },
          { url: 'https://example.com/duplicate.jpg' },
        ],
      },
    ],
  ])('rejects %s', async (_description, overrides) => {
    const response = await createHotel(buildHotel(overrides));

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /hotels/autocomplete', () => {
  it('rejects a query shorter than two characters', async () => {
    const response = await request(app).get('/hotels/autocomplete?q=a');

    expect(response.status).toBe(400);
  });

  it('performs case-insensitive prefix matching and returns no images', async () => {
    const prefix = `case${runId}`;
    const response = await createHotel(buildHotel({ name: `${prefix} Hotel` }));
    const hotelId = response.body.data.id;

    const autocompleteResponse = await request(app).get(
      `/hotels/autocomplete?q=${prefix.toUpperCase()}`,
    );

    expect(autocompleteResponse.status).toBe(200);
    expect(autocompleteResponse.body).toContainEqual({
      id: hotelId,
      name: `${prefix} Hotel`,
      city: 'Delhi',
    });
    expect(autocompleteResponse.body[0]).not.toHaveProperty('images');
  });

  it('returns at most ten active hotels', async () => {
    const prefix = `limit${runId}`;

    for (let index = 0; index < 11; index += 1) {
      await createHotel(buildHotel({ name: `${prefix}-${index}` }));
    }

    const response = await request(app).get(`/hotels/autocomplete?q=${prefix}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(10);
  });

  it('excludes inactive hotels', async () => {
    const prefix = `hidden${runId}`;
    const createResponse = await createHotel(buildHotel({ name: `${prefix} Hotel` }));

    await db
      .update(hotels)
      .set({ isActive: false })
      .where(eq(hotels.id, createResponse.body.data.id));

    const response = await request(app).get(`/hotels/autocomplete?q=${prefix}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });
});

describe('GET /hotels/:id', () => {
  it('returns an existing hotel with images ordered by sortOrder', async () => {
    const createResponse = await createHotel(
      buildHotel({
        images: [
          { url: 'https://example.com/details-first.jpg' },
          { url: 'https://example.com/details-second.jpg', isPrimary: true },
        ],
      }),
    );

    const response = await request(app).get(`/hotels/${createResponse.body.data.id}`);

    expect(response.status).toBe(200);
    expect(response.body.images).toEqual([
      expect.objectContaining({ url: 'https://example.com/details-first.jpg', sortOrder: 1 }),
      expect.objectContaining({ url: 'https://example.com/details-second.jpg', sortOrder: 2 }),
    ]);
  });

  it('returns 404 for a hotel that does not exist', async () => {
    const response = await request(app).get('/hotels/999999999');

    expect(response.status).toBe(404);
    expect(response.body.error.message).toBe('Hotel not found.');
  });
});
