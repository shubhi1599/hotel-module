import { createClient, type RedisClientType } from 'redis';

const redisUrl = process.env.REDIS_URL;
let client: RedisClientType | undefined;
let connecting: Promise<void> | undefined;

async function getClient(): Promise<RedisClientType | undefined> {
  if (!redisUrl) {
    return undefined;
  }

  if (!client) {
    client = createClient({ url: redisUrl });
    client.on('error', (error) => {
      console.warn('Redis client error.', error);
    });
  }

  if (!client.isOpen) {
    connecting ??= client
      .connect()
      .then(() => undefined)
      .finally(() => {
        connecting = undefined;
      });
    await connecting;
  }

  return client;
}

export async function getCacheValue(key: string): Promise<string | undefined> {
  const redis = await getClient();
  return (await redis?.get(key)) ?? undefined;
}

export async function setCacheValue(key: string, value: string, ttlSeconds: number): Promise<void> {
  const redis = await getClient();
  await redis?.set(key, value, { EX: ttlSeconds });
}

export async function incrementCacheValue(key: string): Promise<number | undefined> {
  const redis = await getClient();
  return redis?.incr(key);
}

export async function closeRedis(): Promise<void> {
  if (client?.isOpen) {
    await client.quit();
  }

  client = undefined;
}
