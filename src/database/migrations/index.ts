import { createHotelTables } from './001_create_hotel_tables.js';
import type { Migration } from './migration.js';

export const migrations: readonly Migration[] = [createHotelTables];
