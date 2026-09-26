import type { Migration } from './migration.js';

export const createHotelTables: Migration = {
  id: '001_create_hotel_tables',
  async up(client) {
    await client.query(`
      CREATE TABLE hotels (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        normalized_name VARCHAR(255) NOT NULL,
        description TEXT,
        address VARCHAR(500) NOT NULL,
        city VARCHAR(255) NOT NULL,
        country_code CHAR(2) NOT NULL,
        latitude NUMERIC(9, 6) NOT NULL CHECK (latitude BETWEEN -90 AND 90),
        longitude NUMERIC(9, 6) NOT NULL CHECK (longitude BETWEEN -180 AND 180),
        star_rating SMALLINT NOT NULL CHECK (star_rating BETWEEN 1 AND 5),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE hotel_images (
        id BIGSERIAL PRIMARY KEY,
        hotel_id BIGINT NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        is_primary BOOLEAN NOT NULL DEFAULT FALSE,
        sort_order INTEGER NOT NULL CHECK (sort_order >= 1),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT hotel_images_unique_url_per_hotel UNIQUE (hotel_id, url),
        CONSTRAINT hotel_images_unique_sort_order_per_hotel UNIQUE (hotel_id, sort_order)
      );

      CREATE UNIQUE INDEX hotel_images_one_primary_per_hotel
        ON hotel_images (hotel_id)
        WHERE is_primary;

      CREATE INDEX hotels_active_normalized_name_prefix
        ON hotels (normalized_name text_pattern_ops)
        WHERE is_active;

      CREATE INDEX hotel_images_hotel_id_sort_order
        ON hotel_images (hotel_id, sort_order);
    `);
  },
};
