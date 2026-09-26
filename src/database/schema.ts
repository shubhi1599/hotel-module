import { sql } from 'drizzle-orm';
import {
  bigint,
  bigserial,
  boolean,
  check,
  doublePrecision,
  index,
  integer,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

export const hotels = pgTable(
  'hotels',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    normalizedName: varchar('normalized_name', { length: 255 }).notNull(),
    description: text('description'),
    address: varchar('address', { length: 500 }).notNull(),
    city: varchar('city', { length: 255 }).notNull(),
    countryCode: varchar('country_code', { length: 2 }).notNull(),
    latitude: doublePrecision('latitude').notNull(),
    longitude: doublePrecision('longitude').notNull(),
    starRating: smallint('star_rating').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check('hotels_latitude_range', sql`${table.latitude} BETWEEN -90 AND 90`),
    check('hotels_longitude_range', sql`${table.longitude} BETWEEN -180 AND 180`),
    check('hotels_star_rating_range', sql`${table.starRating} BETWEEN 1 AND 5`),
    index('hotels_active_normalized_name_idx')
      .on(table.normalizedName)
      .where(sql`${table.isActive} = true`),
  ],
);

export const hotelImages = pgTable(
  'hotel_images',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    hotelId: bigint('hotel_id', { mode: 'number' })
      .notNull()
      .references(() => hotels.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    isPrimary: boolean('is_primary').notNull().default(false),
    sortOrder: integer('sort_order').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check('hotel_images_sort_order_positive', sql`${table.sortOrder} >= 1`),
    uniqueIndex('hotel_images_unique_url_per_hotel').on(table.hotelId, table.url),
    uniqueIndex('hotel_images_unique_sort_order_per_hotel').on(table.hotelId, table.sortOrder),
    uniqueIndex('hotel_images_one_primary_per_hotel')
      .on(table.hotelId)
      .where(sql`${table.isPrimary} = true`),
    index('hotel_images_hotel_id_sort_order_idx').on(table.hotelId, table.sortOrder),
  ],
);
