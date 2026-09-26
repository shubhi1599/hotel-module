import { closePostgresPool, withTransaction } from '../common/database/postgres.js';
import { migrations } from './migrations/index.js';

async function migrate(): Promise<void> {
  await withTransaction(async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const appliedMigrations = await client.query<{ id: string }>(
      'SELECT id FROM schema_migrations',
    );
    const appliedIds = new Set(appliedMigrations.rows.map(({ id }) => id));

    for (const migration of migrations) {
      if (appliedIds.has(migration.id)) {
        continue;
      }

      await migration.up(client);
      await client.query('INSERT INTO schema_migrations (id) VALUES ($1)', [migration.id]);
      console.info(`Applied migration: ${migration.id}`);
    }
  });
}

migrate()
  .catch((error: unknown) => {
    console.error('Database migration failed.', error);
    process.exitCode = 1;
  })
  .finally(closePostgresPool);
