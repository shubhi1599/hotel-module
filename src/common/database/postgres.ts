import { Pool, type PoolClient, type QueryResultRow } from 'pg';

let pool: Pool | undefined;

function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL must be configured before connecting to PostgreSQL.');
  }

  return databaseUrl;
}

export function getPostgresPool(): Pool {
  pool ??= new Pool({ connectionString: getDatabaseUrl() });

  return pool;
}

export async function query<Row extends QueryResultRow>(
  text: string,
  values?: readonly unknown[],
) {
  return getPostgresPool().query<Row>(text, values ? [...values] : undefined);
}

export async function withTransaction<T>(
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPostgresPool().connect();

  try {
    await client.query('BEGIN');
    const result = await operation(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function closePostgresPool(): Promise<void> {
  await pool?.end();
  pool = undefined;
}
